import { apiOk } from "@/lib/api/errors";
import { demoProfile } from "@/lib/demo/data";
import { verifyTelegramInitData } from "@/lib/telegram/auth";
import { normalizeLanguage } from "@/lib/i18n";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  return apiOk({ profile: demoProfile, source: "demo_until_telegram_auth_is_bound" });
}

export async function POST(request: Request) {
  const { initData } = (await request.json()) as { initData?: string };
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!initData || !botToken) {
    return apiOk({ profile: demoProfile, source: "demo_missing_telegram_init_data" });
  }

  try {
    const telegramUser = verifyTelegramInitData(initData, botToken);
    const telegramProfile = {
      ...demoProfile,
      telegramId: telegramUser.telegramId,
      telegramUsername: telegramUser.username,
      firstName: telegramUser.firstName,
      lastName: telegramUser.lastName,
      avatarUrl: telegramUser.photoUrl,
      language: normalizeLanguage(telegramUser.languageCode)
    };

    const supabase = createSupabaseServiceRoleClient();
    if (!supabase) {
      return apiOk({
        profile: telegramProfile,
        source: "telegram_verified_unsaved"
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          telegram_id: telegramUser.telegramId,
          telegram_username: telegramUser.username,
          first_name: telegramUser.firstName,
          last_name: telegramUser.lastName,
          avatar_url: telegramUser.photoUrl,
          language: normalizeLanguage(telegramUser.languageCode)
        },
        { onConflict: "telegram_id" }
      )
      .select(
        "id, telegram_id, telegram_username, wallet_address, first_name, last_name, avatar_url, language, role, bio, skills, hourly_rate, rating, completed_deals_count, success_rate, energy_balance, active_role, subscription_until, subscription_tier, connects_balance, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      return apiOk({
        profile: telegramProfile,
        source: "telegram_verified_unsaved"
      });
    }

    return apiOk({
      profile: {
        id: data.id,
        telegramId: data.telegram_id,
        telegramUsername: data.telegram_username,
        firstName: data.first_name,
        lastName: data.last_name,
        avatarUrl: data.avatar_url,
        language: data.language,
        role: data.role,
        walletAddress: data.wallet_address,
        bio: data.bio,
        skills: Array.isArray(data.skills) ? data.skills : [],
        hourlyRate: data.hourly_rate ? String(data.hourly_rate) : null,
        rating: Number(data.rating ?? 0),
        completedDealsCount: Number(data.completed_deals_count ?? 0),
        successRate: Number(data.success_rate ?? 0),
        energyBalance: Number(data.energy_balance ?? 20),
        tonBalance: 0,
        activeRole: data.active_role === "freelancer" ? "freelancer" : "client",
        subscriptionUntil: typeof data.subscription_until === "string" ? data.subscription_until : null,
        subscriptionTier: typeof data.subscription_tier === "string" ? data.subscription_tier : null,
        connectsBalance: typeof data.connects_balance === "number" ? data.connects_balance : 30,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      },
      source: "telegram_verified_supabase"
    });
  } catch {
    return apiOk({ profile: demoProfile, source: "demo_invalid_telegram_init_data" });
  }
}
