"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { Bell, BriefcaseBusiness, Building2, CheckCircle2, Code2, PlusCircle, Search, ShieldCheck, Sparkles, WalletCards, Zap } from "lucide-react";
import { LaunchOnboarding } from "@/components/mobile/LaunchOnboarding";
import { MobileShell } from "@/components/mobile/MobileShell";
import { WorkPayLogo } from "@/components/mobile/WorkPayLogo";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";
import { demoJobs, demoProfile } from "@/lib/demo/data";
import type { MarketplaceJob } from "@/lib/domain/types";

export default function HomePage() {
  return (
    <LaunchOnboarding>
      <MobileShell>
        <div className="space-y-5">
          <TopBar />
          <Hero />
          <Stats />
          <QuickActions />
          <ActiveDeal />
          <RecommendedJobs />
        </div>
      </MobileShell>
    </LaunchOnboarding>
  );
}

import { TopBar as GlobalTopBar } from "@/components/mobile/TopBar";

function TopBar() {
  return <GlobalTopBar />;
}

function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-white bg-gradient-to-br from-[#eaf7ff] to-white p-5 shadow-[0_14px_36px_rgba(0,101,142,0.08)]">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#c7e7ff]/45 blur-2xl" />
      <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-[#acedff]/45 blur-2xl" />
      <div className="relative">
        <h1 className="max-w-[275px] text-[28px] font-black leading-[1.08] tracking-normal text-[#001e2e]">{t.home.title}</h1>
        <p className="mt-3 max-w-[280px] text-sm font-semibold leading-6 text-[#64748b]">{t.home.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill icon={<ShieldCheck className="h-3.5 w-3.5" />} label={t.home.tonSecured} />
          <Pill icon={<Sparkles className="h-3.5 w-3.5" />} label={t.home.aiReviewed} tone="cyan" />
          <Pill icon={<WalletCards className="h-3.5 w-3.5" />} label={t.home.stonfiReady} />
        </div>
      </div>
    </section>
  );
}

function Pill({ icon, label, tone = "blue" }: { icon: React.ReactNode; label: string; tone?: "blue" | "cyan" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-bold backdrop-blur ${tone === "cyan" ? "text-[#00a3be]" : "text-[#00658e]"}`}>
      {icon}
      {label}
    </span>
  );
}

function Stats() {
  const { t } = useLanguage();
  const { profile } = useTelegram();
  const stats = [
    { label: t.home.energy, value: profile?.energyBalance ?? demoProfile.energyBalance, icon: <Zap className="h-5 w-5 text-[#f79009]" /> },
    { label: t.home.activeDeals, value: 3, icon: <WalletCards className="h-5 w-5 text-[#00658e]" /> },
    { label: t.home.success, value: `${demoProfile.successRate}%`, icon: <CheckCircle2 className="h-5 w-5 text-[#12b76a]" /> }
  ];

  return (
    <section className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div className="min-h-[88px] rounded-2xl border border-[#dfe3e8] bg-white p-3 text-center shadow-[0_8px_24px_rgba(0,101,142,0.06)]" key={stat.label}>
          <div className="mx-auto flex h-7 w-7 items-center justify-center">{stat.icon}</div>
          <p className="mt-1 text-lg font-black text-[#171c20]">{stat.value}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b]">{stat.label}</p>
        </div>
      ))}
    </section>
  );
}

function QuickActions() {
  const { t } = useLanguage();

  return (
    <section className="grid grid-cols-3 gap-3">
      <ActionButton href="/deals/new" primary icon={<PlusCircle className="h-4 w-4" />} label={t.home.createDeal} />
      <ActionButton href="/marketplace" icon={<Search className="h-4 w-4" />} label={t.home.findWork} />
      <ActionButton href="/wallet" icon={<Building2 className="h-4 w-4" />} label={t.home.deposit} />
    </section>
  );
}

function ActionButton({ href, icon, label, primary = false }: { href: Route; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <Link
      className={`flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-center text-[12px] font-bold leading-tight shadow-sm ${
        primary ? "bg-[#00658e] text-white shadow-[0_8px_20px_rgba(0,101,142,0.18)]" : "border border-[#bec8d1] bg-white text-[#171c20]"
      }`}
      href={href}
    >
      <span className="shrink-0">{icon}</span>
      <span className="line-clamp-2 w-full break-words">{label}</span>
    </Link>
  );
}

function ActiveDeal() {
  const { t } = useLanguage();

  return (
    <section className="space-y-2">
      <h2 className="px-1 text-xl font-black text-[#171c20]">{t.home.activeDealsTitle}</h2>
      <Link className="block rounded-2xl border border-[#dfe3e8] bg-white p-5 shadow-[0_8px_24px_rgba(0,101,142,0.06)]" href="/deals/WP-1024">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 overflow-hidden pr-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00658e]" />
              <p className="text-[10px] font-black uppercase tracking-[0.5px] text-[#00658e]">{t.home.inProgress}</p>
            </div>
            <h3 className="mt-2 max-w-full truncate text-base font-black text-[#171c20]">{t.home.activeDealName}</h3>
            <p className="mt-1 text-sm font-medium text-[#64748b]">{t.home.dueIn3Days}</p>
          </div>
          <div className="w-[94px] shrink-0 text-right">
            <p className="text-sm font-black text-[#171c20]">20 TON</p>
            <p className="text-[10px] font-bold text-[#64748b]">{t.home.escrowed}</p>
          </div>
        </div>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#e5e8ee]">
          <div className="h-full w-[45%] rounded-full bg-[#00658e]" />
        </div>
      </Link>
    </section>
  );
}

function RecommendedJobs() {
  const { t } = useLanguage();
  const [jobs, setJobs] = useState<MarketplaceJob[]>(demoJobs);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/jobs")
      .then((response) => response.json())
      .then((payload: { data?: { jobs?: MarketplaceJob[] } }) => {
        if (!cancelled && payload.data?.jobs?.length) setJobs(payload.data.jobs);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-3 pb-3">
      <div className="flex items-end justify-between px-1">
        <h2 className="text-xl font-black text-[#171c20]">{t.home.recommendedJobs}</h2>
        <Link className="text-xs font-bold text-[#00658e]" href="/marketplace">{t.home.seeAll}</Link>
      </div>
      {jobs.slice(0, 2).map((job, index) => (
        <Link className="flex items-center gap-4 rounded-2xl border border-[#dfe3e8] bg-white p-4 shadow-[0_6px_20px_rgba(0,101,142,0.06)]" href={`/jobs/${job.id}` as Route} key={job.id}>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${index === 0 ? "bg-[#e6fbff] text-[#00a3be]" : "bg-[#eef7ff] text-[#00658e]"}`}>
            {index === 0 ? <Code2 className="h-5 w-5" /> : <BriefcaseBusiness className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-black leading-snug text-[#171c20]">{job.title}</h3>
            <p className="mt-0.5 truncate text-sm font-medium text-[#64748b]">{job.category} • {t.home.tonNative}</p>
          </div>
          <p className="shrink-0 text-sm font-black text-[#00658e]">{job.budgetAmount} {job.budgetToken}</p>
        </Link>
      ))}
    </section>
  );
}


