import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/errors";
import { getVerifiedProfile } from "@/lib/api/profile";
import { getBotConfig } from "@/lib/bot/config";
import { getConnectPackage } from "@/lib/monetization/connect-packages";
import { createStarsInvoicePayload } from "@/lib/telegram/stars";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const invoiceSchema = z.object({ initData: z.string().min(1), packageId: z.enum(["pkg_10", "pkg_30", "pkg_100"]) });

export async function POST(request: Request) {
  const parsed = invoiceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("bad_request", "Invalid Stars invoice request.", 400);
  const profileResult = await getVerifiedProfile(parsed.data.initData);
  if (profileResult.status !== "ready") return apiError("unauthorized", "Telegram authentication failed.", 401);
  if (profileResult.profile.activeRole !== "freelancer") return apiError("forbidden", "Switch to Freelancer mode to buy Connects.", 403);

  const pack = getConnectPackage(parsed.data.packageId);
  if (!pack) return apiError("bad_request", "Unknown Connects package.", 400);
  const config = getBotConfig();
  const payload = createStarsInvoicePayload(profileResult.profile.id, profileResult.profile.telegramId, pack.id);
  const response = await fetch(`https://api.telegram.org/bot${config.token}/createInvoiceLink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: `${pack.connects} WorkPay Connects`,
      description: `${pack.label} pack for marketplace applications`,
      payload,
      currency: "XTR",
      prices: [{ label: `${pack.connects} Connects`, amount: pack.priceStars }]
    }),
    cache: "no-store"
  });
  const result = (await response.json()) as { ok?: boolean; result?: string; description?: string };
  if (!response.ok || !result.ok || !result.result) {
    return apiError("server_error", result.description ?? "Telegram could not create the Stars invoice.", 502);
  }
  return apiOk({ invoiceLink: result.result, package: pack });
}
