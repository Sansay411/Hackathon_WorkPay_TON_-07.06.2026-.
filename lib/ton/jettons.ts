import type { TonNetwork } from "@/lib/ton/types";

export const supportedJettons: Record<TonNetwork, { symbol: string; address: string | null; decimals: number }[]> = {
  testnet: [
    { symbol: "TON", address: null, decimals: 9 },
    { symbol: "USDT", address: "EQBynBO23ywHy_CgarY9QC9tWRrtZgCwEioVAt77g7y6sC6O", decimals: 6 }
  ],
  mainnet: [
    { symbol: "TON", address: null, decimals: 9 },
    { symbol: "USDT", address: "EQCxE6m3st4JsWN_8UPBgdZkh47E2Ap-7tDXr5JZab4Re2O3", decimals: 6 }
  ]
};
