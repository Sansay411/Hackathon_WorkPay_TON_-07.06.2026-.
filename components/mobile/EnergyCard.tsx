"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export function EnergyCard({ balance = 20 }: { balance?: number }) {
  const { t } = useLanguage();
  return (
    <Link className="block rounded-[28px] border border-[#a3e635]/30 bg-[#111318] p-5 text-white shadow-[0_18px_38px_rgba(0,0,0,0.8)] transition hover:border-[#a3e635]/60" href="/energy">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-[#a3e635]">{t.energyCard.label}</p>
          <p className="mt-1 text-3xl font-black text-white">{balance}</p>
        </div>
        <div className="rounded-2xl bg-[#a3e635] p-3 text-black">
          <Zap className="h-6 w-6 text-black" />
        </div>
      </div>
      <p className="mt-3 text-xs font-medium text-[#9ca3af]">{t.energyCard.resetsNote}</p>
    </Link>
  );
}
