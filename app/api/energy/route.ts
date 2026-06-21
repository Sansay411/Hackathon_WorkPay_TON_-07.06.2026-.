import { apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";
import { demoProfile } from "@/lib/demo/data";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

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
      resetInfo: "Connects auto-replenish on subscription renewal.",
      packages: [
        { id: "pkg_10", connects: 10, priceTon: 1.0, label: "10 Connects" },
        { id: "pkg_30", connects: 30, priceTon: 2.5, label: "30 Connects" },
        { id: "pkg_100", connects: 100, priceTon: 7.0, label: "100 Connects" }
      ],
      transactions: data ?? []
    });
  }

  return apiOk({
    balance: demoProfile.connectsBalance ?? 30,
    monthlyFreeEnergy: 30,
    resetInfo: "Connects auto-replenish on subscription renewal.",
    packages: [
      { id: "pkg_10", connects: 10, priceTon: 1.0, label: "10 Connects" },
      { id: "pkg_30", connects: 30, priceTon: 2.5, label: "30 Connects" },
      { id: "pkg_100", connects: 100, priceTon: 7.0, label: "100 Connects" }
    ],
    transactions: []
  });
}
