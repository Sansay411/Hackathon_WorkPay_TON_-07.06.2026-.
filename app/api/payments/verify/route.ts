import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile, walletRequiredError } from "@/lib/api/profile";
import { paymentVerifySchema } from "@/lib/api/validation";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ProviderBackedTonPaymentVerifier } from "@/lib/ton/paymentVerifier";
import { sendBotNotification } from "@/lib/telegram/notifications";

export const dynamic = "force-dynamic";

interface ProfileInfo {
  id: string;
  wallet_address: string | null;
  telegram_id: string | null;
}

export async function POST(request: Request) {
  const parsed = paymentVerifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError("bad_request", "Invalid payment verify payload.", 400);
  }

  if (parsed.data.network === "mainnet" && process.env.NEXT_PUBLIC_ENABLE_MAINNET !== "true") {
    return apiError("bad_request", "Mainnet payment verification is disabled.", 400);
  }

  const profileResult = await getVerifiedProfile(parsed.data.initData);
  if (profileResult.status !== "ready") {
    return apiError("unauthorized", "Authentication failed.", 401);
  }
  if (!profileResult.profile.walletAddress) {
    return apiError(walletRequiredError().error, walletRequiredError().message, 403);
  }

  const escrowWallet = process.env.ESCROW_WALLET_ADDRESS;
  if (!escrowWallet) {
    return apiError("setup_required", "ESCROW_WALLET_ADDRESS is required before verifying a TON payment.", 503);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return apiError("setup_required", "Supabase service role is required to verify payments.", 503);
  }

  // Fetch deal details using service role to bypass client-level RLS restrict
  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select(`
      id, 
      title,
      status, 
      price_amount, 
      price_token, 
      client_id, 
      freelancer_id,
      client:client_id (id, wallet_address, telegram_id),
      freelancer:freelancer_id (id, wallet_address, telegram_id)
    `)
    .eq("id", parsed.data.dealId)
    .single();

  if (dealError || !deal) {
    return apiError("not_found", "Deal not found.", 404);
  }

  // Idempotency: If already funded or complete, skip blockchain verify and return success
  if (deal.status === "funded" || deal.status === "completed") {
    return apiOk({
      dealId: deal.id,
      verification: { status: "confirmed", txHash: parsed.data.txHash }
    });
  }

  // Business logic check: must be draft or waiting_payment to receive fundings
  if (deal.status !== "draft" && deal.status !== "waiting_payment") {
    return apiError("conflict", `Escrow contract status must be draft or waiting_payment, current status: ${deal.status}`, 409);
  }

  const clientProfile = deal.client as unknown as ProfileInfo | null;
  const freelancerProfile = deal.freelancer as unknown as ProfileInfo | null;

  const verifier = new ProviderBackedTonPaymentVerifier();
  const verificationResult = await verifier.verify({
    txHash: parsed.data.txHash,
    expectedEscrowWallet: escrowWallet,
    expectedSenderWallet: clientProfile?.wallet_address || "",
    expectedAmount: String(deal.price_amount),
    expectedAsset: deal.price_token,
    expectedComment: `workpay:${deal.id}`,
    network: parsed.data.network
  });

  if (verificationResult.status !== "confirmed") {
    return apiError(
      "bad_request",
      (verificationResult as { reason?: string }).reason ?? "Transaction verification failed on-chain.",
      400
    );
  }

  // Perform database updates using service_role to bypass client-level RLS restrictions
  const oldStatus = deal.status;
  const nextStatus = "funded";

  // 1. Update deal status
  const { error: updateError } = await supabase
    .from("deals")
    .update({ 
      status: nextStatus,
      funding_tx_hash: parsed.data.txHash
    })
    .eq("id", deal.id);

  if (updateError) {
    return apiError("server_error", "Failed to update deal status in database.", 500);
  }

  // 2. Insert payment row
  const payerWallet = clientProfile?.wallet_address || "";
  const receiverWallet = freelancerProfile?.wallet_address || "";
  const { error: paymentError } = await supabase.from("payments").insert({
    deal_id: deal.id,
    payer_wallet: payerWallet,
    receiver_wallet: receiverWallet,
    escrow_wallet: escrowWallet,
    amount: deal.price_amount,
    asset: deal.price_token,
    network: parsed.data.network,
    status: "verified",
    tx_hash: parsed.data.txHash
  });

  if (paymentError) {
    console.error("Failed to insert payment audit log:", paymentError);
  }

  // 3. Log deal event
  await supabase.from("deal_events").insert({
    deal_id: deal.id,
    actor_id: profileResult.profile.id,
    event_type: "deal_funded",
    from_status: oldStatus,
    to_status: nextStatus
  });

  // 4. Notify freelancer of locked escrow funds
  const freelancerTelegramId = freelancerProfile?.telegram_id;
  if (freelancerTelegramId) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workpay-ton-fixed.vercel.app";
    const text = `💰 <b>Заказчик внес оплату в эскроу.</b>\n\nПроект переведен в статус "В работе". Вы можете приступать к выполнению!`;
    await sendBotNotification(
      freelancerTelegramId,
      text,
      "Start Work",
      `${appUrl}/deals/${deal.id}`
    );
  }

  return apiOk({
    dealId: deal.id,
    network: parsed.data.network,
    verification: verificationResult
  });
}
