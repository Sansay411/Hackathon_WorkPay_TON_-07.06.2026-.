import {
  BadgeCheck,
  BriefcaseBusiness,
  Globe2,
  Send,
  Sparkles,
  Star,
  UserRound
} from "lucide-react";
import type { Profile } from "@/lib/domain/types";

function safeLink(value: string | null | undefined, kind?: "telegram") {
  if (!value) return null;
  if (kind === "telegram" && value.startsWith("@")) return `https://t.me/${value.slice(1)}`;
  if (kind === "telegram" && !/^https?:\/\//i.test(value)) return `https://t.me/${value.replace(/^@/, "")}`;
  return /^https?:\/\//i.test(value) ? value : null;
}

export function FreelancerProfileCard({ profile }: { profile: Profile }) {
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || (profile.telegramUsername ? `@${profile.telegramUsername}` : "WorkPay professional");
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const skills = profile.skills ?? [];
  const links = [
    { label: "Portfolio", href: safeLink(profile.portfolioChannel, "telegram"), icon: <Send className="h-4 w-4" /> },
    { label: "GitHub", href: safeLink(profile.githubUrl), icon: <BriefcaseBusiness className="h-4 w-4" /> },
    { label: "LinkedIn", href: safeLink(profile.linkedinUrl), icon: <BadgeCheck className="h-4 w-4" /> },
    { label: "Website", href: safeLink(profile.websiteUrl), icon: <Globe2 className="h-4 w-4" /> }
  ].flatMap((item) => item.href ? [{ ...item, href: item.href }] : []);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[32px] border border-white/75 bg-white/[0.75] shadow-[0_24px_70px_rgba(41,91,116,0.15)] backdrop-blur-2xl">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.25),transparent_42%),radial-gradient(circle_at_left,rgba(56,189,248,0.25),transparent_46%),linear-gradient(145deg,rgba(255,255,255,0.96),rgba(238,250,252,0.74))] p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="h-[76px] w-[76px] rounded-[24px] border-2 border-white object-cover shadow-lg" />
              ) : (
                <div className="grid h-[76px] w-[76px] place-items-center rounded-[24px] border-2 border-white bg-gradient-to-br from-cyan-500 to-emerald-400 text-xl font-black text-white shadow-lg">
                  {initials || <UserRound className="h-7 w-7" />}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-emerald-500 text-white">
                <BadgeCheck className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-black tracking-[-0.04em] text-slate-950">{name}</h1>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {profile.telegramUsername ? `@${profile.telegramUsername}` : "Verified Telegram professional"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-800">
                  <BriefcaseBusiness className="h-3 w-3" />
                  Freelancer
                </span>
                {profile.hourlyRate ? (
                  <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black text-white">{profile.hourlyRate} TON/h</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat icon={<Star className="h-3.5 w-3.5 fill-current" />} value={(profile.rating ?? 0).toFixed(1)} label="Rating" />
            <Stat icon={<BriefcaseBusiness className="h-3.5 w-3.5" />} value={String(profile.completedDealsCount ?? 0)} label="Deals" />
            <Stat icon={<Sparkles className="h-3.5 w-3.5" />} value={`${profile.successRate ?? 0}%`} label="Success" />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/75 bg-white/[0.78] p-5 shadow-[0_18px_50px_rgba(41,91,116,0.09)] backdrop-blur-xl">
        <h2 className="text-xs font-black uppercase tracking-[0.11em] text-slate-500">About</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700">
          {profile.bio || "This professional has not added a bio yet."}
        </p>
      </section>

      <section className="rounded-[28px] border border-white/75 bg-white/[0.74] p-5 backdrop-blur-xl">
        <h2 className="text-xs font-black uppercase tracking-[0.11em] text-slate-500">Expertise</h2>
        {skills.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="rounded-full border border-cyan-200/80 bg-cyan-50/80 px-3 py-1.5 text-xs font-black text-cyan-800">{skill}</span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm font-medium text-slate-400">Skills are not listed yet.</p>
        )}
      </section>

      {links.length ? (
        <section className="grid grid-cols-2 gap-2">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-white/80 bg-white/[0.72] px-3 text-xs font-black text-slate-700 backdrop-blur-xl transition active:scale-[0.98]"
            >
              <span className="text-cyan-600">{link.icon}</span>
              {link.label}
            </a>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-[18px] border border-white/85 bg-white/60 p-2.5 text-center">
      <p className="flex items-center justify-center gap-1 text-sm font-black text-slate-950">
        <span className="text-amber-500">{icon}</span>{value}
      </p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</p>
    </div>
  );
}
