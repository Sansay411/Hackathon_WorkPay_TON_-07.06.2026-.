"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Filter,
  MapPin,
  Search,
  Sparkles,
  TimerReset,
  WalletCards,
  Zap
} from "lucide-react";
import { LaunchOnboarding } from "@/components/mobile/LaunchOnboarding";
import { MobileShell } from "@/components/mobile/MobileShell";
import { TopBar } from "@/components/mobile/TopBar";
import { Spline3DLogo } from "@/components/mobile/Spline3DLogo";
import { useLanguage } from "@/components/language-provider";
import { demoJobs } from "@/lib/demo/data";
import type { MarketplaceJob } from "@/lib/domain/types";

export default function HomePage() {
  const { t } = useLanguage();
  const [jobs, setJobs] = useState<MarketplaceJob[]>(demoJobs);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const categories = t.marketplace.categories;
  const selectedCategory = (categories as readonly string[]).includes(activeCategory) ? activeCategory : categories[0];
  const categoryIndex = (categories as readonly string[]).indexOf(selectedCategory);
  const categoryNeedle = ["", "design", "telegram", "backend", "ton"][categoryIndex] ?? "";

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/jobs")
      .then((response) => response.json())
      .then((payload: { data?: { jobs?: MarketplaceJob[] } }) => {
        if (!cancelled && payload.data?.jobs?.length) {
          setJobs(payload.data.jobs);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = jobs.filter((job) => {
      const haystack = `${job.title} ${job.category} ${job.description}`.toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesCategory = !categoryNeedle || haystack.includes(categoryNeedle);
      return matchesQuery && matchesCategory;
    });

    if (!normalizedQuery && categoryNeedle && filtered.length === 0) {
      return jobs;
    }

    return filtered;
  }, [categoryNeedle, jobs, query]);

  return (
    <LaunchOnboarding>
      <MobileShell>
        <div className="space-y-5">
          <TopBar />
          <FinderHero />
          <ReminderCard />
          <SearchPanel
            activeCategory={selectedCategory}
            categories={categories}
            onCategoryChange={setActiveCategory}
            onQueryChange={setQuery}
            query={query}
          />
          <ActionRail />
          <AgentPulse />
          <RecommendedJobs jobs={visibleJobs} />
          <LatestJobs jobs={visibleJobs} />
          <ActiveDeal />
        </div>
      </MobileShell>
    </LaunchOnboarding>
  );
}

function FinderHero() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[#262932] bg-[#111318] p-5 shadow-[0_22px_54px_rgba(0,0,0,0.8)] text-white">
      <div className="pointer-events-none absolute -right-5 -top-2 select-none text-[76px] font-black leading-none tracking-[-0.12em] text-[#a3e635]/5">{t.home.findWork.toUpperCase()}</div>
      <div className="pointer-events-none absolute -bottom-16 -right-12 h-44 w-44 rounded-full border-[24px] border-[#a3e635]/10" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 max-w-[270px]">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#a3e635]">{t.home.subtitle}</p>
          <h1 className="text-[29px] font-black leading-[1.04] tracking-[-0.055em] text-white">{t.home.title}</h1>
          <p className="mt-3 text-[13px] font-semibold leading-5 text-[#9ca3af]">{t.home.description}</p>
        </div>
        <div className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-[25px] border border-[#a3e635]/40 bg-[#a3e635] text-black shadow-[0_0_24px_rgba(163,230,53,0.3)]">
          <Sparkles className="h-7 w-7 text-black" strokeWidth={2} />
        </div>
      </div>

      {/* 3D Spline Logo Interactive Display */}
      <div className="relative mt-5">
        <Spline3DLogo height="h-40" />
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <StatusPill icon={<CheckCircle2 className="h-3.5 w-3.5 text-[#a3e635]" />} label={t.home.tonSecured} />
        <StatusPill icon={<Sparkles className="h-3.5 w-3.5 text-[#a3e635]" />} label={t.home.aiReviewed} accent />
        <StatusPill icon={<WalletCards className="h-3.5 w-3.5 text-[#a3e635]" />} label="TON escrow ready" />
      </div>
    </section>
  );
}

function StatusPill({ icon, label, accent = false }: { icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black backdrop-blur ${accent ? "border-[#a3e635]/40 bg-[#a3e635]/15 text-[#a3e635]" : "border-[#262932] bg-[#16181f] text-white"}`}>
      {icon}
      {label}
    </span>
  );
}

function ReminderCard() {
  const { t } = useLanguage();

  return (
    <section className="flex items-center gap-3 rounded-[25px] border border-[#262932] bg-[#111318] p-3 shadow-[0_10px_28px_rgba(0,0,0,0.6)] text-white">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-[#a3e635]/30 bg-[#a3e635]/15 text-[#a3e635]">
        <TimerReset className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black text-white">{t.home.aiReviewed}</p>
          <span className="rounded-lg border border-[#a3e635]/40 bg-[#a3e635]/20 px-2 py-1 text-[10px] font-black text-[#a3e635]">45%</span>
        </div>
        <p className="mt-1 truncate text-[11px] font-semibold text-[#9ca3af]">{t.home.activeDealName}</p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-[10px] font-black text-white">{t.home.inProgress}</p>
        <p className="mt-1 text-[10px] font-semibold text-[#9ca3af]">{t.home.dueIn3Days}</p>
      </div>
    </section>
  );
}

function SearchPanel({
  activeCategory,
  categories,
  onCategoryChange,
  onQueryChange,
  query
}: {
  activeCategory: string;
  categories: readonly string[];
  onCategoryChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  query: string;
}) {
  const { t } = useLanguage();

  return (
    <section className="rounded-[27px] border border-[#262932] bg-[#111318] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
      <label className="flex h-12 items-center gap-2 rounded-[18px] border border-[#262932] bg-[#16181f] px-3">
        <Search className="h-5 w-5 shrink-0 text-[#a3e635]" strokeWidth={2} />
        <input
          aria-label={t.marketplace.search}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-[#6b7280]"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t.marketplace.search}
          type="search"
          value={query}
        />
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#a3e635]/15 text-[#a3e635]">
          <Filter className="h-4 w-4" />
        </span>
      </label>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <button
            className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-black transition ${activeCategory === category ? "bg-[#a3e635] text-black shadow-[0_4px_16px_rgba(163,230,53,0.3)]" : "border border-[#262932] bg-[#16181f] text-[#9ca3af] hover:text-white"}`}
            key={category}
            onClick={() => onCategoryChange(category)}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>
    </section>
  );
}

