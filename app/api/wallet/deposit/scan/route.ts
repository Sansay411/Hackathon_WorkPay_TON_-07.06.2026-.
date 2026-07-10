import { NextResponse } from "next/server";
import { z } from "zod";
import { getVerifiedProfile } from "@/lib/api/profile";
import { ProviderBackedTonPaymentVerifier } from "@/lib/ton/paymentVerifier";

const scanSchema = z.object({
  initData: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d{1,9})?$/),
  network: z.enum(["mainnet", "testnet"]).default("testnet")
});

function tonCenterUrl(network: "mainnet" | "testnet") {
  return network === "mainnet"
    ? "https://toncenter.com/api/v3/transactions"
    : "https://testnet.toncenter.com/api/v3/transactions";
}

function getTransactionHash(transaction: Record<string, unknown>) {
  const transactionId = transaction.transaction_id;
  if (typeof transaction.hash === "string") return transaction.hash;
  if (transactionId && typeof transactionId === "object" && transactionId !== null) {
    const hash = (transactionId as Record<string, unknown>).hash;
    if (typeof hash === "string") return hash;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const parsed = scanSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid deposit scan request" }, { status: 400 });
    }

    const { initData, amount, network } = parsed.data;
    const profileResult = await getVerifiedProfile(initData);
    if (profileResult.status !== "ready") {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }
    const profile = profileResult.profile;
    const senderWallet = profile.walletAddress;
    const escrowWallet = process.env.ESCROW_WALLET_ADDRESS;

    if (!senderWallet || !escrowWallet) {
      return NextResponse.json({ error: "Wallet deposit is not configured" }, { status: 503 });
    }

    const url = new URL(tonCenterUrl(network));
    url.searchParams.set("account", escrowWallet);
    url.searchParams.set("limit", "50");
    url.searchParams.set("sort", "desc");

    const response = await fetch(url, {
      headers: process.env.TONCENTER_API_KEY
        ? { "X-API-Key": process.env.TONCENTER_API_KEY }
        : undefined,
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json({ error: "TON transaction index is unavailable" }, { status: 502 });
    }

    const payload = (await response.json()) as { transactions?: unknown[] };
    const verifier = new ProviderBackedTonPaymentVerifier();
    const expectedComment = `deposit:${profile.id}`;

    for (const item of payload.transactions ?? []) {
      if (!item || typeof item !== "object") continue;
      const txHash = getTransactionHash(item as Record<string, unknown>);
      if (!txHash) continue;

      const result = await verifier.verify({
        txHash,
        expectedEscrowWallet: escrowWallet,
        expectedSenderWallet: senderWallet,
        expectedAmount: amount,
        expectedAsset: "TON",
        expectedComment,
        network
      });

      if (result.status === "confirmed") {
        return NextResponse.json({ verified: true, txHash });
      }
    }

    return NextResponse.json({ verified: false });
  } catch (error) {
    console.error("Deposit scan failed", error);
    return NextResponse.json({ error: "Unable to scan TON deposits" }, { status: 500 });
  }
}
