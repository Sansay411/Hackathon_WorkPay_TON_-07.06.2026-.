"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, WalletCards } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { WalletConnectCard } from "@/components/wallet-connect-card";
import { MobileShell } from "@/components/mobile/MobileShell";
import { TonDepositCard } from "@/components/mobile/TonDepositCard";
import { WalletMiniCard } from "@/components/mobile/WalletMiniCard";
import { useTelegram } from "@/components/telegram-provider";
import { getTonNetwork } from "@/lib/ton/network";

export default function WalletPage() {
  const { t } = useLanguage();
  const { initData } = useTelegram();
  const network = getTonNetwork();
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
      <div className="space-y-5 text-white">
        <header>
          <p className="text-sm font-black text-[#a3e635]">{t.wallet.eyebrow}</p>
          <h1 className="mt-1 text-[34px] font-black leading-none tracking-normal text-white">{t.wallet.title}</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-[#9ca3af]">{t.wallet.description}</p>
        </header>

        <section className="relative overflow-hidden rounded-[34px] border border-[#a3e635]/30 bg-[#111318] p-5 text-white shadow-[0_22px_44px_rgba(0,0,0,0.8)]">
          <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[#a3e635]/10" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[#a3e635]">{t.wallet.testnetMode}</p>
              <h2 className="mt-2 text-3xl font-black text-white">{tonBalance !== null ? `${tonBalance} TON` : t.wallet.tonReady}</h2>
            </div>
            <div className="rounded-2xl border border-[#a3e635]/30 bg-[#a3e635]/15 p-3 text-[#a3e635]">
              <WalletCards className="h-7 w-7 text-[#a3e635]" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[22px] border border-[#262932] bg-[#16181f] p-3">
              <p className="text-xs text-[#9ca3af]">{t.wallet.escrow}</p>
              <p className="mt-1 text-lg font-black text-[#a3e635]">{t.wallet.prepared}</p>
            </div>
            <div className="rounded-[22px] border border-[#262932] bg-[#16181f] p-3">
              <p className="text-xs text-[#9ca3af]">{t.wallet.network}</p>
              <p className="mt-1 text-lg font-black text-white">{network === "mainnet" ? "Mainnet" : "Testnet"}</p>
            </div>
          </div>
        </section>

        <WalletConnectCard />
        <WalletMiniCard />
        <TonDepositCard balanceTon={tonBalance ?? 0} network={network} onBalanceChange={(balance) => { setTonBalance(balance); fetchBalance(); }} />

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-[26px] border border-[#262932] bg-[#111318] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
            <ShieldCheck className="mb-3 h-5 w-5 text-[#a3e635]" />
            <p className="text-sm font-black text-white">{t.wallet.verifiedOnly}</p>
            <p className="mt-1 text-xs font-medium leading-5 text-[#9ca3af]">{t.wallet.noManualConfirmation}</p>
          </div>
          <div className="rounded-[26px] border border-[#262932] bg-[#111318] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
            <WalletCards className="mb-3 h-5 w-5 text-[#a3e635]" />
            <p className="text-sm font-black text-white">TON transfer</p>
            <p className="mt-1 text-xs font-medium leading-5 text-[#9ca3af]">Balance credits are released only after on-chain verification.</p>
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
