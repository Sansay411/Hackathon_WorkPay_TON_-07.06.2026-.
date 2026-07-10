import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getConnectPackage } from "@/lib/monetization/connect-packages";

const purchaseSchema = z.object({
  initData: z.string(),
  packageId: z.enum(["pkg_10", "pkg_30", "pkg_100"])
});

export async function POST(request: Request) {
  const parsed = purchaseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError("bad_request", "Invalid connects purchase payload.", 400);
  }

  const { initData, packageId } = parsed.data;

  const profileResult = await getVerifiedProfile(initData);
  if (profileResult.status !== "ready") {
    return apiError("unauthorized", "Authentication failed.", 401);
  }

  const profile = profileResult.profile;
  if (profile.activeRole !== "freelancer") {
    return apiError("forbidden", "Only freelancers can purchase connects packages.", 403);
  }

  const pack = getConnectPackage(packageId);
  if (!pack) return apiError("bad_request", "Unknown Connects package.", 400);
  const connectsToAdd = pack.connects;
  const priceTon = pack.priceTon;

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return apiError("setup_required", "Supabase service role is not configured.", 503);
  }

  // Retrieve current raw profile to ensure transaction-safe balance read
  const { data: rawProfile, error: getProfileError } = await supabase
    .from("profiles")
    .select("ton_balance, connects_balance")
    .eq("id", profile.id)
    .single();

  if (getProfileError || !rawProfile) {
    return apiError("server_error", "Failed to retrieve profile balance.", 500);
  }

  const currentTonBalance = Number(rawProfile.ton_balance ?? 0);
  const currentConnectsBalance = Number(rawProfile.connects_balance ?? 0);

  if (currentTonBalance < priceTon) {
    return apiError(
      "bad_request",
      `Insufficient wallet balance. Package price is ${priceTon} TON, but you only have ${currentTonBalance} TON in your custodial balance.`,
      400
    );
  }

  const nextTonBalance = currentTonBalance - priceTon;
  const nextConnectsBalance = currentConnectsBalance + connectsToAdd;

  // Insert connects transaction log
  const { error: insertTxError } = await supabase
    .from("connect_transactions")
    .insert({
      profile_id: profile.id,
      amount: connectsToAdd,
      type: "purchase",
      reason: `Purchased package ${packageId} (${connectsToAdd} connects) for ${priceTon} TON`
    });

  if (insertTxError) {
    return apiError("server_error", "Failed to log connects transaction.", 500);
  }

  // Update profile balance and connects
  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({
      ton_balance: nextTonBalance,
      connects_balance: nextConnectsBalance
    })
    .eq("id", profile.id)
    .select("id, telegram_id, telegram_username, wallet_address, first_name, last_name, avatar_url, language, role, bio, skills, hourly_rate, rating, completed_deals_count, success_rate, energy_balance, active_role, subscription_until, subscription_tier, connects_balance, ton_balance")
    .single();

  if (updateError || !updatedProfile) {
    return apiError("server_error", "Failed to process connects purchase.", 500);
  }

  return apiOk({
    connectsBalance: updatedProfile.connects_balance,
    tonBalance: Number(updatedProfile.ton_balance),
    packageId
  });
}
