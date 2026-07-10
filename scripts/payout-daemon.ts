import * as dotenv from "dotenv";
import { mnemonicToWalletKey } from "@ton/crypto";
import { TonClient, WalletContractV4, internal } from "@ton/ton";
import { beginCell, toNano, Address } from "@ton/core";
import { createSupabaseServiceRoleClient } from "../lib/supabase/server";
import { supportedJettons } from "../lib/ton/jettons";

// Load environment variables
dotenv.config({ path: ".env.local" });

const network = (process.env.NEXT_PUBLIC_TON_NETWORK === "mainnet" ? "mainnet" : "testnet") as "mainnet" | "testnet";

async function runDaemon() {
  console.log(`[Payout Daemon] Starting in ${network} mode...`);

  const mnemonic = process.env.ESCROW_WALLET_MNEMONIC;
  if (!mnemonic) {
    throw new Error("[Payout Daemon] Critical Error: ESCROW_WALLET_MNEMONIC is not defined in environment variables.");
  }

  const supabaseClient = createSupabaseServiceRoleClient();
  if (!supabaseClient) {
    throw new Error("[Payout Daemon] Critical Error: Failed to initialize Supabase service role client.");
  }
  const supabase = supabaseClient;

  // 1. Initialize TON Wallet
  let keyPair: { publicKey: Buffer; secretKey: Buffer };
  try {
    keyPair = await mnemonicToWalletKey(mnemonic.trim().split(/\s+/));
  } catch {
    throw new Error("[Payout Daemon] Critical Error: Invalid ESCROW_WALLET_MNEMONIC seed phrase.");
  }

  const client = new TonClient({
    endpoint: network === "mainnet"
      ? "https://toncenter.com/api/v2/jsonRPC"
      : "https://testnet.toncenter.com/api/v2/jsonRPC",
    apiKey: process.env.TONCENTER_API_KEY
  });

  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: keyPair.publicKey
  });

  const walletContract = client.open(wallet);
  console.log(`[Payout Daemon] Hot wallet loaded: ${wallet.address.toString({ bounceable: false })}`);

  // Define USDT Master Address
  const usdtConfig = supportedJettons[network].find((j) => j.symbol === "USDT");
  const usdtMasterAddressStr = usdtConfig?.address || null;

  async function processNextPayout() {
    try {
      // 2. Safe query from payouts queue (limit 1 to prevent seqno/nonce collisions)
      const { data: payout, error: fetchError } = await supabase
        .from("payouts")
        .select("id, deal_id, recipient_id, recipient_wallet, amount, asset, fee_deducted, status")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error("[Payout Daemon] Database fetch error:", fetchError);
        return;
      }

      if (!payout) {
        return;
      }

      console.log(`[Payout Daemon] Found pending payout ${payout.id} for deal ${payout.deal_id}. Amount: ${payout.amount} ${payout.asset}`);

      // 3. Prevent Race Condition: Lock row by shifting status from 'pending' to 'processing'
      const { data: lockedPayout, error: lockError } = await supabase
        .from("payouts")
        .update({ status: "processing" })
        .eq("id", payout.id)
        .eq("status", "pending")
        .select()
        .maybeSingle();

      if (lockError || !lockedPayout) {
        console.warn(`[Payout Daemon] Payout ${payout.id} was already locked by another process or update failed.`);
        return;
      }

      console.log(`[Payout Daemon] Payout ${payout.id} locked successfully. Processing transfer...`);

      // Verify recipient wallet format
      let recipientAddress;
      try {
        recipientAddress = Address.parse(payout.recipient_wallet);
      } catch {
        console.error(`[Payout Daemon] Invalid recipient address: ${payout.recipient_wallet}. Rejecting payout.`);
        await failPayout(payout.id, "Invalid recipient TON address format.");
        return;
      }

      // Get wallet seqno
      let seqno;
      try {
        seqno = await walletContract.getSeqno();
      } catch (err) {
        console.error("[Payout Daemon] Failed to retrieve seqno from TON RPC node. Retrying in next loop.", err);
        // Release lock
        await supabase.from("payouts").update({ status: "pending" }).eq("id", payout.id);
        return;
      }

      let transferCell;
      if (payout.asset === "TON") {
        // Create direct TON transfer
        const amountNano = toNano(payout.amount.toString());
        const comment = `workpay:release:${payout.id}`;

        transferCell = wallet.createTransfer({
          seqno,
          secretKey: keyPair.secretKey,
          messages: [
            internal({
              to: recipientAddress,
              value: amountNano,
              bounce: false,
              body: comment
            })
          ]
        });
      } else if (payout.asset === "USDT") {
        if (!usdtMasterAddressStr) {
          console.error("[Payout Daemon] USDT master address is not configured. Failing payout.");
          await failPayout(payout.id, "USDT Jetton contract is not configured on this network.");
          return;
        }

        const usdtMasterAddress = Address.parse(usdtMasterAddressStr);

        // Fetch hot wallet's USDT Jetton wallet address
        let escrowJettonWalletAddress;
        try {
          const result = await client.runMethod(usdtMasterAddress, "get_wallet_address", [
            { type: "slice", cell: beginCell().storeAddress(wallet.address).endCell() }
          ]);
          escrowJettonWalletAddress = result.stack.readAddress();
        } catch (err) {
          console.error("[Payout Daemon] Failed to resolve hot wallet USDT wallet address.", err);
          // Release lock
          await supabase.from("payouts").update({ status: "pending" }).eq("id", payout.id);
          return;
        }

        // Decimal for USDT is 6. Convert amount to units
        const usdtUnits = BigInt(Math.round(Number(payout.amount) * 1_000_000));
        const comment = `workpay:release:${payout.id}`;

        const jettonTransferBody = beginCell()
          .storeUint(0xf8a7ea5, 32) // op::transfer
          .storeUint(0, 64) // query_id
          .storeCoins(usdtUnits) // jetton amount
          .storeAddress(recipientAddress) // to
          .storeAddress(wallet.address) // response_destination
          .storeBit(false) // custom_payload (none)
          .storeCoins(toNano("0.05")) // forward_ton_amount
          .storeBit(true) // forward_payload in reference cell
          .storeRef(beginCell().storeUint(0, 32).storeStringTail(comment).endCell()) // comment payload
          .endCell();

        transferCell = wallet.createTransfer({
          seqno,
          secretKey: keyPair.secretKey,
          messages: [
            internal({
              to: escrowJettonWalletAddress,
              value: toNano("0.1"), // 0.1 TON to cover Jetton transfer fees
              bounce: true,
              body: jettonTransferBody
            })
          ]
        });
      } else {
        console.error(`[Payout Daemon] Unsupported payout asset: ${payout.asset}`);
        await failPayout(payout.id, `Unsupported asset: ${payout.asset}`);
        return;
      }

      // Calculate transaction hash before broadcast for exact database tracking
      const txHash = transferCell.hash().toString("hex");

      // 4. Send transaction to TON blockchain
      try {
        await client.sendFile(transferCell.toBoc());
        console.log(`[Payout Daemon] Transaction broadcasted successfully. TxHash: ${txHash}`);
      } catch (err) {
        console.error("[Payout Daemon] Blockchain broadcast error. Reverting lock status.", err);
        // Release lock
        await supabase.from("payouts").update({ status: "pending" }).eq("id", payout.id);
        return;
      }

      // 5. Finalize database state
      const { error: payoutUpdateErr } = await supabase
        .from("payouts")
        .update({
          status: "completed",
          tx_hash: txHash
        })
        .eq("id", payout.id);

      if (payoutUpdateErr) {
        console.error(`[Payout Daemon] Failed to finalize payout status for ${payout.id}:`, payoutUpdateErr);
      }

      const { error: dealUpdateErr } = await supabase
        .from("deals")
        .update({
          release_tx_hash: txHash
        })
        .eq("id", payout.deal_id);

      if (dealUpdateErr) {
        console.error(`[Payout Daemon] Failed to update release_tx_hash for deal ${payout.deal_id}:`, dealUpdateErr);
      }

      console.log(`[Payout Daemon] Payout ${payout.id} completed and logged successfully.`);

    } catch (err) {
      console.error("[Payout Daemon] Unexpected processing error:", err);
    }
  }

  async function failPayout(payoutId: string, reason: string) {
    await supabase
      .from("payouts")
      .update({
        status: "failed"
      })
      .eq("id", payoutId);

    console.error(`[Payout Daemon] Payout ${payoutId} marked as FAILED. Reason: ${reason}`);
  }

  const runOnce = process.argv.includes("--once");

  if (runOnce) {
    console.log("[Payout Daemon] Running single execution iteration...");
    await processNextPayout();
    console.log("[Payout Daemon] Execution iteration completed.");
    process.exit(0);
  } else {
    console.log("[Payout Daemon] Entering active polling loop (polling every 10 seconds)...");
    setInterval(async () => {
      await processNextPayout();
    }, 10_000);
  }
}

// Execute daemon
runDaemon().catch((err) => {
  console.error("[Payout Daemon] Fatal execution error:", err);
  process.exit(1);
});
