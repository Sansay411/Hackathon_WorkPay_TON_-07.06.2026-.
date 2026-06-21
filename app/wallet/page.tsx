"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeftRight, ShieldCheck, WalletCards } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { WalletConnectCard } from "@/components/wallet-connect-card";
import { MobileShell } from "@/components/mobile/MobileShell";
import { PaymentStatusCard } from "@/components/mobile/PaymentStatusCard";
import { WalletMiniCard } from "@/components/mobile/WalletMiniCard";
import { useTelegram } from "@/components/telegram-provider";

export default function WalletPage() {
  const { t } = useLanguage();
  const { initData } = useTelegram();
  const [tonBalance, setTonBalance] = useState<number | null>(null);

  const fetchBalance = useCallback(() => {
    if (!initData) return;
    fetch(`/api/wallet/balance?initData=${encodeURIComponent(initData)}`)
      .then((r) => r.json())
      .then((payload: { data?: { balanceTon?: number } }) => {
        if (typeof payload.data?.balanceTon === "number") setTonBalance(payload.data.balanceTon);
      })
      .catch(() => undefined);
  }, [initData]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return (
    <MobileShell>
      <div className="space-y-5">
        <header>
          <p className="text-sm font-black text-[#229ED9]">{t.wallet.eyebrow}</p>
          <h1 className="mt-1 text-[34px] font-black leading-none tracking-normal">{t.wallet.title}</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-[#64748b]">{t.wallet.description}</p>
        </header>

        <section className="relative overflow-hidden rounded-[34px] bg-[#171c20] p-5 text-white shadow-[0_22px_44px_rgba(17,24,15,0.28)]">
          <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[#e6f7ff]/20" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[#e6f7ff]">{t.wallet.testnetMode}</p>
              <h2 className="mt-2 text-3xl font-black">{tonBalance !== null ? `${tonBalance} TON` : t.wallet.tonReady}</h2>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-[#e6f7ff]">
              <WalletCards className="h-7 w-7" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[22px] bg-white/10 p-3">
              <p className="text-xs text-white/60">{t.wallet.escrow}</p>
              <p className="mt-1 text-lg font-black">{t.wallet.prepared}</p>
            </div>
            <div className="rounded-[22px] bg-white/10 p-3">
              <p className="text-xs text-white/60">{t.wallet.network}</p>
              <p className="mt-1 text-lg font-black">Testnet</p>
            </div>
          </div>
        </section>

        <WalletConnectCard />
        <WalletMiniCard />
        <PaymentStatusCard dealId="wallet-readiness" amount="1" asset="TON" onVerifiedDeposit={(balance) => { setTonBalance(balance); fetchBalance(); }} />

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-[26px] border border-white/70 bg-[#ffffff] p-4 shadow-[0_12px_30px_rgba(17,24,15,0.08)]">
            <ShieldCheck className="mb-3 h-5 w-5 text-[#229ED9]" />
            <p className="text-sm font-black">{t.wallet.verifiedOnly}</p>
            <p className="mt-1 text-xs font-medium leading-5 text-[#64748b]">{t.wallet.noManualConfirmation}</p>
          </div>
          <div className="rounded-[26px] border border-white/70 bg-[#ffffff] p-4 shadow-[0_12px_30px_rgba(17,24,15,0.08)]">
            <ArrowLeftRight className="mb-3 h-5 w-5 text-[#229ED9]" />
            <p className="text-sm font-black">STON.fi</p>
            <p className="mt-1 text-xs font-medium leading-5 text-[#64748b]">{t.wallet.swapPrepared}</p>
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
