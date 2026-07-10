import { apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";
import { demoProfile } from "@/lib/demo/data";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { connectPackages } from "@/lib/monetization/connect-packages";

export async function GET(request: Request) {
  const initData = new URL(request.url).searchParams.get("initData");
  const profileResult = await getVerifiedProfile(initData);
  const supabase = createSupabaseServiceRoleClient();
  if (profileResult.status === "ready" && supabase) {
    const { data } = await supabase
      .from("connect_transactions")
      .select("id, profile_id, amount, type, reason, created_at")
      .eq("profile_id", profileResult.profile.id)
      .order("created_at", { ascending: false })
      .limit(30);
    return apiOk({
      balance: profileResult.profile.connectsBalance,
      monthlyFreeEnergy: 30,
      resetInfo: "Starter Connects are included; extra packs can be purchased with TON or Telegram Stars.",
      packages: connectPackages,
      transactions: data ?? []
    });
  }

  return apiOk({
    balance: demoProfile.connectsBalance ?? 30,
    monthlyFreeEnergy: 30,
    resetInfo: "Starter Connects are included; extra packs can be purchased with TON or Telegram Stars.",
    packages: connectPackages,
    transactions: []
  });
}