function ActionRail() {
  const { t } = useLanguage();

  return (
    <section className="grid grid-cols-3 gap-2">
      <CompactAction href="/deals/new" icon={<Zap className="h-4 w-4" />} label={t.home.createDeal} primary />
      <CompactAction href="/marketplace" icon={<Search className="h-4 w-4 text-[#a3e635]" />} label={t.home.findWork} />
      <CompactAction href="/wallet" icon={<WalletCards className="h-4 w-4 text-[#a3e635]" />} label={t.home.deposit} />
    </section>
  );
}

function CompactAction({ href, icon, label, primary = false }: { href: Route; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <Link className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[19px] px-2 text-center text-[10px] font-black shadow-[0_8px_22px_rgba(0,0,0,0.5)] transition active:scale-[.98] ${primary ? "bg-[#a3e635] text-black" : "border border-[#262932] bg-[#111318] text-white hover:border-[#a3e635]/40"}`} href={href}>
      {icon}
      <span className="line-clamp-2 leading-tight">{label}</span>
    </Link>
  );
}

function AgentPulse() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden rounded-[27px] border border-[#a3e635]/30 bg-[linear-gradient(145deg,#111318,#181b24)] p-4 text-white shadow-[0_16px_38px_rgba(0,0,0,0.7)]">
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full border-[18px] border-[#a3e635]/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#a3e635]">
            <Sparkles className="h-4 w-4 text-[#a3e635]" />
            <p className="text-xs font-black">{t.home.aiReviewed}</p>
          </div>
          <p className="mt-2 max-w-[235px] text-xs font-medium leading-5 text-[#9ca3af]">{t.home.description}</p>
        </div>
        <span className="rounded-full border border-[#a3e635]/40 bg-[#a3e635]/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#a3e635]">TON escrow</span>
      </div>
      <Link className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#a3e635] px-3.5 py-2 text-[11px] font-black text-black shadow-[0_9px_22px_rgba(163,230,53,0.25)] hover:bg-[#84cc16]" href="/jobs">
        {t.home.findWork}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

function RecommendedJobs({ jobs }: { jobs: MarketplaceJob[] }) {
  const { t } = useLanguage();
  const cards = jobs.slice(0, 3);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a3e635]">{t.home.aiReviewed}</p>
          <h2 className="mt-1 text-[22px] font-black tracking-[-0.045em] text-white">{t.home.recommendedJobs}</h2>
        </div>
        <Link className="text-xs font-black text-[#a3e635]" href="/marketplace">{t.home.seeAll} <span aria-hidden="true">-&gt;</span></Link>
      </div>
      {cards.length ? (
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cards.map((job, index) => (
            <Link className="group relative min-w-[238px] snap-start overflow-hidden rounded-[28px] border border-[#262932] bg-[#111318] p-4 shadow-[0_13px_30px_rgba(0,0,0,0.6)] transition active:scale-[.99]" href={`/jobs/${job.id}` as Route} key={job.id}>
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#a3e635] to-[#84cc16]" />
              <div className="flex items-start justify-between gap-3">
                <JobMark index={index} />
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16181f] text-[#a3e635]"><Bookmark className="h-4 w-4" /></span>
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.1em] text-[#a3e635]">{job.category}</p>
              <h3 className="mt-1 line-clamp-2 text-[17px] font-black leading-tight tracking-[-0.025em] text-white">{job.title}</h3>
              <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[#9ca3af]">{job.description}</p>
              <div className="mt-4 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold text-[#9ca3af]">{t.home.tonNative}</p>
                  <p className="mt-0.5 text-sm font-black text-white">{job.budgetAmount} {job.budgetToken}</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#a3e635] text-black shadow-[0_8px_18px_rgba(163,230,53,0.25)]"><ArrowUpRight className="h-4 w-4" /></span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyJobs />
      )}
    </section>
  );
}

function LatestJobs({ jobs }: { jobs: MarketplaceJob[] }) {
  const { t } = useLanguage();

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a3e635]">{t.marketplace.title}</p>
          <h2 className="mt-1 text-[22px] font-black tracking-[-0.045em] text-white">{t.home.activeDealsTitle}</h2>
        </div>
        <Link className="text-xs font-black text-[#a3e635]" href="/marketplace">{t.home.seeAll} <span aria-hidden="true">-&gt;</span></Link>
      </div>
      {jobs.slice(0, 3).map((job, index) => (
        <Link className="flex items-center gap-3 rounded-[25px] border border-[#262932] bg-[#111318] p-3.5 shadow-[0_9px_25px_rgba(0,0,0,0.6)] transition active:scale-[.99]" href={`/jobs/${job.id}` as Route} key={job.id}>
          <JobMark index={index} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="line-clamp-1 text-sm font-black text-white">{job.title}</h3>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#a3e635]" />
            </div>
            <p className="mt-1 flex items-center gap-1 truncate text-[10px] font-semibold text-[#9ca3af]"><MapPin className="h-3 w-3 text-[#a3e635]" />{job.category} / {job.deadline ?? t.jobCard.flexible}</p>
          </div>
          <div className="shrink-0 text-right">
            <Bookmark className="ml-auto h-4 w-4 text-[#4b5563]" />
            <p className="mt-2 text-xs font-black text-[#a3e635]">{job.budgetAmount} {job.budgetToken}</p>
          </div>
        </Link>
      ))}
      {!jobs.length ? <EmptyJobs /> : null}
    </section>
  );
}

function JobMark({ index }: { index: number }) {
  const Icon = index === 0 ? Code2 : index === 1 ? BriefcaseBusiness : Sparkles;

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-[#a3e635]/30 bg-[#a3e635]/15 text-[#a3e635]">
      <Icon className="h-5 w-5" />
    </div>
  );
}

function EmptyJobs() {
  const { t } = useLanguage();

  return (
    <div className="rounded-[25px] border border-dashed border-[#262932] bg-[#111318] p-5 text-center">
      <p className="text-sm font-black text-white">{t.marketplace.noJobsTitle}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#9ca3af]">{t.marketplace.noJobsBody}</p>
    </div>
  );
}

function ActiveDeal() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#a3e635]/30 bg-[linear-gradient(145deg,#111318,#191d26)] p-5 text-white shadow-[0_18px_40px_rgba(0,0,0,0.8)]">
      <div className="pointer-events-none absolute -bottom-16 -right-12 h-44 w-44 rounded-full border-[24px] border-[#a3e635]/10" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#a3e635]">{t.home.activeDealsTitle}</p>
          <h2 className="mt-2 line-clamp-2 text-lg font-black leading-tight text-white">{t.home.activeDealName}</h2>
        </div>
        <span className="shrink-0 rounded-full border border-[#a3e635]/40 bg-[#a3e635]/15 px-3 py-1.5 text-[11px] font-black text-[#a3e635]">20 TON</span>
      </div>
      <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-[#262932]">
        <div className="h-full w-[45%] rounded-full bg-[#a3e635]" />
      </div>
      <div className="relative mt-3 flex items-center justify-between text-[10px] font-bold text-[#9ca3af]">
        <span>{t.home.dueIn3Days}</span>
        <span className="text-[#a3e635]">{t.home.escrowed}</span>
      </div>
    </section>
  );
}
