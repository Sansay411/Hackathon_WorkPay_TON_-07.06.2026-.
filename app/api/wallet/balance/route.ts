import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const initData = new URL(request.url).searchParams.get("initData");
  const profileResult = await getVerifiedProfile(initData);
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
  let transactions: unknown[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("deposit_transactions")
      .select("id, amount, tx_hash, created_at, network")
      .eq("profile_id", profileResult.profile.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) {
      transactions = data.map((t) => ({
        id: t.id,
        amount: String(t.amount),
        asset: "TON",
        type: "ton_deposit",
        reason: "Custodial deposit to platform balance",
        txHash: t.tx_hash,
        createdAt: t.created_at
      }));
    }
  }

  return apiOk({
    balanceTon: profileResult.profile.tonBalance ?? 0,
    walletAddress: profileResult.profile.walletAddress,
    transactions
  });
}
