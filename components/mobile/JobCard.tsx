"use client";

import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, Zap } from "lucide-react";
import type { MarketplaceJob } from "@/lib/domain/types";
import { AiRiskBadge } from "@/components/mobile/AiRiskBadge";
import { useLanguage } from "@/components/language-provider";

export function JobCard({ job }: { job: MarketplaceJob }) {
  const { t } = useLanguage();
  const href = `/jobs/${job.id}` as Route;
  return (
    <Link className="block rounded-[28px] border border-[#262932] bg-[#111318] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.6)] text-white transition hover:border-[#a3e635]/40" href={href}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[#a3e635]">{job.category}</p>
          <h3 className="mt-1 text-lg font-black leading-tight text-white">{job.title}</h3>
        </div>
        <AiRiskBadge risk={capitalizeRisk(job.aiRisk ?? "medium")} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-[#9ca3af]">{job.description}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-black text-[#a3e635]">
          {job.budgetAmount} {job.budgetToken}
        </span>
        <span className="flex items-center gap-1 font-bold text-[#9ca3af]">
          <CalendarDays className="h-4 w-4 text-[#a3e635]" />
          {job.deadline ?? t.jobCard.flexible}
        </span>
      </div>
      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#a3e635]/30 bg-[#a3e635]/15 px-3 py-1 text-xs font-black text-[#a3e635]">
        <Zap className="h-3.5 w-3.5" /> {t.jobCard.applyEnergy}
      </div>
    </Link>
  );
}

function capitalizeRisk(risk: "low" | "medium" | "high") {
  return (risk[0].toUpperCase() + risk.slice(1)) as "Low" | "Medium" | "High";
}
