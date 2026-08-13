"use client";

import { useLanguage } from "@/components/language-provider";
import { EmptyState } from "@/components/mobile/EmptyState";
import { MobileShell } from "@/components/mobile/MobileShell";

export default function NotificationsPage() {
  const { t } = useLanguage();

  return (
    <MobileShell>
      <div className="space-y-5 text-white">
        <header>
          <p className="text-sm font-black text-[#a3e635]">{t.notifications.eyebrow}</p>
          <h1 className="mt-1 text-[34px] font-black leading-none tracking-normal text-white">{t.notifications.title}</h1>
        </header>
        <EmptyState
          title={t.notifications.emptyTitle}
          body={t.notifications.emptyBody}
          action={t.notifications.openJobs}
          href="/marketplace"
        />
      </div>
    </MobileShell>
  );
}
