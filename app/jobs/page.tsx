"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/mobile/EmptyState";
import { JobCard } from "@/components/mobile/JobCard";
import { MobileShell } from "@/components/mobile/MobileShell";
import { useTelegram } from "@/components/telegram-provider";
import type { MarketplaceJob } from "@/lib/domain/types";

export default function ClientJobsPage() {
  const { initData } = useTelegram();
  const [jobs, setJobs] = useState<MarketplaceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!initData) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void fetch(`/api/jobs?my=true&initData=${encodeURIComponent(initData)}`)
      .then((res) => res.json())
      .then((payload: { ok?: boolean; data?: { jobs?: MarketplaceJob[] } }) => {
        if (!cancelled && payload.ok && Array.isArray(payload.data?.jobs)) {
          setJobs(payload.data.jobs);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initData]);

  const filteredJobs = jobs.filter((job) => {
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      return (
        job.title.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <MobileShell>
      <div className="space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-[#229ED9]">Client Dashboard</p>
            <h1 className="mt-1 text-[34px] font-black leading-none tracking-normal">My Posted Jobs</h1>
          </div>
          <Link
            href="/jobs/new"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00658e] text-white shadow-md active:scale-95 transition-all"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </header>

        <label className="flex h-14 items-center gap-3 rounded-[24px] border border-[#dfe3e8] bg-white px-4 shadow-[0_12px_30px_rgba(0,101,142,0.08)]">
          <Search className="h-5 w-5 text-[#64748b]" />
          <input
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#64748b]"
            placeholder="Search my jobs"
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
          />
        </label>

        <section className="space-y-3">
          {loading ? (
            <div className="py-10 text-center font-bold text-[#64748b]">Loading my jobs...</div>
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              title="No postings yet"
              body="Post a job on WorkPay to find freelancers and initiate secure escrow deals."
              action="Create first job"
              href="/jobs/new"
            />
          ) : (
            filteredJobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </section>
      </div>
    </MobileShell>
  );
}
