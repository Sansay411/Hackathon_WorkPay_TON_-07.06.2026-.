import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return apiError("bad_request", "Missing request body.", 400);
  }

  const { initData } = body;
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
    .select("id, status, freelancer_id")
    .eq("id", id)
    .single();

  if (dealError || !deal) {
    return apiError("not_found", "Deal not found.", 404);
  }

  if (deal.freelancer_id !== profileResult.profile.id) {
    return apiError("forbidden", "Only the assigned freelancer can accept the contract.", 403);
  }

  if (deal.status !== "draft") {
    return apiError("conflict", `Contract cannot be accepted in status: ${deal.status}`, 409);
  }

  // Transition deal status to 'waiting_payment'
  const oldStatus = deal.status;
  const { error: updateError } = await supabase
    .from("deals")
    .update({ status: "waiting_payment" })
    .eq("id", id);

  if (updateError) {
    return apiError("server_error", "Failed to update deal status.", 500);
  }

  // Log event
  await supabase.from("deal_events").insert({
    deal_id: id,
    actor_id: profileResult.profile.id,
    event_type: "deal_accepted",
    from_status: oldStatus,
    to_status: "waiting_payment"
  });

  return apiOk({ dealId: id, status: "waiting_payment", auditEvent: "deal_accepted" });
}
