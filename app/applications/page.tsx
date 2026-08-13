"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { ApplicationCard } from "@/components/mobile/ApplicationCard";
import { EmptyState } from "@/components/mobile/EmptyState";
import { MobileShell } from "@/components/mobile/MobileShell";
import { demoApplications } from "@/lib/demo/data";
import type { JobApplication } from "@/lib/domain/types";

export default function ApplicationsPage() {
  const { t } = useLanguage();
  const [applications, setApplications] = useState<JobApplication[]>(demoApplications);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/applications")
      .then((response) => response.json())
      .then((payload: { data?: { applications?: JobApplication[] } }) => {
        if (!cancelled) setApplications(payload.data?.applications ?? []);
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
          <p className="text-sm font-black text-[#a3e635]">{t.applications.eyebrow}</p>
          <h1 className="mt-1 text-[34px] font-black leading-none tracking-normal text-white">{t.applications.title}</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-[#9ca3af]">{t.applications.description}</p>
        </header>
        {applications.length === 0 ? (
          <EmptyState title={t.applications.emptyTitle} body={t.applications.emptyBody} action={t.applications.browseJobs} href="/marketplace" />
        ) : (
          applications.map((application) => <ApplicationCard key={application.id} application={application} />)
        )}
      </div>
    </MobileShell>
  );
}
