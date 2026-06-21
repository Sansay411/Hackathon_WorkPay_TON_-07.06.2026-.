import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile, mapProfileRow } from "@/lib/api/profile";
import { walletConnectSchema } from "@/lib/api/validation";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { isLikelyTonAddress } from "@/lib/ton/address";

export async function POST(request: Request) {
  const parsed = walletConnectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("bad_request", "Invalid wallet payload.", 400);
  }
  if (!isLikelyTonAddress(parsed.data.walletAddress)) {
    return apiError("bad_request", "Wallet address format is not a supported TON address.", 400);
  }
  if (parsed.data.network === "mainnet" && process.env.NEXT_PUBLIC_ENABLE_MAINNET !== "true") {
    return apiError("bad_request", "Mainnet is disabled. Use a TON testnet wallet for this demo.", 400);
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
    return apiError("setup_required", "Supabase service role is required to save wallet identity.", 503);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ wallet_address: parsed.data.walletAddress })
    .eq("id", profileResult.profile.id)
    .select(
      "id, telegram_id, telegram_username, wallet_address, first_name, last_name, avatar_url, language, role, bio, skills, hourly_rate, rating, completed_deals_count, success_rate, energy_balance, active_role, subscription_until, subscription_tier, connects_balance, ton_balance"
    )
    .single();

  if (error || !data) {
    return apiError("server_error", "Wallet save failed. Try again after profile sync.", 500);
  }

  return apiOk({ profile: mapProfileRow(data), network: parsed.data.network, auditEvent: "wallet_connected" });
}
