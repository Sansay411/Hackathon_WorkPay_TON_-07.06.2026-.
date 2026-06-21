import { apiError } from "@/lib/api/errors";

export const runtime = "nodejs";

export async function POST() {
  return apiError("setup_required", "STON.fi Omniston features are disabled in this version.", 503);
}
