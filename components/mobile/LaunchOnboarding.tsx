"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Languages, Loader2, UserRound, WalletCards } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";
import { WorkPayLogo } from "@/components/mobile/WorkPayLogo";
import { Spline3DLogo } from "@/components/mobile/Spline3DLogo";
import type { WorkPayLanguage } from "@/lib/domain/types";

const storageKey = "workpay:onboarding:v1";

type Step = "language" | "role" | "wallet" | "profile";

const steps: { id: Step; labelKey: "languageStep" | "roleStep" | "walletStep" | "profileStep" }[] = [
  { id: "language", labelKey: "languageStep" },
  { id: "role", labelKey: "roleStep" },
  { id: "wallet", labelKey: "walletStep" },
  { id: "profile", labelKey: "profileStep" }
];

const languages = [{ code: "en" }, { code: "ru" }] as const satisfies readonly { code: WorkPayLanguage }[];

const roles = [
  { value: "client", labelKey: "client" },
  { value: "freelancer", labelKey: "freelancer" },
  { value: "both", labelKey: "both" }
] as const;

export function LaunchOnboarding({ children }: { children: React.ReactNode }) {
  const { user, authStatus, isTelegram, initData } = useTelegram();
  const { language, setLanguage, t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [role, setRole] = useState<(typeof roles)[number]["value"]>("both");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(user?.telegramId ? `${storageKey}:${user.telegramId}` : storageKey);
    if (saved === "complete") {
      setCompleted(true);
    }
    setReady(true);
  }, [user?.telegramId]);

  useEffect(() => {
    if (user?.languageCode) {
      setLanguage(user.languageCode.startsWith("ru") ? "ru" : "en");
    }
  }, [setLanguage, user?.languageCode]);

  const currentStep = steps[stepIndex]?.id ?? "profile";
  const displayName = useMemo(() => {
    if (!user) {
      return t.onboarding.telegramFallback;
    }
    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  }, [t.onboarding.telegramFallback, user]);

  if (!ready) {
    return null;
  }

  if (completed) {
    return <>{children}</>;
  }

  const finish = async () => {
    setSaving(true);
    if (initData && authStatus === "verified") {
      try {
        await fetch("/api/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData, language, role })
        });
      } catch {
        // Local completion still prevents a broken first-run loop if persistence is temporarily unavailable.
      }
    }
    window.localStorage.setItem(user?.telegramId ? `${storageKey}:${user.telegramId}` : storageKey, "complete");
    setCompleted(true);
    setSaving(false);
  };

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[#08090a] text-white">
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="pointer-events-none absolute -right-20 top-10 h-48 w-48 animate-pulse rounded-full bg-[#a3e635]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 animate-pulse rounded-full bg-[#84cc16]/10 blur-3xl" />

        <section className="relative rounded-[30px] border border-[#262932] bg-[#111318] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.7)]">
          <div className="flex items-center gap-3">
            <WorkPayLogo size="lg" />
            <div className="min-w-0">
              <p className="text-sm font-black text-[#a3e635]">{t.onboarding.setup}</p>
              <h1 className="truncate text-2xl font-black text-white">{displayName}</h1>
              <p className="text-xs font-semibold text-[#9ca3af]">
                {!isTelegram
                  ? t.onboarding.openInTelegram
                  : authStatus === "verified"
                    ? t.onboarding.verified
                    : authStatus === "verifying"
                      ? t.onboarding.verifying
                      : authStatus === "error"
                        ? t.onboarding.verifyError
                        : t.onboarding.verifyUnavailable}
              </p>
            </div>
          </div>
        </section>

        {/* 3D Web3 Spline Logo Interactive Banner */}
        <div className="mt-4">
          <Spline3DLogo height="h-36" />
        </div>

        <section className="relative mt-4 rounded-3xl border border-[#262932] bg-[#111318] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step, index) => (
              <div className="text-center" key={step.id}>
                <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${index <= stepIndex ? "bg-[#a3e635] text-black" : "border border-[#262932] bg-[#16181f] text-[#9ca3af]"}`}>
                  {index < stepIndex ? <CheckCircle2 className="h-4 w-4 text-black" /> : index + 1}
                </div>
                <p className="mt-1 truncate text-[10px] font-bold text-[#9ca3af]">{t.onboarding[step.labelKey]}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="relative mt-4 flex-1">
          {currentStep === "language" ? (
            <SetupCard icon={<Languages className="h-5 w-5 text-[#a3e635]" />} title={t.onboarding.chooseLanguage} body={t.onboarding.languageBody}>
              <div className="grid gap-3">
                {languages.map((item) => (
                  <button
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${language === item.code ? "border-[#a3e635] bg-[#a3e635] text-black" : "border-[#262932] bg-[#16181f] text-white hover:border-[#a3e635]/40"}`}
                    key={item.code}
                    onClick={() => setLanguage(item.code)}
                    type="button"
                  >
                    {t.onboarding.languages[item.code]}
                  </button>
                ))}
              </div>
            </SetupCard>
          ) : null}

          {currentStep === "role" ? (
            <SetupCard icon={<UserRound className="h-5 w-5 text-[#a3e635]" />} title={t.onboarding.chooseRole} body={t.onboarding.roleBody}>
              <div className="grid gap-3">
                {roles.map((item) => (
                  <button
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${role === item.value ? "border-[#a3e635] bg-[#a3e635] text-black" : "border-[#262932] bg-[#16181f] text-white hover:border-[#a3e635]/40"}`}
                    key={item.value}
                    onClick={() => setRole(item.value)}
                    type="button"
                  >
                    {t.onboarding.roles[item.labelKey]}
                  </button>
                ))}
              </div>
            </SetupCard>
          ) : null}

          {currentStep === "wallet" ? (
            <SetupCard icon={<WalletCards className="h-5 w-5 text-[#a3e635]" />} title={t.onboarding.connectWallet} body={t.onboarding.walletBody}>
              <p className="rounded-2xl border border-[#a3e635]/30 bg-[#a3e635]/15 px-4 py-3 text-center text-sm font-black text-[#a3e635]">{t.onboarding.openWallet}</p>
            </SetupCard>
          ) : null}

          {currentStep === "profile" ? (
            <SetupCard icon={<UserRound className="h-5 w-5 text-[#a3e635]" />} title={t.onboarding.completeProfile} body={t.onboarding.profileBody}>
              <p className="rounded-2xl border border-[#a3e635]/30 bg-[#a3e635]/15 px-4 py-3 text-center text-sm font-black text-[#a3e635]">{t.onboarding.fillProfile}</p>
            </SetupCard>
          ) : null}
        </div>

        <div className="relative grid grid-cols-2 gap-3 pt-4">
          <button
            className="rounded-2xl border border-[#262932] bg-[#111318] px-4 py-3 text-sm font-black text-[#9ca3af] disabled:opacity-40 hover:text-white"
            disabled={stepIndex === 0 || saving}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            type="button"
          >
            {t.common.back}
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#a3e635] px-4 py-3 text-sm font-black text-black disabled:opacity-70 hover:bg-[#84cc16]"
            disabled={saving}
            onClick={() => (stepIndex >= steps.length - 1 ? void finish() : setStepIndex((current) => current + 1))}
            type="button"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : null}
            {stepIndex >= steps.length - 1 ? t.common.openWorkPay : t.common.continue}
          </button>
        </div>
      </div>
    </main>
  );
}

function SetupCard({ icon, title, body, children }: { icon: React.ReactNode; title: string; body: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[#262932] bg-[#111318] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-white">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#a3e635]/30 bg-[#a3e635]/15 text-[#a3e635]">{icon}</div>
      <h2 className="mt-4 text-2xl font-black text-white">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#9ca3af]">{body}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
