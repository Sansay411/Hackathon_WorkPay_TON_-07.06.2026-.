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

  const input = parsed.data;
  const update: Record<string, unknown> = {};
  if (input.language !== undefined) update.language = input.language;
  if (input.role !== undefined) update.role = input.role;
  if (input.bio !== undefined) update.bio = input.bio.trim();
  if (input.skills !== undefined) update.skills = input.skills;
  if (input.hourlyRate !== undefined) update.hourly_rate = input.hourlyRate || null;
  if (input.walletAddress !== undefined) update.wallet_address = input.walletAddress;
  if (input.activeRole !== undefined) update.active_role = input.activeRole;
  if (input.portfolioChannel !== undefined) update.portfolio_channel = input.portfolioChannel || null;
  if (input.githubUrl !== undefined) update.github_url = input.githubUrl || null;
  if (input.linkedinUrl !== undefined) update.linkedin_url = input.linkedinUrl || null;
  if (input.websiteUrl !== undefined) update.website_url = input.websiteUrl || null;

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", profileResult.profile.id)
    .select(
      "id, telegram_id, telegram_username, wallet_address, first_name, last_name, avatar_url, language, role, bio, skills, hourly_rate, portfolio_channel, github_url, linkedin_url, website_url, rating, completed_deals_count, success_rate, energy_balance, ton_balance, active_role, subscription_until, subscription_tier, connects_balance, created_at, updated_at"
    )
    .single();

  if (error || !data) {
    return apiError("server_error", "Profile update failed.", 500);
  }

  return apiOk({ profile: mapProfileRow(data), auditEvent: "profile_updated" });
}

