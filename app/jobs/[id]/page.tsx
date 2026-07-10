"use client";

import { useParams } from "next/navigation";
import { ShieldCheck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/mobile/MobileShell";
import { useWalletAccess } from "@/components/wallet-access";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";
import { demoJobs } from "@/lib/demo/data";
import type { MarketplaceJob } from "@/lib/domain/types";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useLanguage();
  const [job, setJob] = useState<MarketplaceJob>(demoJobs.find((item) => item.id === id) ?? demoJobs[0]);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/jobs/${id}`)
      .then((response) => response.json())
      .then((payload: { data?: { job?: MarketplaceJob } }) => {
        if (!cancelled && payload.data?.job) setJob(payload.data.job);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <MobileShell>
      <div className="space-y-5">
        <section className="rounded-[34px] bg-[#00658e] p-5 text-white shadow-[0_22px_44px_rgba(0,101,142,0.22)]">
          <p className="text-sm font-black text-[#acedff]">{job.category}</p>
          <h1 className="mt-2 text-[30px] font-black leading-tight">{job.title}</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-white/70">{job.description}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[22px] bg-white/10 p-3">
              <p className="text-xs text-white/60">{t.jobDetail.budget}</p>
              <p className="mt-1 text-xl font-black">{job.budgetAmount} {job.budgetToken}</p>
            </div>
            <div className="rounded-[22px] bg-white/10 p-3">
              <p className="text-xs text-white/60">{t.jobDetail.deadline}</p>
              <p className="mt-1 text-xl font-black">{job.deadline ?? t.jobDetail.open}</p>
            </div>
          </div>
        </section>
        <section className="rounded-[30px] border border-[#d7edf3] bg-[#f7fcfd] p-5 shadow-[0_14px_34px_rgba(0,101,142,0.06)]">
          <div className="flex items-center gap-2 text-[#2185a4]"><ShieldCheck className="h-5 w-5" /><p className="font-black">TON escrow policy</p></div>
          <p className="mt-3 text-sm font-medium leading-6 text-[#60727b]">Apply with one Connect. Client payments are held in TON escrow and released after the agreed delivery is accepted.</p>
        </section>
        <section className="rounded-[30px] border border-[#dfe3e8] bg-white p-5 shadow-[0_14px_34px_rgba(0,101,142,0.08)]">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#229ED9]" />
            <p className="font-black">{t.jobDetail.applyCost}</p>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#64748b]">{t.jobDetail.applyBody}</p>
          <ApplyWithEnergyButton job={job} label={t.jobDetail.applyWithEnergy} />
        </section>
        <section className="rounded-[26px] border border-[#dfe3e8] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#229ED9]" />
            <p className="font-black">{t.jobDetail.walletRequired}</p>
          </div>
          <p className="mt-2 text-sm font-semibold text-[#64748b]">{t.jobDetail.walletRequiredBody}</p>
        </section>
      </div>
    </MobileShell>
  );
}

function ApplyWithEnergyButton({ job, label }: { job: MarketplaceJob; label: string }) {
  const { initData } = useTelegram();
  const { isConnected, isTelegram } = useWalletAccess();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="mt-4 space-y-2">
      <button
        className="block w-full rounded-[22px] bg-[#229ED9] px-4 py-3 text-center font-black text-white disabled:bg-[#cbd5e1]"
        disabled={state === "loading" || !isConnected || !isTelegram}
        onClick={async () => {
          if (!isTelegram) {
            setMessage("Open inside Telegram to apply.");
            return;
          }
          if (!isConnected) {
            setMessage("Connect TON wallet to continue.");
            return;
          }
          setState("loading");
          setMessage(null);
          const response = await fetch(`/api/jobs/${job.id}/apply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              initData,
              proposalText:
                "I can deliver this WorkPay task with server-side checks, Telegram Mini App mobile UI, and verified TON settlement."
            })
          });
          const payload = (await response.json()) as { ok?: boolean; data?: { connectsBalance?: number }; error?: { message?: string } };
          if (!response.ok || !payload.ok) {
            setState("error");
            setMessage(payload.error?.message ?? "Application could not be created.");
            return;
          }
          setState("done");
          setMessage(`Application created. Connects left: ${payload.data?.connectsBalance ?? "updated"}.`);
        }}
        type="button"
      >
        {state === "loading" ? "Applying..." : state === "done" ? "Application sent" : isConnected && isTelegram ? label : "Connect TON wallet to continue"}
      </button>
      {message ? <p className="rounded-2xl bg-[#f1f5f9] p-3 text-xs font-black text-[#00658e]">{message}</p> : null}
    </div>
  );
}
