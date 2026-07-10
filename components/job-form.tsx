"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ListChecks,
  LoaderCircle,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";

type AiJobResult = {
  title?: string;
  description?: string;
  deliverables?: string[];
  acceptanceCriteria?: string[];
  questions?: string[];
  riskNotes?: string[];
};

const categories = [
  "Development",
  "Design",
  "AI & Automation",
  "Marketing",
  "Writing & Translation",
  "Video & Audio",
  "Business"
];

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function JobForm() {
  const router = useRouter();
  const { initData } = useTelegram();
  const { language } = useLanguage();
  const ru = language === "ru";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState("");
  const [aiBrief, setAiBrief] = useState("");
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiRisks, setAiRisks] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "info"; text: string } | null>(null);

  const readyScore = useMemo(() => {
    return [
      title.trim().length >= 5,
      description.trim().length >= 20,
      Number(budgetAmount) > 0,
      lines(deliverables).length > 0,
      lines(acceptanceCriteria).length > 0
    ].filter(Boolean).length;
  }, [acceptanceCriteria, budgetAmount, deliverables, description, title]);

  async function improveWithAi() {
    if (!initData) {
      setMessage({ type: "error", text: ru ? "Откройте WorkPay внутри Telegram." : "Open WorkPay inside Telegram." });
      return;
    }
    const prompt = aiBrief.trim() || [title, description, deliverables].filter(Boolean).join("\n");
    if (prompt.length < 4) {
      setMessage({
        type: "error",
        text: ru ? "Коротко опишите задачу для AI-помощника." : "Add a short brief for the AI assistant."
      });
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
          mode: "job",
          prompt,
          context: { title, description, category, budgetAmount, deliverables, acceptanceCriteria }
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message || "AI assistant failed.");
      }
      const result = payload.data.result as AiJobResult;
      if (result.title) setTitle(result.title);
      if (result.description) setDescription(result.description);
      if (result.deliverables?.length) setDeliverables(result.deliverables.join("\n"));
      if (result.acceptanceCriteria?.length) setAcceptanceCriteria(result.acceptanceCriteria.join("\n"));
      setAiQuestions(result.questions ?? []);
      setAiRisks(result.riskNotes ?? []);
      setMessage({
        type: "info",
        text: ru ? "Черновик улучшен. Проверьте детали перед публикацией." : "Draft improved. Review the details before publishing."
      });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "AI assistant failed." });
    } finally {
      setAiLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!initData) {
      setMessage({ type: "error", text: ru ? "Публикация доступна только в Telegram." : "Publishing is available only in Telegram." });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          title,
          description,
          category,
          budgetAmount,
          budgetToken: "TON",
          deadline: deadline || null,
          deliverables: lines(deliverables),
          acceptanceCriteria: lines(acceptanceCriteria)
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error?.message || "Job could not be published.");
      }
      router.push(`/jobs/${payload.data.job.id}`);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Job could not be published." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/75 shadow-[0_24px_70px_rgba(41,91,116,0.14)] backdrop-blur-2xl">
        <div className="bg-[radial-gradient(circle_at_top_right,rgba(65,190,230,0.28),transparent_46%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(238,249,253,0.76))] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/80 bg-white/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-cyan-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                {ru ? "Умный бриф" : "Smart brief"}
              </span>
              <h1 className="mt-3 text-[30px] font-black leading-[0.98] tracking-[-0.045em] text-slate-950">
                {ru ? "Опишите результат, а не догадки" : "Describe the outcome, not the guesswork"}
              </h1>
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600">
                {ru
                  ? "Чёткие результаты и критерии приёмки снижают споры и помогают получить точные отклики."
                  : "Clear deliverables and acceptance criteria reduce disputes and attract precise proposals."}
              </p>
            </div>
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white bg-cyan-500 text-white shadow-lg shadow-cyan-500/25">
              <ListChecks className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-200/70">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
              animate={{ width: `${readyScore * 20}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] font-bold text-slate-500">
            {ru ? `Готовность брифа: ${readyScore}/5` : `Brief readiness: ${readyScore}/5`}
          </p>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/[0.72] p-4 shadow-[0_18px_50px_rgba(41,91,116,0.1)] backdrop-blur-xl">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <Sparkles className="h-4 w-4 text-cyan-600" />
          {ru ? "Собрать бриф с DeepSeek" : "Build the brief with DeepSeek"}
        </div>
        <textarea
          value={aiBrief}
          onChange={(event) => setAiBrief(event.target.value)}
          rows={3}
          placeholder={
            ru
              ? "Например: нужен Telegram Mini App для школы, кабинет ученика, подписка, срок 3 недели..."
              : "Example: Telegram Mini App for a school, student dashboard, subscription, three-week deadline..."
          }
          className="mt-3 w-full resize-none rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
        <button
          type="button"
          onClick={improveWithAi}
          disabled={aiLoading}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition active:scale-[0.985] disabled:opacity-60"
        >
          {aiLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
          {aiLoading ? (ru ? "Собираю структуру..." : "Structuring...") : ru ? "Улучшить бриф" : "Improve brief"}
        </button>
      </section>

      <section className="space-y-4 rounded-[28px] border border-white/70 bg-white/[0.76] p-4 shadow-[0_18px_50px_rgba(41,91,116,0.1)] backdrop-blur-xl">
        <Field label={ru ? "Название проекта" : "Project title"}>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={5} maxLength={160} className={inputClass} placeholder={ru ? "Коротко и конкретно" : "Short and specific"} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={ru ? "Категория" : "Category"}>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label={ru ? "Бюджет" : "Budget"}>
            <div className="relative">
              <CircleDollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-600" />
              <input value={budgetAmount} onChange={(event) => setBudgetAmount(event.target.value)} required inputMode="decimal" pattern="\d+(\.\d{1,9})?" className={`${inputClass} pl-9 pr-12`} placeholder="10" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">TON</span>
            </div>
          </Field>
        </div>

        <Field label={ru ? "Что нужно сделать" : "Scope and context"}>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} required minLength={20} maxLength={5000} rows={6} className={`${inputClass} resize-none`} placeholder={ru ? "Контекст, пользователи, ограничения, желаемый результат..." : "Context, users, constraints, and the expected result..."} />
        </Field>

        <Field label={ru ? "Результаты, по одному на строку" : "Deliverables, one per line"}>
          <textarea value={deliverables} onChange={(event) => setDeliverables(event.target.value)} rows={4} className={`${inputClass} resize-none`} placeholder={ru ? "Рабочий Mini App\nИсходный код\nИнструкция по запуску" : "Working Mini App\nSource code\nLaunch guide"} />
        </Field>

        <Field label={ru ? "Критерии приёмки" : "Acceptance criteria"}>
          <textarea value={acceptanceCriteria} onChange={(event) => setAcceptanceCriteria(event.target.value)} rows={4} className={`${inputClass} resize-none`} placeholder={ru ? "Открывается в Telegram\nОплата подтверждается сервером\nНет ошибок на мобильном" : "Opens in Telegram\nPayment is server-verified\nNo mobile runtime errors"} />
        </Field>

        <Field label={ru ? "Дедлайн" : "Deadline"}>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-600" />
            <input type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)} className={`${inputClass} pl-9`} />
          </div>
        </Field>
      </section>

      {aiQuestions.length || aiRisks.length ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {aiQuestions.length ? <InsightCard title={ru ? "Уточнить" : "Clarify"} items={aiQuestions} tone="cyan" /> : null}
          {aiRisks.length ? <InsightCard title={ru ? "Риски" : "Risks"} items={aiRisks} tone="amber" /> : null}
        </section>
      ) : null}

      {message ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${message.type === "error" ? "border-rose-200 bg-rose-50/90 text-rose-700" : "border-cyan-200 bg-cyan-50/90 text-cyan-800"}`}>
          {message.text}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="group flex min-h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-cyan-500 to-sky-600 px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(14,165,233,0.28)] transition active:scale-[0.985] disabled:opacity-60"
      >
        {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
        {submitting ? (ru ? "Публикую..." : "Publishing...") : ru ? "Опубликовать вакансию" : "Publish job"}
        {!submitting ? <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /> : null}
      </button>
    </motion.form>
  );
}

const inputClass =
  "min-h-12 w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function InsightCard({ title, items, tone }: { title: string; items: string[]; tone: "cyan" | "amber" }) {
  return (
    <div className={`rounded-[24px] border p-4 ${tone === "cyan" ? "border-cyan-200 bg-cyan-50/80" : "border-amber-200 bg-amber-50/80"}`}>
      <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-700">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.slice(0, 4).map((item) => (
          <li key={item} className="flex gap-2 text-xs font-semibold leading-5 text-slate-600">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
