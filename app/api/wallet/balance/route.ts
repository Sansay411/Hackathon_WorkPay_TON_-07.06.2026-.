import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";

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

  // We return 0 balance and empty transactions since legacy user profile balance tracking
  // was deleted. All payments are now directly processed and escrowed per deal.
  return apiOk({
    balanceTon: 0,
    walletAddress: profileResult.profile.walletAddress,
    transactions: []
  });
}
