"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Clock3 } from "lucide-react";
import { AiRiskBadge } from "@/components/mobile/AiRiskBadge";
import { useLanguage } from "@/components/language-provider";

type DealListCardProps = {
  dealId: string;
  title: string;
  description: string;
  amount: string;
  status: string;
  risk: "Low" | "Medium" | "High";
};

export function DealListCard({ dealId, title, description, amount, status, risk }: DealListCardProps) {
  const { t } = useLanguage();
  const href = `/deals/${dealId}` as Route;

  return (
    <Link className="block rounded-2xl border border-[#262932] bg-[#111318] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition hover:border-[#a3e635]/40" href={href}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black tracking-normal text-white">{title}</h3>
          <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-[#9ca3af]">{description}</p>
        </div>
        <span className="shrink-0 rounded-full border border-[#a3e635]/30 bg-[#a3e635]/15 px-3 py-1 text-xs font-black text-[#a3e635]">{status}</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xl font-black text-[#a3e635]">{amount}</span>
        <AiRiskBadge risk={risk} />
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#262932] bg-[#16181f] px-3 py-2 text-xs font-bold text-[#9ca3af]">
        <span className="flex items-center gap-2">
          <Clock3 className="h-3.5 w-3.5 text-[#a3e635]" />
          {t.dealList.eventHint}
        </span>
        <ArrowRight className="h-4 w-4 text-[#a3e635]" />
      </div>
    </Link>
  );
}
