import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";
import { assertDealTransition } from "@/lib/domain/deal-status";
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
    return apiError("setup_required", "Supabase service role is required to open a dispute.", 503);
  }

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("id, status, client_id, freelancer_id")
    .eq("id", id)
    .single();

  if (dealError || !deal) {
    return apiError("not_found", "Deal not found.", 404);
  }

  if (deal.client_id !== profileResult.profile.id && deal.freelancer_id !== profileResult.profile.id) {
    return apiError("forbidden", "You do not have access to this deal.", 403);
  }

  try {
    assertDealTransition(deal.status, "disputed");
  } catch (error) {
    return apiError("conflict", error instanceof Error ? error.message : "Invalid status transition.", 409);
  }

  // Transition status
  const oldStatus = deal.status;
  await supabase.from("deals").update({ status: "disputed" }).eq("id", id);
  await supabase.from("deal_events").insert({
    deal_id: id,
    actor_id: profileResult.profile.id,
    event_type: "deal_disputed",
    from_status: oldStatus,
    to_status: "disputed"
  });

  return apiOk({ dealId: id, status: "disputed", auditEvent: "deal_disputed" });
}
