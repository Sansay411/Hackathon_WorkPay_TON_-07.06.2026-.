import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";
import { assertDealTransition } from "@/lib/domain/deal-status";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendBotNotification } from "@/lib/telegram/notifications";

interface ProfileInfo {
  id: string;
  wallet_address: string | null;
  telegram_id: string | null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return apiError("bad_request", "Missing request body.", 400);
  }

  const { initData, status: targetStatus } = body;
  if (!targetStatus) {
    return apiError("bad_request", "Target status is required.", 400);
  }

  const profileResult = await getVerifiedProfile(initData);
  if (profileResult.status !== "ready") {
    return apiError("unauthorized", "Authentication failed.", 401);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return apiError("setup_required", "Supabase service role is required to transition status.", 503);
  }

  // Fetch deal details joined with client and freelancer profiles using service_role
  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select(`
      id, 
      status, 
      title, 
      price_amount,
      price_token,
      client_id, 
      freelancer_id,
      client:client_id (id, wallet_address, telegram_id),
      freelancer:freelancer_id (id, wallet_address, telegram_id)
    `)
    .eq("id", id)
    .single();

  if (dealError || !deal) {
    return apiError("not_found", "Deal not found.", 404);
  }

  const isClient = deal.client_id === profileResult.profile.id;
  const isFreelancer = deal.freelancer_id === profileResult.profile.id;

  if (!isClient && !isFreelancer) {
    return apiError("forbidden", "You do not have access to this deal.", 403);
  }

  const clientProfile = deal.client as unknown as ProfileInfo | null;
  const freelancerProfile = deal.freelancer as unknown as ProfileInfo | null;

  // -------------------------------------------------------------
  // Transition logic for COMPLETED state
  // -------------------------------------------------------------
  if (targetStatus === "completed") {
    if (!isClient) {
      return apiError("forbidden", "Only the client can release escrow payments.", 403);
    }
    if (deal.status !== "submitted") {
      return apiError("conflict", `Escrow payment can only be released if the work is submitted. Current status: ${deal.status}`, 409);
    }

    const freelancerWallet = freelancerProfile?.wallet_address;
    if (!freelancerWallet) {
      return apiError("freelancer_wallet_missing", "Freelancer must connect their TON wallet first so we can schedule the payout.", 400);
    }

    const priceAmount = Number(deal.price_amount);
    const platformFeeAmount = priceAmount * 0.05; // 5% fee
    const payoutAmount = priceAmount - platformFeeAmount; // 95% payout

    // Perform atomic updates via service_role to bypass client-level RLS restrictions
    // 1. Update deal status, platform fee amount, and token
    const { error: updateError } = await supabase
      .from("deals")
      .update({
        status: "completed",
        platform_fee_amount: platformFeeAmount,
        platform_fee_token: deal.price_token
      })
      .eq("id", id);

    if (updateError) {
      return apiError("server_error", "Failed to update deal status to completed.", 500);
    }

    // 2. Queue payout log in payouts table
    const { error: payoutError } = await supabase
      .from("payouts")
      .insert({
        deal_id: id,
        recipient_id: deal.freelancer_id,
        recipient_wallet: freelancerWallet,
        amount: payoutAmount,
        asset: deal.price_token,
        fee_deducted: platformFeeAmount,
        status: "pending"
      });

    if (payoutError) {
      console.error("Failed to insert payout queue record:", payoutError);
    }

    // 3. Insert deal event
    await supabase.from("deal_events").insert({
      deal_id: id,
      actor_id: profileResult.profile.id,
      event_type: "deal_completed",
      from_status: deal.status,
      to_status: "completed"
    });

    // 4. Notify freelancer of payout release
    const freelancerTelegramId = freelancerProfile?.telegram_id;
    if (freelancerTelegramId) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workpay-ton-fixed.vercel.app";
      const text = `🎉 <b>Заказчик утвердил выполнение работы!</b>\n\nСредства в размере <b>${payoutAmount} ${deal.price_token}</b> отправлены на выплату.`;
      await sendBotNotification(
        freelancerTelegramId,
        text,
        "View Details",
        `${appUrl}/deals/${id}`
      );
    }

    return apiOk({ dealId: id, status: "completed" });
  }

  // -------------------------------------------------------------
  // Transition logic for OTHER states (waiting_payment, in_progress, etc.)
  // -------------------------------------------------------------
  if (targetStatus === "waiting_payment" && !isFreelancer) {
    return apiError("forbidden", "Only the freelancer can accept the contract.", 403);
  }
  if (targetStatus === "in_progress" && !isFreelancer) {
    return apiError("forbidden", "Only the freelancer can start work.", 403);
  }

  try {
    assertDealTransition(deal.status, targetStatus);
  } catch (error) {
    return apiError("conflict", error instanceof Error ? error.message : "Invalid status transition.", 409);
  }

  const oldStatus = deal.status;
  const { error: updateError } = await supabase
    .from("deals")
    .update({ status: targetStatus })
    .eq("id", id);

  if (updateError) {
    return apiError("server_error", "Failed to update status in database.", 500);
  }

  // Log audit event
  await supabase.from("deal_events").insert({
    deal_id: id,
    actor_id: profileResult.profile.id,
    event_type: `deal_${targetStatus}`,
    from_status: oldStatus,
    to_status: targetStatus
  });

  // Notify counterpart
  const counterpartTelegramId = isClient
    ? freelancerProfile?.telegram_id
    : clientProfile?.telegram_id;

  if (counterpartTelegramId) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workpay-ton-fixed.vercel.app";
    let text = "";

    if (targetStatus === "waiting_payment") {
      text = `✅ Freelancer accepted your escrow contract "<b>${deal.title}</b>". It is now ready for funding.`;
    } else if (targetStatus === "in_progress") {
      text = `🚀 Freelancer started work on "<b>${deal.title}</b>".`;
    } else if (targetStatus === "disputed") {
      text = `⚠️ Escrow contract "<b>${deal.title}</b>" has been disputed. An arbitrator is reviewing the terms and deliverables.`;
    } else if (targetStatus === "cancelled") {
      text = `❌ Escrow contract "<b>${deal.title}</b>" has been cancelled.`;
    }

    if (text) {
      await sendBotNotification(
        counterpartTelegramId,
        text,
        "View Details",
        `${appUrl}/deals/${deal.id}`
      );
    }
  }

  return apiOk({ dealId: id, status: targetStatus });
}
