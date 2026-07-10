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
import { useLanguage } from "@/components/language-provider";
import { demoJobs } from "@/lib/demo/data";
import type { MarketplaceJob } from "@/lib/domain/types";

export default function HomePage() {
  const { t } = useLanguage();
  const [jobs, setJobs] = useState<MarketplaceJob[]>(demoJobs);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const categories = t.marketplace.categories;
  const selectedCategory = categories.includes(activeCategory) ? activeCategory : categories[0];
  const categoryIndex = categories.indexOf(selectedCategory);
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
    <section className="relative overflow-hidden rounded-[32px] border border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,.9),rgba(217,244,251,.68))] p-5 shadow-[0_22px_54px_rgba(58,88,105,.12)]">
      <div className="pointer-events-none absolute -right-5 -top-2 select-none text-[76px] font-black leading-none tracking-[-0.12em] text-[#d9edf3]/75">{t.home.findWork.toUpperCase()}</div>
      <div className="pointer-events-none absolute -bottom-16 -right-12 h-44 w-44 rounded-full border-[24px] border-white/50" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 max-w-[270px]">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#148fbe]">{t.home.subtitle}</p>
          <h1 className="text-[29px] font-black leading-[1.04] tracking-[-0.055em] text-[#17272f]">{t.home.title}</h1>
          <p className="mt-3 text-[13px] font-semibold leading-5 text-[#71838c]">{t.home.description}</p>
        </div>
        <div className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-[25px] border border-white/60 bg-[linear-gradient(145deg,#6cd3ef,#1aa4d5)] text-white shadow-[0_18px_36px_rgba(26,157,207,.24)]">
          <Sparkles className="h-7 w-7" strokeWidth={1.7} />
        </div>
      </div>
      <div className="relative mt-5 flex flex-wrap gap-2">
        <StatusPill icon={<CheckCircle2 className="h-3.5 w-3.5" />} label={t.home.tonSecured} />
        <StatusPill icon={<Sparkles className="h-3.5 w-3.5" />} label={t.home.aiReviewed} accent />
        <StatusPill icon={<WalletCards className="h-3.5 w-3.5" />} label={t.home.stonfiReady} />
      </div>
    </section>
  );
}

function StatusPill({ icon, label, accent = false }: { icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black backdrop-blur ${accent ? "border-[#aee8f5] bg-[#eafaff] text-[#148fbe]" : "border-white/80 bg-white/75 text-[#0d789f]"}`}>
      {icon}
      {label}
    </span>
  );
}

function ReminderCard() {
  const { t } = useLanguage();

  return (
    <section className="flex items-center gap-3 rounded-[25px] border border-white/90 bg-white/65 p-3 shadow-[0_10px_28px_rgba(58,88,105,.08)] backdrop-blur-xl">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#d9f4fb] text-[#148fbe] shadow-inner">
        <TimerReset className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black text-[#17272f]">{t.home.aiReviewed}</p>
          <span className="rounded-lg bg-[#e8f7fb] px-2 py-1 text-[10px] font-black text-[#148fbe]">45%</span>
        </div>
        <p className="mt-1 truncate text-[11px] font-semibold text-[#71838c]">{t.home.activeDealName}</p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-[10px] font-black text-[#17272f]">{t.home.inProgress}</p>
        <p className="mt-1 text-[10px] font-semibold text-[#71838c]">{t.home.dueIn3Days}</p>
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
  categories: string[];
  onCategoryChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  query: string;
}) {
  const { t } = useLanguage();

  return (
    <section className="rounded-[27px] border border-white/90 bg-white/70 p-3 shadow-[0_10px_30px_rgba(58,88,105,.09)] backdrop-blur-xl">
      <label className="flex h-12 items-center gap-2 rounded-[18px] border border-[#d6eef5] bg-white/85 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,.95)]">
        <Search className="h-5 w-5 shrink-0 text-[#17272f]" strokeWidth={1.8} />
        <input
          aria-label={t.marketplace.search}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#17272f] outline-none placeholder:text-[#91a0a7]"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t.marketplace.search}
          type="search"
          value={query}
        />
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eafaff] text-[#148fbe]">
          <Filter className="h-4 w-4" />
        </span>
      </label>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <button
            className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-black transition ${activeCategory === category ? "bg-[linear-gradient(135deg,#55c7e9,#1aa3d4)] text-white shadow-[0_8px_20px_rgba(24,150,198,.18)]" : "border border-[#e2edf1] bg-white/75 text-[#71838c]"}`}
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
      <CompactAction href="/marketplace" icon={<Search className="h-4 w-4" />} label={t.home.findWork} />
      <CompactAction href="/wallet" icon={<WalletCards className="h-4 w-4" />} label={t.home.deposit} />
    </section>
  );
}

