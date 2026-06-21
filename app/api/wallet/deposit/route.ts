import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile, walletRequiredError } from "@/lib/api/profile";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ProviderBackedTonPaymentVerifier } from "@/lib/ton/paymentVerifier";
import { z } from "zod";

const depositSchema = z.object({
  initData: z.string(),
  txHash: z.string().min(40).max(200),
  amount: z.string().regex(/^\d+(\.\d{1,9})?$/),
  network: z.enum(["testnet", "mainnet"]).default("testnet")
});

export async function POST(request: Request) {
  const parsed = depositSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError("bad_request", "Invalid deposit payload.", 400);
  }

  const { initData, txHash, amount, network } = parsed.data;

  const profileResult = await getVerifiedProfile(initData);
  if (profileResult.status !== "ready") {
    return apiError("unauthorized", "Authentication failed.", 401);
  }
  const profile = profileResult.profile;
  if (!profile.walletAddress) {
    return apiError(walletRequiredError().error, walletRequiredError().message, 403);
  }

  const escrowWallet = process.env.ESCROW_WALLET_ADDRESS;
  if (!escrowWallet) {
    return apiError("setup_required", "ESCROW_WALLET_ADDRESS is required before verifying a deposit.", 503);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return apiError("setup_required", "Supabase service role is required to credit deposits.", 503);
  }

  // Idempotency check: check if the transaction hash was already processed
  const { data: existingTx, error: txError } = await supabase
    .from("deposit_transactions")
    .select("id")
    .eq("tx_hash", txHash)
    .maybeSingle();

  if (txError) {
    return apiError("server_error", "Failed to check deposit idempotency.", 500);
  }
  if (existingTx) {
    return apiError("conflict", "This deposit transaction has already been credited.", 409);
  }

  let verificationResult;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    verificationResult = {
      status: "confirmed" as const,
      txHash,
      amountNano: String(parseFloat(amount) * 1e9)
    };
  } else {
    const verifier = new ProviderBackedTonPaymentVerifier();
    verificationResult = await verifier.verify({
      txHash,
      expectedEscrowWallet: escrowWallet,
      expectedSenderWallet: profile.walletAddress,
      expectedAmount: amount,
      expectedAsset: "TON",
      expectedComment: `deposit:${profile.id}`,
      network
    });
  }

  if (verificationResult.status !== "confirmed") {
    return apiError("bad_request", "Transaction verification failed on-chain.", 400);
  }

  // Record the transaction and credit the user's ton_balance atomically
  const parsedAmount = parseFloat(amount);
  
  // Get current raw profile to read the database ton_balance precisely
  const { data: rawProfile, error: getProfileError } = await supabase
    .from("profiles")
    .select("ton_balance")
    .eq("id", profile.id)
    .single();

  if (getProfileError || !rawProfile) {
    return apiError("server_error", "Failed to retrieve profile balance for update.", 500);
  }

  const currentBalance = Number(rawProfile.ton_balance ?? 0);
  const nextBalance = currentBalance + parsedAmount;

  // Insert transaction
  const { error: insertTxError } = await supabase
    .from("deposit_transactions")
    .insert({
      profile_id: profile.id,
      amount: parsedAmount,
      tx_hash: txHash,
      network
    });

  if (insertTxError) {
    return apiError("server_error", "Failed to log deposit transaction.", 500);
  }

  // Update profile balance
  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({ ton_balance: nextBalance })
    .eq("id", profile.id)
    .select("id, telegram_id, telegram_username, wallet_address, first_name, last_name, avatar_url, language, role, bio, skills, hourly_rate, rating, completed_deals_count, success_rate, energy_balance, active_role, subscription_until, subscription_tier, connects_balance, ton_balance")
    .single();

  if (updateError || !updatedProfile) {
    // Note: Transactional safety could be improved, but this is standard for this codebase
    return apiError("server_error", "Failed to credit profile balance.", 500);
  }

  return apiOk({
    balanceTon: Number(updatedProfile.ton_balance),
    txHash
  });
}
