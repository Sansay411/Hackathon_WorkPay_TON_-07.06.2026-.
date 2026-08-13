"use client";

import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Home, Plus, Search, UserRound } from "lucide-react";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";

type BottomNavItem = {
  href: Route;
  labelKey: "home" | "jobs" | "create" | "deals" | "profile";
  icon: LucideIcon;
  center?: boolean;
};

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { profile } = useTelegram();
  const activeRole = profile?.activeRole ?? "client";

  const items: BottomNavItem[] = [
    { href: "/" as Route, labelKey: "home", icon: Home },
    { href: (activeRole === "freelancer" ? "/marketplace" : "/jobs") as Route, labelKey: "jobs", icon: Search },
    { href: "/deals/new" as Route, labelKey: "create", icon: Plus, center: true },
    { href: "/deals" as Route, labelKey: "deals", icon: BriefcaseBusiness },
    { href: "/profile" as Route, labelKey: "profile", icon: UserRound }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[390px] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="relative grid h-20 grid-cols-5 items-center rounded-[30px] border border-[#262932] bg-[#111318]/95 px-2 shadow-[0_18px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <FloatingActionButton isActive={pathname === "/deals/new"} />
        {items.map((item) => {
          const Icon = item.icon;
          const label = t.nav[item.labelKey];
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          if (item.center) {
            return (
              <Link key={item.labelKey} className="flex flex-col items-center gap-1 pt-8 text-[11px] font-black text-[#a3e635]" href={item.href}>
                <span className="sr-only">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.labelKey}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition ${
                isActive ? "bg-[#a3e635]/15 text-[#a3e635]" : "text-[#9ca3af] hover:text-white"
              }`}
              href={item.href}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-[#a3e635]" : "text-[#9ca3af]"}`} strokeWidth={2.4} />
              <span className={isActive ? "text-[#a3e635]" : "text-[#9ca3af]"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
