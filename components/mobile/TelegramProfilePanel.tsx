"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Globe2,
  LoaderCircle,
  Save,
  Send,
  Sparkles,
  UserRound,
  WalletCards
} from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";

type ProfileDraft = {
  bio: string;
  skills: string;
  hourlyRate: string;
  portfolioChannel: string;
  githubUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
};

type ProfileView = {
  id: string;
  firstName: string;
  lastName: string;
  telegramUsername: string;
  avatarUrl: string;
  activeRole: "client" | "freelancer";
  connectsBalance: number;
  tonBalance: number;
  rating: number;
  completedDealsCount: number;
  draft: ProfileDraft;
};

type AiProfileResult = {
  bio?: string;
  skills?: string[];
  suggestions?: string[];
};

const emptyDraft: ProfileDraft = {
  bio: "",
  skills: "",
  hourlyRate: "",
  portfolioChannel: "",
  githubUrl: "",
  linkedinUrl: "",
  websiteUrl: ""
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeProfile(source: Record<string, unknown>): ProfileView {
  const skills = Array.isArray(source.skills)
    ? source.skills.filter((item): item is string => typeof item === "string")
    : [];
  const activeRole = source.activeRole === "client" || source.active_role === "client" ? "client" : "freelancer";

  return {
    id: stringValue(source.id),
    firstName: stringValue(source.firstName ?? source.first_name),
    lastName: stringValue(source.lastName ?? source.last_name),
    telegramUsername: stringValue(source.telegramUsername ?? source.telegram_username),
    avatarUrl: stringValue(source.avatarUrl ?? source.avatar_url),
    activeRole,
    connectsBalance: numberValue(source.connectsBalance ?? source.connects_balance),
    tonBalance: numberValue(source.tonBalance ?? source.ton_balance),
    rating: numberValue(source.rating),
    completedDealsCount: numberValue(source.completedDealsCount ?? source.completed_deals_count),
    draft: {
      bio: stringValue(source.bio),
      skills: skills.join(", "),
      hourlyRate:
        source.hourlyRate !== null && source.hourlyRate !== undefined
          ? String(source.hourlyRate)
          : source.hourly_rate !== null && source.hourly_rate !== undefined
            ? String(source.hourly_rate)
            : "",
      portfolioChannel: stringValue(source.portfolioChannel ?? source.portfolio_channel),
      githubUrl: stringValue(source.githubUrl ?? source.github_url),
      linkedinUrl: stringValue(source.linkedinUrl ?? source.linkedin_url),
      websiteUrl: stringValue(source.websiteUrl ?? source.website_url)
    }
  };
}

function splitSkills(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export function TelegramProfilePanel() {
  const { initData, profile: telegramProfile } = useTelegram();
  const { language } = useLanguage();
  const ru = language === "ru";
  const [view, setView] = useState<ProfileView | null>(() => {
    if (!telegramProfile) return null;
    return normalizeProfile(telegramProfile as unknown as Record<string, unknown>);
  });
  const [draft, setDraft] = useState<ProfileDraft>(() => view?.draft ?? emptyDraft);
  const [loading, setLoading] = useState(Boolean(initData));
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (!initData) {
      return;
    }

    let cancelled = false;
    void fetch(`/api/profile/me?initData=${encodeURIComponent(initData)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.error?.message || "Profile could not be loaded.");
        return payload.data.profile as Record<string, unknown>;
      })
      .then((profile) => {
        if (cancelled) return;
        const normalized = normalizeProfile(profile);
        setView(normalized);
        setDraft(normalized.draft);
      })
      .catch((error) => {
        if (!cancelled) setMessage({ type: "error", text: error instanceof Error ? error.message : "Profile could not be loaded." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initData]);

  const completion = useMemo(() => {
    const checks = [
      draft.bio.trim().length >= 80,
      splitSkills(draft.skills).length >= 3,
      Number(draft.hourlyRate) > 0,
      Boolean(draft.portfolioChannel || draft.githubUrl || draft.linkedinUrl || draft.websiteUrl),
      Boolean(view?.firstName || view?.telegramUsername)
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [draft, view]);

  const name =
    [view?.firstName, view?.lastName].filter(Boolean).join(" ") ||
    (view?.telegramUsername ? `@${view.telegramUsername}` : ru ? "Профиль WorkPay" : "WorkPay profile");
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function update<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveProfile() {
    if (!initData) {
      setMessage({ type: "error", text: ru ? "Редактирование доступно только внутри Telegram." : "Editing is available only inside Telegram." });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          bio: draft.bio.trim(),
          skills: splitSkills(draft.skills),
          hourlyRate: draft.hourlyRate ? Number(draft.hourlyRate) : null,
          portfolioChannel: draft.portfolioChannel.trim(),
          githubUrl: draft.githubUrl.trim(),
          linkedinUrl: draft.linkedinUrl.trim(),
          websiteUrl: draft.websiteUrl.trim()
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message || "Profile could not be saved.");
      const normalized = normalizeProfile(payload.data.profile as Record<string, unknown>);
      setView(normalized);
      setDraft(normalized.draft);
      setMessage({ type: "success", text: ru ? "Профиль обновлён." : "Profile updated." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Profile could not be saved." });
    } finally {
      setSaving(false);
    }
  }

  async function improveProfile() {
    if (!initData) {
      setMessage({ type: "error", text: ru ? "AI-помощник доступен только в Telegram." : "AI assistant is available only in Telegram." });
      return;
    }
    const prompt =
      aiBrief.trim() ||
      (ru
        ? `Улучши мой профиль. Текущий текст: ${draft.bio}. Навыки: ${draft.skills}.`
        : `Improve my profile. Current bio: ${draft.bio}. Skills: ${draft.skills}.`);

    setAiLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          mode: "profile",
          prompt,
          context: {
            bio: draft.bio,
            skills: splitSkills(draft.skills),
            hourlyRate: draft.hourlyRate,
            links: [draft.portfolioChannel, draft.githubUrl, draft.linkedinUrl, draft.websiteUrl].filter(Boolean)
          }
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message || "AI assistant failed.");
      const result = payload.data.result as AiProfileResult;
      setDraft((current) => ({
        ...current,
        bio: result.bio || current.bio,
        skills: result.skills?.length ? result.skills.join(", ") : current.skills
      }));
      setSuggestions(result.suggestions ?? []);
      setMessage({
        type: "info",
        text: ru ? "DeepSeek подготовил черновик. Проверьте факты и сохраните." : "DeepSeek prepared a draft. Verify the facts and save it."
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "AI assistant failed." });
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[32px] border border-white/70 bg-white/70 backdrop-blur-2xl">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-cyan-600" />
          <p className="mt-3 text-sm font-bold text-slate-500">{ru ? "Собираю профиль..." : "Loading profile..."}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <section className="overflow-hidden rounded-[32px] border border-white/75 bg-white/[0.74] shadow-[0_24px_70px_rgba(41,91,116,0.15)] backdrop-blur-2xl">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.26),transparent_42%),radial-gradient(circle_at_left,rgba(56,189,248,0.25),transparent_46%),linear-gradient(145deg,rgba(255,255,255,0.95),rgba(238,250,252,0.74))] p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              {view?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={view.avatarUrl} alt="" className="h-[72px] w-[72px] rounded-[24px] border-2 border-white object-cover shadow-lg" />
              ) : (
                <div className="grid h-[72px] w-[72px] place-items-center rounded-[24px] border-2 border-white bg-gradient-to-br from-cyan-500 to-emerald-400 text-xl font-black text-white shadow-lg">
                  {initials || <UserRound className="h-7 w-7" />}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-emerald-500 text-white">
                <BadgeCheck className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-black tracking-[-0.03em] text-slate-950">{name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-200 bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-cyan-800">
                  {view?.activeRole === "client" ? (ru ? "Заказчик" : "Client") : (ru ? "Фрилансер" : "Freelancer")}
                </span>
                {view?.telegramUsername ? <span className="text-xs font-bold text-slate-500">@{view.telegramUsername}</span> : null}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black tracking-[-0.04em] text-slate-950">{completion}%</p>
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{ru ? "готово" : "ready"}</p>
            </div>
          </div>

          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/80">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-400"
              animate={{ width: `${completion}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat icon={<WalletCards className="h-4 w-4" />} value={String(view?.connectsBalance ?? 0)} label="Connects" />
            <Stat icon={<BriefcaseBusiness className="h-4 w-4" />} value={String(view?.completedDealsCount ?? 0)} label={ru ? "Сделок" : "Deals"} />
            <Stat icon={<Sparkles className="h-4 w-4" />} value={(view?.rating ?? 0).toFixed(1)} label={ru ? "Рейтинг" : "Rating"} />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/[0.74] p-4 shadow-[0_18px_50px_rgba(41,91,116,0.1)] backdrop-blur-xl">
        <div className="flex items-center gap-2 text-sm font-black text-slate-950">
          <Bot className="h-4 w-4 text-cyan-600" />
          {ru ? "AI-редактор профиля" : "AI profile editor"}
        </div>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
          {ru ? "Опишите специализацию и желаемых клиентов. AI не будет придумывать опыт." : "Describe your specialty and ideal clients. AI will not invent experience."}
        </p>
        <textarea
          value={aiBrief}
          onChange={(event) => setAiBrief(event.target.value)}
          rows={3}
          className="mt-3 w-full resize-none rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
          placeholder={ru ? "Я frontend-разработчик, специализируюсь на Telegram Mini Apps..." : "I am a frontend developer focused on Telegram Mini Apps..."}
        />
        <button
          type="button"
          onClick={improveProfile}
          disabled={aiLoading}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-lg transition active:scale-[0.985] disabled:opacity-60"
        >
          {aiLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {aiLoading ? (ru ? "Редактирую..." : "Improving...") : ru ? "Улучшить с DeepSeek" : "Improve with DeepSeek"}
        </button>
      </section>

      <section className="space-y-4 rounded-[28px] border border-white/70 bg-white/[0.78] p-4 shadow-[0_18px_50px_rgba(41,91,116,0.1)] backdrop-blur-xl">
        <Field label={ru ? "О себе" : "Professional bio"} hint={`${draft.bio.length}/2000`}>
          <textarea value={draft.bio} onChange={(event) => update("bio", event.target.value)} maxLength={2000} rows={7} className={`${inputClass} resize-none`} placeholder={ru ? "Чем вы сильны, какие задачи решаете и как работаете..." : "Your strengths, the problems you solve, and how you work..."} />
        </Field>

        <Field label={ru ? "Навыки через запятую" : "Skills, comma separated"} hint={ru ? "минимум 3" : "at least 3"}>
          <input value={draft.skills} onChange={(event) => update("skills", event.target.value)} className={inputClass} placeholder="React, TypeScript, Telegram Mini Apps" />
        </Field>

        <Field label={ru ? "Ставка за час" : "Hourly rate"} hint="TON">
          <input value={draft.hourlyRate} onChange={(event) => update("hourlyRate", event.target.value)} inputMode="decimal" className={inputClass} placeholder="5" />
        </Field>

        <div className="border-t border-slate-200/70 pt-4">
          <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">{ru ? "Доверие и портфолио" : "Trust and portfolio"}</p>
          <div className="mt-3 space-y-3">
            <LinkField icon={<Send className="h-4 w-4" />} label="Telegram portfolio" value={draft.portfolioChannel} onChange={(value) => update("portfolioChannel", value)} placeholder="https://t.me/your_portfolio" />
            <LinkField icon={<BriefcaseBusiness className="h-4 w-4" />} label="GitHub" value={draft.githubUrl} onChange={(value) => update("githubUrl", value)} placeholder="https://github.com/username" />
            <LinkField icon={<BadgeCheck className="h-4 w-4" />} label="LinkedIn" value={draft.linkedinUrl} onChange={(value) => update("linkedinUrl", value)} placeholder="https://linkedin.com/in/username" />
            <LinkField icon={<Globe2 className="h-4 w-4" />} label={ru ? "Личный сайт" : "Website"} value={draft.websiteUrl} onChange={(value) => update("websiteUrl", value)} placeholder="https://example.com" />
          </div>
        </div>
      </section>

      {suggestions.length ? (
        <section className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-4">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em] text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            {ru ? "Что усилить" : "Ways to improve"}
          </p>
          <ul className="mt-3 space-y-2">
            {suggestions.slice(0, 5).map((item) => (
              <li key={item} className="flex gap-2 text-xs font-semibold leading-5 text-emerald-900/75">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {message ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${message.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-cyan-200 bg-cyan-50 text-cyan-800"}`}>
          {message.text}
        </div>
      ) : null}

      <button
        type="button"
        onClick={saveProfile}
        disabled={saving}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-cyan-500 to-sky-600 px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(14,165,233,0.28)] transition active:scale-[0.985] disabled:opacity-60"
      >
        {saving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        {saving ? (ru ? "Сохраняю..." : "Saving...") : ru ? "Сохранить профиль" : "Save profile"}
      </button>
    </motion.div>
  );
}

export default TelegramProfilePanel;

const inputClass =
  "min-h-12 w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100";

function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
        {hint ? <span className="font-bold normal-case tracking-normal text-slate-400">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function LinkField({
  icon,
  label,
  value,
  onChange,
  placeholder
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600">
        <span className="text-cyan-600">{icon}</span>
        {label}
      </span>
      <input type="url" value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} placeholder={placeholder} />
    </label>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/60 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-cyan-700">
        {icon}
        <span className="text-sm font-black text-slate-950">{value}</span>
      </div>
      <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</p>
    </div>
  );
}
