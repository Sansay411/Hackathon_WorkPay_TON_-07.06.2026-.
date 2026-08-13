"use client";

import { useTonWallet } from "@tonconnect/ui-react";
import { WalletCards } from "lucide-react";
import { truncateTonAddress } from "@/lib/ton/address";
import { getTonNetwork } from "@/lib/ton/network";
import { useTelegram } from "@/components/telegram-provider";
import { useLanguage } from "@/components/language-provider";

export function WalletMiniCard() {
  const wallet = useTonWallet();
  const { isTelegram } = useTelegram();
  const { t } = useLanguage();
  const network = getTonNetwork();

  return (
    <div className="rounded-[26px] border border-[#262932] bg-[#111318] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.6)] text-white">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#a3e635] p-3 text-black">
          <WalletCards className="h-5 w-5 text-black" />
        </div>
        <div>
          <p className="text-xs font-black text-[#a3e635]">{t.wallet.tonWallet}</p>
          <p className="text-sm font-black text-white">{wallet ? truncateTonAddress(wallet.account.address) : t.wallet.notConnected}</p>
          <p className="text-[11px] font-semibold text-[#9ca3af]">
            {wallet ? `${network} ${t.walletMini.connectedSuffix}` : `${network} ${t.walletMini.setupRequired}`}
          </p>
          <p className="text-[11px] font-black text-[#9ca3af]">{isTelegram ? t.walletGate.insideTelegram : t.walletGate.outsideTelegram}</p>
        </div>
      </div>
    </div>
  );
}
