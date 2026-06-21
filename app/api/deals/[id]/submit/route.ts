import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { sendBotNotification } from "@/lib/telegram/notifications";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return apiError("bad_request", "Missing request body.", 400);
  }

  const { initData, message, file_url } = body;
  if (!message) {
    return apiError("bad_request", "Message is required to submit work.", 400);
  }

  const profileResult = await getVerifiedProfile(initData);
  if (profileResult.status !== "ready") {
    return apiError("unauthorized", "Authentication failed.", 401);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return apiError("setup_required", "Supabase service role is not configured.", 503);
  }

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select(`
      id, 
      title,
      status, 
      freelancer_id,
      client_id,
      client:client_id (telegram_id)
    `)
    .eq("id", id)
    .single();

  if (dealError || !deal) {
    return apiError("not_found", "Deal not found.", 404);
  }

  if (deal.freelancer_id !== profileResult.profile.id) {
    return apiError("forbidden", "Only the assigned freelancer can submit work.", 403);
  }

  // Insert delivery
  const { error: deliveryError } = await supabase
    .from("deliveries")
    .insert({
      deal_id: id,
      freelancer_id: profileResult.profile.id,
      message: message.trim(),
      storage_path: file_url ? file_url.trim() : null
    });

  if (deliveryError) {
    return apiError("server_error", "Failed to save delivery.", 500);
  }

  // Transition deal status to 'submitted'
  const oldStatus = deal.status;
  const { error: updateError } = await supabase
    .from("deals")
    .update({ status: "submitted" })
    .eq("id", id);

  if (updateError) {
    return apiError("server_error", "Failed to update deal status.", 500);
  }

  // Log event
  await supabase.from("deal_events").insert({
    deal_id: id,
    actor_id: profileResult.profile.id,
    event_type: "work_submitted",
    from_status: oldStatus,
    to_status: "submitted"
  });

  // Notify client of work submission
  const clientTelegramId = (deal.client as { telegram_id?: string })?.telegram_id;
  if (clientTelegramId) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://workpay-ton-fixed.vercel.app";
    const text = `📤 Freelancer submitted deliverables for "<b>${deal.title}</b>". Please review and release the escrow payment.`;
    await sendBotNotification(
      clientTelegramId,
      text,
      "Review Work",
      `${appUrl}/deals/${deal.id}`
    );
  }

  return apiOk({ dealId: id, status: "submitted", auditEvent: "work_submitted" });
}
