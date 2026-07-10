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
    <div className="overflow-hidden rounded-[28px] border border-white/75 bg-white/[0.75] shadow-[0_18px_50px_rgba(41,91,116,0.1)] backdrop-blur-xl">
      <div className="bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.24),transparent_48%),linear-gradient(145deg,rgba(255,255,255,0.95),rgba(238,250,252,0.72))] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-700">
              <Zap className="h-3.5 w-3.5 fill-current" />
              {ru ? "Баланс откликов" : "Proposal balance"}
            </p>
            <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">{connects}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">Connects</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-white bg-white/70 px-2.5 py-1.5 text-[10px] font-black text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
            {renewal}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-[width] duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
