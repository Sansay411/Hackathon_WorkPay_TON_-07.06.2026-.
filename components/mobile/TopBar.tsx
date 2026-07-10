"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, WalletCards } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";
import { WorkPayLogo } from "@/components/mobile/WorkPayLogo";

export function TopBar() {
  const { t } = useLanguage();
  const { initData, profile, user } = useTelegram();
  const [tonBalance, setTonBalance] = useState(profile?.tonBalance ?? 0);

  const displayName = [profile?.firstName ?? user?.firstName, profile?.lastName ?? user?.lastName].filter(Boolean).join(" ") || "WorkPay";
  const username = profile?.telegramUsername ?? user?.username;
  const avatarUrl = profile?.avatarUrl ?? user?.photoUrl ?? null;

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
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 rounded-[24px] border border-white/75 bg-white/70 px-3 py-2.5 shadow-[0_12px_36px_rgba(58,88,105,.095)] backdrop-blur-2xl">
      <Link className="flex min-w-0 items-center gap-2.5" href="/profile">
        {avatarUrl ? <img alt={displayName} className="h-11 w-11 shrink-0 rounded-[16px] object-cover ring-2 ring-white" src={avatarUrl} /> : <WorkPayLogo size="sm" className="ring-2" />}
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#17272f]">{displayName}</p>
          <p className="truncate text-[10px] font-semibold text-[#71838c]">{username ? `@${username}` : t.home.subtitle}</p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <Link 
          className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#c7e7ff] bg-[#e6f7ff] px-2.5 text-[10px] font-bold leading-none text-[#148fbe] shadow-sm transition-all active:scale-95" 
          href="/wallet"
        >
          <WalletCards className="h-3.5 w-3.5" />
          {formatTonBalance(tonBalance)} TON
        </Link>
        <Link className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white/80 text-[#71838c] shadow-sm transition-all active:scale-95" href="/notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#f04438]" />
        </Link>
      </div>
    </header>
  );
}
