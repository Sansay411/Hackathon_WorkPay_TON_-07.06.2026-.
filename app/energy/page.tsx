"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
  Zap
} from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";
import { EmptyState } from "@/components/mobile/EmptyState";
import { MobileShell } from "@/components/mobile/MobileShell";
import { connectPackages, type ConnectPackageId } from "@/lib/monetization/connect-packages";

type ConnectTransaction = {
  id: string;
  amount: number;
  type: string;
  reason: string;
  created_at: string;
};

type StatusMessage = {
  type: "success" | "error" | "info";
  text: string;
};

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export default function EnergyPage() {
  const { language } = useLanguage();
  const ru = language === "ru";
  const { profile, initData, openInvoice } = useTelegram();
  const [connects, setConnects] = useState(profile?.connectsBalance ?? 0);
  const [tonBalance, setTonBalance] = useState(profile?.tonBalance ?? 0);
  const [transactions, setTransactions] = useState<ConnectTransaction[]>([]);
  const [loading, setLoading] = useState(Boolean(initData));
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  const refreshEnergy = useCallback(async () => {
    if (!initData) return null;
    const response = await fetch(`/api/energy?initData=${encodeURIComponent(initData)}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error?.message || "Balance could not be loaded.");
    const data = payload.data ?? {};
    if (Number.isFinite(Number(data.connectsBalance))) setConnects(Number(data.connectsBalance));
    if (Number.isFinite(Number(data.tonBalance))) setTonBalance(Number(data.tonBalance));
    if (Array.isArray(data.transactions)) setTransactions(data.transactions);
    return Number(data.connectsBalance);
  }, [initData]);

  useEffect(() => {
    if (!initData) {
      return;
    }
    let cancelled = false;
    void refreshEnergy()
      .catch((error) => {
        if (!cancelled) setStatus({ type: "error", text: error instanceof Error ? error.message : "Balance could not be loaded." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initData, refreshEnergy]);

  async function purchaseWithTon(packageId: ConnectPackageId) {
    if (!initData) {
      setStatus({ type: "error", text: ru ? "Откройте WorkPay внутри Telegram." : "Open WorkPay inside Telegram." });
      return;
    }
    const selected = connectPackages.find((item) => item.id === packageId);
    if (!selected) return;

    setPurchasing(`ton:${packageId}`);
    setStatus(null);
    try {
      const response = await fetch("/api/energy/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, packageId })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message || "TON purchase failed.");
      setConnects(Number(payload.data.connectsBalance));
      setTonBalance(Number(payload.data.tonBalance));
      await refreshEnergy();
      setStatus({
        type: "success",
        text: ru ? `Начислено ${selected.connects} Connects.` : `${selected.connects} Connects credited.`
      });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "TON purchase failed." });
    } finally {
      setPurchasing(null);
    }
  }

  async function purchaseWithStars(packageId: ConnectPackageId) {
    if (!initData || !openInvoice) {
      setStatus({
        type: "error",
        text: ru ? "Оплата Stars доступна только внутри Telegram." : "Stars checkout is available only inside Telegram."
      });
      return;
    }
    const selected = connectPackages.find((item) => item.id === packageId);
    if (!selected) return;
    const balanceBefore = connects;

    setPurchasing(`stars:${packageId}`);
    setStatus(null);
    try {
      const response = await fetch("/api/energy/stars/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, packageId })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error?.message || "Stars invoice could not be created.");
      const invoiceUrl = payload.data.invoiceUrl ?? payload.data.invoiceLink;
      if (!invoiceUrl) throw new Error("Telegram invoice link is missing.");

      const invoiceStatus = await openInvoice(invoiceUrl);
      if (invoiceStatus === "cancelled") {
        setStatus({ type: "info", text: ru ? "Оплата отменена." : "Payment cancelled." });
        return;
      }
      if (invoiceStatus === "failed") {
        throw new Error(ru ? "Telegram не подтвердил оплату." : "Telegram did not confirm the payment.");
      }

      for (let attempt = 0; attempt < 8; attempt += 1) {
        await delay(850);
        const updatedBalance = await refreshEnergy();
        if (typeof updatedBalance === "number" && updatedBalance >= balanceBefore + selected.connects) {
          setStatus({
            type: "success",
            text: ru ? `Оплата подтверждена: +${selected.connects} Connects.` : `Payment confirmed: +${selected.connects} Connects.`
          });
          return;
        }
      }

      setStatus({
        type: "info",
        text: ru ? "Telegram принял платёж. Начисление подтверждается ботом и появится автоматически." : "Telegram accepted the payment. The bot is confirming the credit automatically."
      });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Stars purchase failed." });
    } finally {
      setPurchasing(null);
    }
  }

  return (
    <MobileShell>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-4 text-white"
      >
        <section className="overflow-hidden rounded-[32px] border border-[#262932] bg-[#111318] shadow-[0_24px_70px_rgba(0,0,0,0.8)]">
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(163,230,53,0.15),transparent_40%)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#a3e635]/40 bg-[#a3e635]/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#a3e635]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {ru ? "Оплата в Telegram" : "Telegram checkout"}
                </span>
                <h1 className="mt-3 text-[32px] font-black leading-none tracking-[-0.05em] text-white">Connects</h1>
                <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-[#9ca3af]">
                  {ru ? "Один отклик стоит один Connect. Выберите TON или Telegram Stars." : "One proposal costs one Connect. Pay with TON or Telegram Stars."}
                </p>
              </div>
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-[#a3e635] text-black shadow-lg">
                <Zap className="h-6 w-6 fill-current text-black" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <BalanceCard icon={<Sparkles className="h-4 w-4" />} label="Connects" value={String(connects)} accent="cyan" />
              <BalanceCard icon={<WalletCards className="h-4 w-4" />} label={ru ? "Баланс" : "Balance"} value={`${tonBalance.toFixed(2)} TON`} accent="slate" />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between rounded-[22px] border border-[#262932] bg-[#111318] px-4 py-3 text-xs font-semibold text-[#9ca3af]">
          <span>{ru ? "Нужно пополнить TON?" : "Need to add TON?"}</span>
          <Link href="/wallet" className="inline-flex items-center gap-1 font-black text-[#a3e635]">
            {ru ? "Открыть кошелёк" : "Open wallet"}
            <ArrowUpRight className="h-3.5 w-3.5 text-[#a3e635]" />
          </Link>
        </div>

        {status ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl border px-4 py-3 text-sm font-bold ${status.type === "success" ? "border-[#a3e635]/40 bg-[#a3e635]/15 text-[#a3e635]" : status.type === "error" ? "border-rose-500/40 bg-rose-500/15 text-rose-400" : "border-[#a3e635]/40 bg-[#a3e635]/10 text-[#a3e635]"}`}
          >
            <span className="flex items-start gap-2">
              {status.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />}
              {status.text}
            </span>
          </motion.div>
        ) : null}

        <section className="space-y-3">
          {connectPackages.map((item, index) => {
            const tonBusy = purchasing === `ton:${item.id}`;
            const starsBusy = purchasing === `stars:${item.id}`;
            const hasTon = tonBalance >= item.priceTon;
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * index, duration: 0.35 }}
                className={`relative overflow-hidden rounded-[28px] border p-4 shadow-[0_16px_42px_rgba(0,0,0,0.6)] ${index === 1 ? "border-[#a3e635]/50 bg-[#16181f]" : "border-[#262932] bg-[#111318]"}`}
              >
                {index === 1 ? (
                  <span className="absolute right-3 top-3 rounded-full bg-[#a3e635] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-black">
                    {ru ? "Выгодно" : "Popular"}
                  </span>
                ) : null}
                <div className="flex items-center gap-3 pr-16">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#a3e635] text-black">
                    <Zap className="h-5 w-5 fill-current text-black" />
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-[-0.03em] text-white">{item.connects} Connects</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#9ca3af]">{item.label}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => purchaseWithTon(item.id)}
                    disabled={Boolean(purchasing) || !hasTon}
                    className="min-h-12 rounded-2xl bg-[#a3e635] px-3 text-xs font-black text-black transition hover:bg-[#84cc16] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {tonBusy ? <LoaderCircle className="mx-auto h-4 w-4 animate-spin text-black" /> : `${item.priceTon} TON`}
                  </button>
                  <button
                    type="button"
                    onClick={() => purchaseWithStars(item.id)}
                    disabled={Boolean(purchasing) || !openInvoice}
                    className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-3 text-xs font-black text-amber-950 shadow-lg shadow-amber-300/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {starsBusy ? <LoaderCircle className="h-4 w-4 animate-spin text-amber-950" /> : <Star className="h-4 w-4 fill-current text-amber-950" />}
                    {!starsBusy ? `${item.priceStars} Stars` : null}
                  </button>
                </div>
                {!hasTon ? <p className="mt-2 text-center text-[10px] font-bold text-[#6b7280]">{ru ? "Недостаточно TON, Stars доступны сразу" : "Not enough TON; Stars remain available"}</p> : null}
              </motion.article>
            );
          })}
        </section>

        <section className="pt-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-[-0.03em] text-white">{ru ? "История" : "History"}</h2>
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#9ca3af]">{transactions.length} records</span>
          </div>
          {loading ? (
            <div className="grid min-h-28 place-items-center rounded-[24px] border border-[#262932] bg-[#111318]">
              <LoaderCircle className="h-5 w-5 animate-spin text-[#a3e635]" />
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title={ru ? "Операций пока нет" : "No activity yet"}
              body={ru ? "Покупки и расходы Connects появятся здесь." : "Connect purchases and spending will appear here."}
              action={ru ? "Найти работу" : "Browse jobs"}
              href="/marketplace"
            />
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div className="flex items-center gap-3 rounded-[22px] border border-[#262932] bg-[#16181f] p-3.5" key={transaction.id}>
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${transaction.amount > 0 ? "bg-[#a3e635]/20 text-[#a3e635]" : "bg-rose-500/20 text-rose-400"}`}>
                    {transaction.amount > 0 ? <Sparkles className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-white">{transaction.reason}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
                      {new Date(transaction.created_at).toLocaleDateString(language === "ru" ? "ru-RU" : "en-US")}
                    </p>
                  </div>
                  <span className={`text-sm font-black ${transaction.amount > 0 ? "text-[#a3e635]" : "text-rose-400"}`}>
                    {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </motion.div>
    </MobileShell>
  );
}

function BalanceCard({
  icon,
  label,
  value,
  accent
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "cyan" | "slate";
}) {
  return (
    <div className="rounded-[20px] border border-[#262932] bg-[#16181f] p-3">
      <div className={`flex items-center gap-1.5 text-xs font-black ${accent === "cyan" ? "text-[#a3e635]" : "text-[#9ca3af]"}`}>
        {icon}
        {label}
      </div>
      <p className="mt-2 text-lg font-black tracking-[-0.03em] text-white">{value}</p>
    </div>
  );
}
