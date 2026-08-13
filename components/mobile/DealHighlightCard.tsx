"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { AiRiskBadge } from "@/components/mobile/AiRiskBadge";
import { useLanguage } from "@/components/language-provider";

export function DealHighlightCard() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#a3e635]/30 bg-[#111318] p-5 text-white shadow-[0_18px_38px_rgba(0,0,0,0.8)]">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#a3e635]/10" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#a3e635]">{t.dealHighlight.activeEscrow}</p>
          <h2 className="mt-2 text-2xl font-black tracking-normal text-white">{t.dealHighlight.dealName}</h2>
        </div>
        <div className="rounded-2xl border border-[#a3e635]/30 bg-[#a3e635]/15 p-3 text-[#a3e635]">
          <ShieldCheck className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[22px] border border-[#262932] bg-[#16181f] p-3">
          <p className="text-xs text-[#9ca3af]">{t.dealHighlight.amount}</p>
          <p className="mt-1 text-xl font-black text-[#a3e635]">20 TON</p>
        </div>
        <div className="rounded-[22px] border border-[#262932] bg-[#16181f] p-3">
          <p className="text-xs text-[#9ca3af]">{t.dealHighlight.status}</p>
          <p className="mt-1 text-xl font-black text-white">{t.deals.statuses.funded}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <AiRiskBadge risk="Low" />
        <Link className="flex items-center gap-2 rounded-full bg-[#a3e635] px-4 py-2 text-sm font-black text-black hover:bg-[#84cc16]" href="/deals/WP-1024">
          {t.dealHighlight.viewDeal}
          <ArrowRight className="h-4 w-4 text-black" />
        </Link>
      </div>
    </section>
  );
}