function CompactAction({ href, icon, label, primary = false }: { href: Route; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <Link className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-[19px] px-2 text-center text-[10px] font-black shadow-[0_8px_22px_rgba(58,88,105,.07)] transition active:scale-[.98] ${primary ? "bg-[#17343c] text-white" : "border border-white/90 bg-white/70 text-[#304650]"}`} href={href}>
      {icon}
      <span className="line-clamp-2 leading-tight">{label}</span>
    </Link>
  );
}

function AgentPulse() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden rounded-[27px] bg-[linear-gradient(145deg,#334c57,#172a33)] p-4 text-white shadow-[0_16px_38px_rgba(45,83,102,.18)]">
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full border-[18px] border-white/10" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#9fe5f6]">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-black">{t.home.aiReviewed}</p>
          </div>
          <p className="mt-2 max-w-[235px] text-xs font-medium leading-5 text-white/65">{t.home.description}</p>
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#b9edf8]">Mira</span>
      </div>
      <Link className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#43bee6] px-3.5 py-2 text-[11px] font-black text-white shadow-[0_9px_22px_rgba(25,143,187,.2)]" href="/jobs">
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
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#148fbe]">{t.home.aiReviewed}</p>
          <h2 className="mt-1 text-[22px] font-black tracking-[-0.045em] text-[#17272f]">{t.home.recommendedJobs}</h2>
        </div>
        <Link className="text-xs font-black text-[#148fbe]" href="/marketplace">{t.home.seeAll} <span aria-hidden="true">-&gt;</span></Link>
      </div>
      {cards.length ? (
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cards.map((job, index) => (
            <Link className="group relative min-w-[238px] snap-start overflow-hidden rounded-[28px] border border-white/90 bg-white/76 p-4 shadow-[0_13px_30px_rgba(58,88,105,.1)] backdrop-blur-xl transition active:scale-[.99]" href={`/jobs/${job.id}` as Route} key={job.id}>
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${index === 0 ? "from-[#55c7e9] to-[#148fbe]" : "from-[#aee8f5] to-[#43bee6]"}`} />
              <div className="flex items-start justify-between gap-3">
                <JobMark index={index} />
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1fafc] text-[#148fbe]"><Bookmark className="h-4 w-4" /></span>
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.1em] text-[#148fbe]">{job.category}</p>
              <h3 className="mt-1 line-clamp-2 text-[17px] font-black leading-tight tracking-[-0.025em] text-[#17272f]">{job.title}</h3>
              <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[#71838c]">{job.description}</p>
              <div className="mt-4 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold text-[#71838c]">{t.home.tonNative}</p>
                  <p className="mt-0.5 text-sm font-black text-[#17272f]">{job.budgetAmount} {job.budgetToken}</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#43bee6] text-white shadow-[0_8px_18px_rgba(25,143,187,.18)]"><ArrowUpRight className="h-4 w-4" /></span>
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
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#148fbe]">{t.marketplace.title}</p>
          <h2 className="mt-1 text-[22px] font-black tracking-[-0.045em] text-[#17272f]">{t.home.activeDealsTitle}</h2>
        </div>
        <Link className="text-xs font-black text-[#148fbe]" href="/marketplace">{t.home.seeAll} <span aria-hidden="true">-&gt;</span></Link>
      </div>
      {jobs.slice(0, 3).map((job, index) => (
        <Link className="flex items-center gap-3 rounded-[25px] border border-white/90 bg-white/72 p-3.5 shadow-[0_9px_25px_rgba(58,88,105,.08)] backdrop-blur-xl transition active:scale-[.99]" href={`/jobs/${job.id}` as Route} key={job.id}>
          <JobMark index={index} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="line-clamp-1 text-sm font-black text-[#17272f]">{job.title}</h3>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#35b780]" />
            </div>
            <p className="mt-1 flex items-center gap-1 truncate text-[10px] font-semibold text-[#71838c]"><MapPin className="h-3 w-3" />{job.category} / {job.deadline ?? t.jobCard.flexible}</p>
          </div>
          <div className="shrink-0 text-right">
            <Bookmark className="ml-auto h-4 w-4 text-[#c6d4da]" />
            <p className="mt-2 text-xs font-black text-[#17272f]">{job.budgetAmount} {job.budgetToken}</p>
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
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] ${index === 0 ? "bg-[#d9f4fb] text-[#148fbe]" : "bg-[#edf8fb] text-[#35a9c8]"}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function EmptyJobs() {
  const { t } = useLanguage();

  return (
    <div className="rounded-[25px] border border-dashed border-[#c7e8f1] bg-white/55 p-5 text-center">
      <p className="text-sm font-black text-[#17272f]">{t.marketplace.noJobsTitle}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#71838c]">{t.marketplace.noJobsBody}</p>
    </div>
  );
}

function ActiveDeal() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#17343c,#274f5b)] p-5 text-white shadow-[0_18px_40px_rgba(45,83,102,.2)]">
      <div className="pointer-events-none absolute -bottom-16 -right-12 h-44 w-44 rounded-full border-[24px] border-white/10" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9fe5f6]">{t.home.activeDealsTitle}</p>
          <h2 className="mt-2 line-clamp-2 text-lg font-black leading-tight">{t.home.activeDealName}</h2>
        </div>
        <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black">20 TON</span>
      </div>
      <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div className="h-full w-[45%] rounded-full bg-[#43bee6]" />
      </div>
      <div className="relative mt-3 flex items-center justify-between text-[10px] font-bold text-white/60">
        <span>{t.home.dueIn3Days}</span>
        <span>{t.home.escrowed}</span>
      </div>
    </section>
  );
}
