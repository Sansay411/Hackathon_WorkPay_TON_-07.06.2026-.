import { apiOk } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  return apiOk({
    escrowWalletConfigured: Boolean(process.env.ESCROW_WALLET_ADDRESS),
    tonCenterConfigured: Boolean(process.env.TONCENTER_API_KEY),
    mainnetEnabled: process.env.NEXT_PUBLIC_ENABLE_MAINNET === "true"
  });
}
