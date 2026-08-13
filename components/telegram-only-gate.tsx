"use client";

import { motion } from "motion/react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";

export function TelegramOnlyGate({ children }: { children: React.ReactNode }) {
  const { runtime } = useTelegram();
  const { t } = useLanguage();

  if (runtime === "telegram") {
    return <>{children}</>;
  }

  const outsideTelegram = runtime === "outside";

  return (
    <main className="workpay-main min-h-[100dvh] overflow-hidden px-5 py-6 text-white">
      <div className="pointer-events-none absolute -left-20 top-10 h-52 w-52 rounded-full bg-[#a3e635]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-[#84cc16]/10 blur-3xl" />
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-[430px] flex-col justify-center rounded-[34px] border border-[#262932] bg-[#111318]/90 p-6 text-center shadow-[0_24px_64px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        initial={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[23px] bg-[#a3e635] text-black shadow-[0_16px_34px_rgba(163,230,53,0.25)]">
          <ShieldCheck className="h-8 w-8 text-black" strokeWidth={2} />
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#a3e635]">WorkPay Mini App</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.06em] text-white">{outsideTelegram ? t.onboarding.openInTelegram : "WorkPay"}</h1>
        <p className="mx-auto mt-3 max-w-[300px] text-sm font-semibold leading-6 text-[#9ca3af]">
          {outsideTelegram ? t.onboarding.verifyUnavailable : t.onboarding.verifying}
        </p>
        {outsideTelegram ? (
          <a className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full bg-[#a3e635] px-5 py-3 text-sm font-black text-black shadow-[0_12px_26px_rgba(163,230,53,0.25)] transition-transform hover:bg-[#84cc16] active:scale-[.98]" href="https://t.me/GetWorkPayBot" rel="noreferrer" target="_blank">
            {t.common.openWorkPay}
            <ArrowUpRight className="h-4 w-4 text-black" />
          </a>
        ) : (
          <div className="mx-auto mt-7 h-1.5 w-28 overflow-hidden rounded-full bg-[#262932]">
            <motion.div animate={{ x: [0, 88, 0] }} className="h-full w-10 rounded-full bg-[#a3e635]" transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} />
          </div>
        )}
      </motion.section>
    </main>
  );
}
