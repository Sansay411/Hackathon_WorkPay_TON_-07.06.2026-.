"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  LoaderCircle,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap
} from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";
import { MobileShell } from "@/components/mobile/MobileShell";

type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetAmount: number;
  budgetToken: string;
  deadline: string | null;
  status: string;
  deliverables: string[];
  acceptanceCriteria: string[];
  createdAt: string | null;
  clientId: string;
  clientName: string;
  clientUsername: string;
  clientAvatar: string;
  clientRating: number;
};

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function list(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeJob(raw: Record<string, unknown>): Job {
  const client = raw.client && typeof raw.client === "object" ? (raw.client as Record<string, unknown>) : {};
  const firstName = text(client.first_name ?? client.firstName);
  const lastName = text(client.last_name ?? client.lastName);
  return {
    id: text(raw.id),
    title: text(raw.title),
    description: text(raw.description),
    category: text(raw.category),
    budgetAmount: Number(raw.budget_amount ?? raw.budgetAmount ?? 0),
    budgetToken: text(raw.budget_token ?? raw.budgetToken) || "TON",
    deadline: text(raw.deadline) || null,
    status: text(raw.status),
    deliverables: list(raw.deliverables),
    acceptanceCriteria: list(raw.acceptance_criteria ?? raw.acceptanceCriteria),
    createdAt: text(raw.created_at ?? raw.createdAt) || null,
    clientId: text(raw.client_id ?? raw.clientId),
    clientName: [firstName, lastName].filter(Boolean).join(" ") || text(client.telegram_username ?? client.telegramUsername) || "WorkPay client",
    clientUsername: text(client.telegram_username ?? client.telegramUsername),
    clientAvatar: text(client.avatar_url ?? client.avatarUrl),
    clientRating: Number(client.rating ?? 0)
  };
}

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const jobId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { initData, profile } = useTelegram();
  const { language } = useLanguage();
  const ru = language === "ru";
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    const query = initData ? `?initData=${encodeURIComponent(initData)}` : "";
    void fetch(`/api/jobs/${encodeURIComponent(jobId)}${query}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.error?.message || "Job could not be loaded.");
        return normalizeJob(payload.data.job as Record<string, unknown>);
      })
      .then((result) => {
        if (!cancelled) setJob(result);
      })
      .catch((error) => {
        if (!cancelled) setMessage({ type: "error", text: error instanceof Error ? error.message : "Job could not be loaded." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initData, jobId]);

  const canApply = useMemo(() => {
    return Boolean(
      job &&
        profile?.activeRole === "freelancer" &&
        profile.id !== job.clientId &&
        (job.status === "published" || job.status === "ai_reviewed")
    );
  }, [job, profile]);

  async function draftProposal() {
    if (!initData || !job) {
      setMessage({ type: "error", text: ru ? "AI-помощник доступен внутри Telegram." : "AI assistant is available inside Telegram." });
      return;
    }

    setAiLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          mode: "proposal",
          prompt: ru
            ? "Подготовь персональный отклик на эту вакансию. Не придумывай опыт и задай конкретный первый шаг."
            : "Prepare a tailored proposal for this job. Do not invent experience and offer a concrete first step.",
          context: {
            job: {
              title: job.title,
              description: job.description,
              deliverables: job.deliverables,
              acceptanceCriteria: job.acceptanceCriteria,
              budget: `${job.budgetAmount} ${job.budgetToken}`
            },
            currentDraft: proposal
          }
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message || "AI assistant failed.");
      const generated = text(payload.data.result?.proposal);
      if (generated) setProposal(generated);
      setMessage({
        type: "info",
        text: ru ? "Черновик готов. Проверьте факты перед отправкой." : "Draft ready. Verify every fact before submitting."
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "AI assistant failed." });
    } finally {
      setAiLoading(false);
    }
  }

  async function apply() {
    if (!initData || !job) {
      setMessage({ type: "error", text: ru ? "Откройте вакансию внутри Telegram." : "Open the job inside Telegram." });
      return;
    }
    if (proposal.trim().length < 20) {
      setMessage({ type: "error", text: ru ? "Добавьте содержательный отклик минимум из 20 символов." : "Write a meaningful proposal of at least 20 characters." });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(job.id)}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, proposalText: proposal.trim() })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message || "Proposal could not be submitted.");
      setSubmitted(true);
      setMessage({
        type: "success",
        text: ru ? `Отклик отправлен. Осталось Connects: ${payload.data.connectsBalance}.` : `Proposal submitted. Connects left: ${payload.data.connectsBalance}.`
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Proposal could not be submitted." });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <MobileShell>
        <div className="grid min-h-[60vh] place-items-center">
          <LoaderCircle className="h-7 w-7 animate-spin text-cyan-600" />
        </div>
      </MobileShell>
    );
  }

  if (!job) {
    return (
      <MobileShell>
        <div className="rounded-[30px] border border-white/75 bg-white/[0.74] p-6 text-center backdrop-blur-xl">
          <BriefcaseBusiness className="mx-auto h-8 w-8 text-slate-400" />
          <h1 className="mt-3 text-xl font-black text-slate-950">{ru ? "Вакансия не найдена" : "Job not found"}</h1>
          <Link href="/marketplace" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-cyan-700">
            <ArrowLeft className="h-4 w-4" />
            {ru ? "Вернуться к вакансиям" : "Back to jobs"}
          </Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-4"
      >
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-xs font-black text-slate-500">
          <ArrowLeft className="h-4 w-4" />
          {ru ? "Все вакансии" : "All jobs"}
        </Link>

        <section className="overflow-hidden rounded-[32px] border border-white/75 bg-white/[0.74] shadow-[0_24px_70px_rgba(41,91,116,0.15)] backdrop-blur-2xl">
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.25),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.96),rgba(238,250,252,0.74))] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-200 bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-800">{job.category}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-700">
                <ShieldCheck className="h-3 w-3" />
                {job.status}
              </span>
            </div>
            <h1 className="mt-4 text-[30px] font-black leading-[1.02] tracking-[-0.045em] text-slate-950">{job.title}</h1>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <InfoTile icon={<CircleDollarSign className="h-4 w-4" />} label={ru ? "Бюджет" : "Budget"} value={`${job.budgetAmount} ${job.budgetToken}`} />
              <InfoTile
                icon={<CalendarDays className="h-4 w-4" />}
                label={ru ? "Дедлайн" : "Deadline"}
                value={job.deadline ? new Date(job.deadline).toLocaleDateString(ru ? "ru-RU" : "en-US") : ru ? "Гибкий" : "Flexible"}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[26px] border border-white/75 bg-white/[0.74] p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {job.clientAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={job.clientAvatar} alt="" className="h-12 w-12 rounded-2xl object-cover" />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white"><UserRound className="h-5 w-5" /></div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-slate-950">{job.clientName}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{job.clientUsername ? `@${job.clientUsername}` : ru ? "Заказчик WorkPay" : "WorkPay client"}</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
              <Sparkles className="h-3.5 w-3.5" />
              {job.clientRating.toFixed(1)}
            </span>
          </div>
        </section>

        <section className="space-y-5 rounded-[28px] border border-white/75 bg-white/[0.78] p-5 shadow-[0_18px_50px_rgba(41,91,116,0.09)] backdrop-blur-xl">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.1em] text-slate-500">{ru ? "Описание" : "Project brief"}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700">{job.description}</p>
          </div>
          {job.deliverables.length ? <Checklist title={ru ? "Результаты" : "Deliverables"} items={job.deliverables} /> : null}
          {job.acceptanceCriteria.length ? <Checklist title={ru ? "Критерии приёмки" : "Acceptance criteria"} items={job.acceptanceCriteria} /> : null}
        </section>

        {canApply ? (
          <section className="rounded-[30px] border border-cyan-200/80 bg-gradient-to-br from-white/90 to-cyan-50/80 p-4 shadow-[0_20px_54px_rgba(14,165,233,0.12)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black tracking-[-0.03em] text-slate-950">{ru ? "Ваш отклик" : "Your proposal"}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {ru ? "Отправка стоит 1 Connect. Опишите подход и первый шаг." : "Submitting costs 1 Connect. Explain your approach and first step."}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-950 px-2.5 py-1.5 text-[10px] font-black text-white">
                <Zap className="h-3 w-3 fill-current" />
                1 Connect
              </span>
            </div>

            <textarea
              value={proposal}
              onChange={(event) => setProposal(event.target.value)}
              disabled={submitted}
              rows={7}
              maxLength={5000}
              className="mt-4 w-full resize-none rounded-[20px] border border-cyan-200/80 bg-white/90 px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:opacity-70"
              placeholder={ru ? "Покажите, что поняли задачу, предложите план и уточните важное..." : "Show that you understand the job, offer a plan, and clarify what matters..."}
            />
            <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span>{proposal.length}/5000</span>
              <span>{ru ? `Баланс: ${profile?.connectsBalance ?? 0}` : `Balance: ${profile?.connectsBalance ?? 0}`}</span>
            </div>

            <div className="mt-3 grid grid-cols-[0.9fr_1.1fr] gap-2">
              <button
                type="button"
                onClick={draftProposal}
                disabled={aiLoading || submitted}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-3 text-xs font-black text-slate-800 transition active:scale-[0.98] disabled:opacity-50"
              >
                {aiLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4 text-cyan-600" />}
                {ru ? "AI-черновик" : "AI draft"}
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={submitting || submitted || proposal.trim().length < 20}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 px-3 text-xs font-black text-white shadow-lg shadow-cyan-500/20 transition active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : submitted ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {submitted ? (ru ? "Отправлено" : "Submitted") : ru ? "Отправить отклик" : "Send proposal"}
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-[24px] border border-white/75 bg-white/[0.7] p-4 text-center backdrop-blur-xl">
            <Clock3 className="mx-auto h-5 w-5 text-slate-400" />
            <p className="mt-2 text-xs font-bold text-slate-500">
              {profile?.activeRole === "client"
                ? ru ? "Переключитесь на роль фрилансера, чтобы отправить отклик." : "Switch to the freelancer role to submit a proposal."
                : ru ? "Эта вакансия сейчас не принимает отклики." : "This job is not accepting proposals right now."}
            </p>
          </section>
        )}

        {message ? (
          <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${message.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-cyan-200 bg-cyan-50 text-cyan-800"}`}>
            {message.text}
          </div>
        ) : null}
      </motion.div>
    </MobileShell>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/85 bg-white/65 p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-cyan-700">{icon}{label}</p>
      <p className="mt-2 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-sm font-black uppercase tracking-[0.1em] text-slate-500">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 rounded-2xl bg-slate-50/80 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
