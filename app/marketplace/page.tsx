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
      <div className="space-y-5">
        <header>
          <p className="text-sm font-black text-[#229ED9]">{t.marketplace.eyebrow}</p>
          <h1 className="mt-1 text-[34px] font-black leading-none tracking-normal">{t.marketplace.title}</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-[#64748b]">{t.marketplace.description}</p>
        </header>
        <ConnectsWidget
          connects={profile?.connectsBalance ?? demoProfile.connectsBalance ?? 30}
          subscriptionUntil={profile?.subscriptionUntil ?? demoProfile.subscriptionUntil ?? null}
        />
        <label className="flex h-14 items-center gap-3 rounded-[24px] border border-[#dfe3e8] bg-white px-4 shadow-[0_12px_30px_rgba(0,101,142,0.08)]">
          <Search className="h-5 w-5 text-[#64748b]" />
          <input className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#64748b]" placeholder={t.marketplace.search} />
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {t.marketplace.categories.map((category, index) => (
            <button className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${index === 0 ? "bg-[#00658e] text-white" : "bg-white text-[#64748b]"}`} key={category} type="button">
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
