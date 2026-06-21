import { normalizeLanguage } from "@/lib/i18n";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { verifyTelegramInitData, type TelegramAuthResult } from "@/lib/telegram/auth";

export type WorkPayProfile = {
  id: string;
  telegramId: string;
  telegramUsername: string | null;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  language: "en" | "ru";
  role: "client" | "freelancer" | "both";
  walletAddress: string | null;
  bio: string | null;
  skills: string[];
  hourlyRate: string | null;
  rating: number;
  completedDealsCount: number;
  successRate: number;
  energyBalance: number;
  tonBalance: number;
  activeRole: "client" | "freelancer";
  subscriptionUntil: string | null;
  subscriptionTier: string | null;
  connectsBalance: number;
};

export type ProfileLoadResult =
  | { status: "ready"; profile: WorkPayProfile; telegramUser: TelegramAuthResult }
  | { status: "telegram_required"; message: string }
  | { status: "setup_required"; message: string }
  | { status: "unauthorized"; message: string };

const profileSelect =
  "id, telegram_id, telegram_username, wallet_address, first_name, last_name, avatar_url, language, role, bio, skills, hourly_rate, rating, completed_deals_count, success_rate, energy_balance, active_role, subscription_until, subscription_tier, connects_balance";

export async function getVerifiedProfile(initData: string | undefined | null): Promise<ProfileLoadResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!initData) {
    return { status: "telegram_required", message: "Open inside Telegram for verified profile sync." };
  }
  if (!botToken) {
    return { status: "setup_required", message: "Telegram bot token is required for profile verification." };
  }

  let telegramUser: TelegramAuthResult;
  try {
    telegramUser = verifyTelegramInitData(initData, botToken);
  } catch {
    return { status: "unauthorized", message: "Telegram verification failed." };
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return { status: "setup_required", message: "Supabase service role is required for persistent profiles." };
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
    .select(profileSelect)
    .single();

  if (error || !data) {
    return { status: "setup_required", message: "Profile persistence is unavailable." };
  }

  return { status: "ready", profile: mapProfileRow(data), telegramUser };
}

export function mapProfileRow(row: Record<string, unknown>): WorkPayProfile {
  return {
    id: String(row.id),
    telegramId: String(row.telegram_id),
    telegramUsername: typeof row.telegram_username === "string" ? row.telegram_username : null,
    firstName: typeof row.first_name === "string" ? row.first_name : "Telegram user",
    lastName: typeof row.last_name === "string" ? row.last_name : null,
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
    language: row.language === "ru" ? "ru" : "en",
    role: row.role === "client" || row.role === "freelancer" ? row.role : "both",
    walletAddress: typeof row.wallet_address === "string" ? row.wallet_address : null,
    bio: typeof row.bio === "string" ? row.bio : null,
    skills: Array.isArray(row.skills) ? row.skills.filter((item): item is string => typeof item === "string") : [],
    hourlyRate: row.hourly_rate == null ? null : String(row.hourly_rate),
    rating: Number(row.rating ?? 0),
    completedDealsCount: Number(row.completed_deals_count ?? 0),
    successRate: Number(row.success_rate ?? 0),
    energyBalance: Number(row.energy_balance ?? 20),
    tonBalance: Number(row.ton_balance ?? 0),
    activeRole: row.active_role === "freelancer" ? "freelancer" : "client",
    subscriptionUntil: typeof row.subscription_until === "string" ? row.subscription_until : null,
    subscriptionTier: typeof row.subscription_tier === "string" ? row.subscription_tier : null,
    connectsBalance: typeof row.connects_balance === "number" ? row.connects_balance : 30
  };
}

export function walletRequiredError() {
  return {
    error: "wallet_required",
    message: "Connect TON wallet to continue."
  } as const;
}
