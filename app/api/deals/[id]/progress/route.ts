import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

const progressSchema = z.object({
  initData: z.string(),
  progressStatus: z.string().min(2).max(100)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = progressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError("bad_request", "Invalid progress payload.", 400);
  }

  const { initData, progressStatus } = parsed.data;

  const profileResult = await getVerifiedProfile(initData);
  if (profileResult.status !== "ready") {
    return apiError("unauthorized", "Authentication failed.", 401);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return apiError("setup_required", "Supabase service role is not configured.", 503);
  }

  // Fetch deal details
  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("id, status, freelancer_id")
    .eq("id", id)
    .single();

  if (dealError || !deal) {
    return apiError("not_found", "Deal not found.", 404);
  }

  // Check that the actor is the freelancer of this deal
  if (deal.freelancer_id !== profileResult.profile.id) {
    return apiError("forbidden", "Only the assigned freelancer can update progress.", 403);
  }

  // Check deal status is in_progress
  if (deal.status !== "in_progress") {
    return apiError("conflict", "Progress can only be logged when the contract is in progress.", 409);
  }

  // Insert progress event into deal_events
  const { error: insertError } = await supabase
    .from("deal_events")
    .insert({
      deal_id: id,
      actor_id: profileResult.profile.id,
      event_type: "progress_updated",
      metadata: { progress_status: progressStatus }
    });

  if (insertError) {
    return apiError("server_error", "Failed to log progress event in database.", 500);
  }

  return apiOk({ dealId: id, progressStatus, auditEvent: "progress_updated" });
}
