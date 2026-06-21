import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initData = new URL(request.url).searchParams.get("initData");
  if (!initData) {
    return apiError("telegram_required", "Open inside Telegram to load deal details.", 400);
  }

  const profileResult = await getVerifiedProfile(initData);
  if (profileResult.status !== "ready") {
    return apiError("unauthorized", "Authentication failed.", 401);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return apiError("setup_required", "Supabase service role is not configured.", 503);
  }

  const { data: deal, error } = await supabase
    .from("deals")
    .select(`
      id,
      title,
      description,
      price_amount,
      price_token,
      status,
      deadline,
      client_id,
      freelancer_id,
      funding_tx_hash,
      release_tx_hash,
      created_at,
      client:client_id (id, telegram_id, telegram_username, first_name, last_name, avatar_url),
      freelancer:freelancer_id (id, telegram_id, telegram_username, first_name, last_name, avatar_url),
      deliveries (id, message, storage_path, submitted_at)
    `)
    .eq("id", id)
    .single();

  if (error || !deal) {
    return apiError("not_found", "Deal not found.", 404);
  }

  // Check authorization
  if (deal.client_id !== profileResult.profile.id && deal.freelancer_id !== profileResult.profile.id) {
    return apiError("forbidden", "You do not have access to this deal.", 403);
  }

  return apiOk({ deal });
}
