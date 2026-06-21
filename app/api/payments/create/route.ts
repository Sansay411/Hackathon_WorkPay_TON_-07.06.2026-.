import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile, walletRequiredError } from "@/lib/api/profile";
import { paymentCreateSchema } from "@/lib/api/validation";
import { buildTonTransferRequest, tonToNano } from "@/lib/ton/transactionBuilder";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = paymentCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError("bad_request", "Invalid payment create payload.", 400);
  }

  const { initData, dealId, asset } = parsed.data;

  const profileResult = await getVerifiedProfile(initData);
  if (profileResult.status === "telegram_required") {
    return apiError("telegram_required", profileResult.message, 400);
  }
  if (profileResult.status === "setup_required") {
    return apiError("setup_required", profileResult.message, 503);
  }
  if (profileResult.status === "unauthorized") {
    return apiError("unauthorized", profileResult.message, 401);
  }
  if (!profileResult.profile.walletAddress) {
    return apiError(walletRequiredError().error, walletRequiredError().message, 403);
  }

  if (process.env.NEXT_PUBLIC_TON_NETWORK === "mainnet" && process.env.NEXT_PUBLIC_ENABLE_MAINNET !== "true") {
    return apiError("bad_request", "Mainnet payment creation is disabled.", 400);
  }

  if (asset !== "TON") {
    return apiError("bad_request", "Only TON assets are supported in the current custodial escrow configuration.", 400);
  }

  const escrowWallet = process.env.ESCROW_WALLET_ADDRESS;
  if (!escrowWallet) {
    return apiError("setup_required", "ESCROW_WALLET_ADDRESS is not configured. Direct TON payment cannot be created.", 503);
  }

  if (dealId === "wallet-readiness") {
    const depositAmount = parsed.data.amount || "1.0";
    const amountNano = tonToNano(depositAmount);
    const reference = `deposit:${profileResult.profile.id}`;
    return apiOk({
      provider: { status: "ready", missing: [] },
      payment: {
        dealId,
        payerWallet: profileResult.profile.walletAddress,
        escrowWallet,
        asset: "TON",
        amount: depositAmount,
        amountNano,
        network: process.env.NEXT_PUBLIC_TON_NETWORK === "mainnet" ? "mainnet" : "testnet",
        reference
      },
      transaction: buildTonTransferRequest({
        destination: escrowWallet,
        amount: amountNano,
        asset: "TON",
        comment: reference
      }),
      auditEvent: "deposit_payment_started"
    });
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return apiError("setup_required", "Supabase service role is not configured.", 503);
  }

  // Fetch the deal to verify existence and check that the sender is the client
  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("id, client_id, price_amount, price_token")
    .eq("id", dealId)
    .single();

  if (dealError || !deal) {
    return apiError("not_found", "Deal not found.", 404);
  }

  if (deal.client_id !== profileResult.profile.id) {
    return apiError("forbidden", "Only the client of the deal can initiate the payment.", 403);
  }



  const priceAmountStr = Number(deal.price_amount).toString();
  const amountNano = tonToNano(priceAmountStr);
  const reference = `workpay:${deal.id}`;

  return apiOk({
    provider: {
      status: "ready",
      missing: []
    },
    payment: {
      dealId: deal.id,
      payerWallet: profileResult.profile.walletAddress,
      escrowWallet,
      asset: deal.price_token,
      amount: priceAmountStr,
      amountNano,
      network: process.env.NEXT_PUBLIC_TON_NETWORK === "mainnet" ? "mainnet" : "testnet",
      reference
    },
    transaction: buildTonTransferRequest({
      destination: escrowWallet,
      amount: amountNano,
      asset: deal.price_token,
      comment: reference
    }),
    auditEvent: "payment_started"
  });
}
