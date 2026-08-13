"use client";

import { Sparkles, Zap } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export function ConnectsWidget({ connects, subscriptionUntil }: { connects: number; subscriptionUntil: string | null }) {
  const { language } = useLanguage();
  const ru = language === "ru";
  const visualMax = Math.max(30, Math.ceil(Math.max(connects, 1) / 10) * 10);
  const percentage = Math.max(0, Math.min(100, (connects / visualMax) * 100));

  let renewal = ru ? "Доступны, пока не потрачены" : "Available until spent";
  if (subscriptionUntil) {
    const renewalDate = new Date(subscriptionUntil).toLocaleDateString(ru ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "short"
    });
    renewal = ru
      ? `Обновление ${renewalDate}`
      : `Renews ${renewalDate}`;
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-[#262932] bg-[#111318] shadow-[0_18px_50px_rgba(0,0,0,0.8)] text-white">
      <div className="bg-[radial-gradient(circle_at_top_right,rgba(163,230,53,0.15),transparent_48%)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#a3e635]">
              <Zap className="h-3.5 w-3.5 fill-current text-[#a3e635]" />
              {ru ? "Баланс откликов" : "Proposal balance"}
            </p>
            <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">{connects}</p>
            <p className="mt-1 text-xs font-bold text-[#9ca3af]">Connects</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#262932] bg-[#16181f] px-2.5 py-1.5 text-[10px] font-black text-[#9ca3af]">
            <Sparkles className="h-3.5 w-3.5 text-[#a3e635]" />
            {renewal}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#262932]">
          <div
            className="h-full rounded-full bg-[#a3e635] transition-[width] duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
