import { profileUpdateSchema } from "@/lib/api/validation";
import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile, mapProfileRow } from "@/lib/api/profile";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const parsed = profileUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("bad_request", "Invalid profile update payload.", 400);
  }
  const profileResult = await getVerifiedProfile(parsed.data.initData);
  if (profileResult.status === "telegram_required") {
    return apiError("telegram_required", profileResult.message, 400);
  }
  if (profileResult.status === "setup_required") {
    return apiError("setup_required", profileResult.message, 503);
  }
  if (profileResult.status === "unauthorized") {
    return apiError("unauthorized", profileResult.message, 401);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return apiError("setup_required", "Supabase service role is required to update profiles.", 503);
  }

  const { initData, hourlyRate, activeRole, portfolioChannel, githubUrl, linkedinUrl, websiteUrl, ...rest } = parsed.data;
  void initData;
  const update = {
    ...rest,
    active_role: activeRole,
    hourly_rate: hourlyRate,
    portfolio_channel: portfolioChannel,
    github_url: githubUrl,
    linkedin_url: linkedinUrl,
    website_url: websiteUrl
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", profileResult.profile.id)
    .select(
      "id, telegram_id, telegram_username, wallet_address, first_name, last_name, avatar_url, language, role, bio, skills, hourly_rate, rating, completed_deals_count, success_rate, energy_balance, active_role, subscription_until, subscription_tier, connects_balance"
    )
    .single();

  if (error || !data) {
    return apiError("server_error", "Profile update failed.", 500);
  }

  return apiOk({ profile: mapProfileRow(data), auditEvent: "profile_updated" });
}

