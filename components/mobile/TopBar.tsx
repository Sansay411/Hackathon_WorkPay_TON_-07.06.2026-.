"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, WalletCards } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";
import { WorkPayLogo } from "@/components/mobile/WorkPayLogo";

export function TopBar() {
  const { t } = useLanguage();
  const { initData, profile } = useTelegram();
  const [tonBalance, setTonBalance] = useState(profile?.tonBalance ?? 0);

  const fetchBalance = useCallback(() => {
    if (!initData) return;
    fetch(`/api/wallet/balance?initData=${encodeURIComponent(initData)}`)
      .then((response) => response.json())
      .then((payload: { data?: { balanceTon?: number } }) => {
        if (typeof payload.data?.balanceTon === "number") {
          setTonBalance(payload.data.balanceTon);
        }
      })
      .catch(() => undefined);
  }, [initData]);

  useEffect(() => {
    setTonBalance(profile?.tonBalance ?? 0);
  }, [profile?.tonBalance]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  function formatTonBalance(value: number) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
  }

  return (
    <header className="flex items-center justify-between gap-3 rounded-[24px] border border-white/70 bg-white/80 px-4 py-3 shadow-[0_8px_30px_rgba(0,101,142,0.08)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <WorkPayLogo size="sm" className="ring-2" />
        <div className="min-w-0">
          <p className="text-base font-black text-[#00658e]">WorkPay</p>
          <p className="truncate text-[11px] font-semibold text-[#64748b]">{t.home.subtitle}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link 
          className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#c7e7ff] bg-[#e6f7ff] px-2.5 text-[11px] font-bold leading-none text-[#00658e] active:scale-95 transition-all shadow-sm" 
          href="/wallet"
        >
          <WalletCards className="h-3.5 w-3.5" />
          {formatTonBalance(tonBalance)} TON
        </Link>
        <Link className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe3e8] bg-white text-[#64748b] active:scale-95 transition-all shadow-sm" href="/notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#f04438]" />
        </Link>
      </div>
    </header>
  );
}
