"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ConnectsWidget } from "@/components/mobile/ConnectsWidget";
import { EmptyState } from "@/components/mobile/EmptyState";
import { JobCard } from "@/components/mobile/JobCard";
import { MobileShell } from "@/components/mobile/MobileShell";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";
import { demoJobs, demoProfile } from "@/lib/demo/data";
import type { MarketplaceJob } from "@/lib/domain/types";

export default function MarketplacePage() {
  const { t } = useLanguage();
  const { profile } = useTelegram();
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
    <MobileShell>
      <div className="space-y-5 text-white">
        <header>
          <p className="text-sm font-black text-[#a3e635]">{t.marketplace.eyebrow}</p>
          <h1 className="mt-1 text-[34px] font-black leading-none tracking-normal text-white">{t.marketplace.title}</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-[#9ca3af]">{t.marketplace.description}</p>
        </header>
        <ConnectsWidget
          connects={profile?.connectsBalance ?? demoProfile.connectsBalance ?? 30}
          subscriptionUntil={profile?.subscriptionUntil ?? demoProfile.subscriptionUntil ?? null}
        />
        <label className="flex h-14 items-center gap-3 rounded-[24px] border border-[#262932] bg-[#111318] px-4 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
          <Search className="h-5 w-5 text-[#a3e635]" />
          <input className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-[#6b7280]" placeholder={t.marketplace.search} />
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {t.marketplace.categories.map((category, index) => (
            <button className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${index === 0 ? "bg-[#a3e635] text-black shadow-[0_4px_16px_rgba(163,230,53,0.3)]" : "border border-[#262932] bg-[#111318] text-[#9ca3af] hover:text-white"}`} key={category} type="button">
              {category}
            </button>
          ))}
        </div>
        <section className="space-y-3">
          {jobs.length === 0 ? (
            <EmptyState title={t.marketplace.noJobsTitle} body={t.marketplace.noJobsBody} action={t.marketplace.createJob} href="/jobs/new" />
          ) : (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </section>
      </div>
    </MobileShell>
  );
}
