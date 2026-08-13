"use client";

import { useState } from "react";
import { CheckCircle2, Zap } from "lucide-react";
import type { JobApplication } from "@/lib/domain/types";
import { useWalletAccess } from "@/components/wallet-access";
import { useTelegram } from "@/components/telegram-provider";
import { useLanguage } from "@/components/language-provider";

export function ApplicationCard({ application }: { application: JobApplication }) {
  const [result, setResult] = useState<string | null>(null);
  const { walletAddress, isConnected, isTelegram } = useWalletAccess();
  const { initData } = useTelegram();
  const { t } = useLanguage();

  return (
    <section className="rounded-[28px] border border-[#262932] bg-[#111318] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.6)] text-white">
      <div className="flex items-center justify-between">
        <p className="font-black text-white">{t.applicationCard.application}</p>
        <span className="rounded-full border border-[#a3e635]/30 bg-[#a3e635]/15 px-3 py-1 text-xs font-black text-[#a3e635]">{application.status}</span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-5 text-[#9ca3af]">{application.proposalText}</p>
      <div className="mt-4 flex items-center justify-between text-sm font-black text-[#a3e635]">
        <span className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-[#a3e635]" />
          {application.energyCost} {t.energyCard.label}
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4 text-[#a3e635]" />
          AI {application.aiScore ?? 0}/100
        </span>
      </div>
      <button
        className="mt-4 w-full rounded-[20px] bg-[#a3e635] px-4 py-3 text-sm font-black text-black hover:bg-[#84cc16] disabled:opacity-50"
        onClick={async () => {
          if (!isConnected || !walletAddress || !isTelegram) {
            setResult(t.walletGate.connectToContinue);
            return;
          }

          const response = await fetch(`/api/applications/${application.id}/accept`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ initData, walletAddress })
          });
          const payload = (await response.json()) as { ok?: boolean; data?: { dealId?: string }; error?: { message?: string } };
          if (!response.ok || !payload.ok) {
            setResult(payload.error?.message ?? t.walletGate.connectToContinue);
            return;
          }
          setResult(payload.data?.dealId ? `${t.applicationCard.dealCreatedPrefix} ${payload.data.dealId}` : t.applicationCard.noDealId);
        }}
        disabled={!isConnected || !isTelegram}
        type="button"
      >
        {isConnected && isTelegram ? t.applicationCard.accept : t.walletGate.connectToContinue}
      </button>
      {!isTelegram ? <p className="mt-2 text-xs font-black text-[#9ca3af]">{t.applicationCard.openInsideTelegram}</p> : null}
      {result ? <p className="mt-3 rounded-2xl border border-[#a3e635]/30 bg-[#16181f] p-3 text-xs font-black text-[#a3e635]">{result}</p> : null}
    </section>
  );
}
