"use client";

import { useCallback, useEffect, useState } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { ArrowUpRight, CheckCircle2, Loader2, ShieldCheck, WalletCards } from "lucide-react";
import { useTelegram } from "@/components/telegram-provider";
import { sanitizeTonConnectTransaction } from "@/lib/ton/tonconnect";
import { WalletGateButton } from "@/components/wallet-access";

type TonDepositCardProps = {
  balanceTon: number;
  network: "mainnet" | "testnet";
  onBalanceChange?: (balance: number) => void;
};

type DepositState = "idle" | "sending" | "scanning" | "success" | "manual" | "error";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function TonDepositCard({ balanceTon, network, onBalanceChange }: TonDepositCardProps) {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { initData } = useTelegram();
  const [amount, setAmount] = useState("1");
  const [txHash, setTxHash] = useState("");
  const [state, setState] = useState<DepositState>("idle");
  const [message, setMessage] = useState("");

  const confirmDeposit = useCallback(async (hash: string, value: string) => {
    const response = await fetch("/api/wallet/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData, txHash: hash, amount: value, network })
    });
    const payload = (await response.json()) as { balanceTon?: number; error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Deposit verification failed");
    onBalanceChange?.(payload.balanceTon ?? balanceTon + Number(value));
    setState("success");
    setMessage("Пополнение подтверждено. Баланс обновлён.");
  }, [balanceTon, initData, network, onBalanceChange]);

  const scanForDeposit = useCallback(async (value: string) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await fetch("/api/wallet/deposit/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, amount: value, network })
      });
      const payload = (await response.json()) as { verified?: boolean; txHash?: string };
      if (response.ok && payload.verified && payload.txHash) {
        setTxHash(payload.txHash);
        await confirmDeposit(payload.txHash, value);
        return true;
      }
      await sleep(1800);
    }
    return false;
  }, [confirmDeposit, initData, network]);

  const handleDeposit = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 100000) {
      setState("error");
      setMessage("Укажите сумму TON больше нуля.");
      return;
    }
    if (!wallet) {
      setState("error");
      setMessage("Сначала подключите TON-кошелёк.");
      return;
    }

    try {
      setState("sending");
      setMessage("Подтвердите перевод в кошельке Telegram.");
      const createResponse = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, dealId: "wallet-readiness", asset: "TON", amount })
      });
      const createPayload = (await createResponse.json()) as {
        data?: { transaction?: unknown };
        error?: string;
      };
      if (!createResponse.ok || !createPayload.data?.transaction) {
        throw new Error(createPayload.error ?? "Unable to create TON transfer");
      }

      await tonConnectUI.sendTransaction(sanitizeTonConnectTransaction(createPayload.data.transaction as Parameters<typeof sanitizeTonConnectTransaction>[0]));
      setState("scanning");
      setMessage("Перевод отправлен. Ищем его в сети TON...");
      const confirmed = await scanForDeposit(amount);
      if (!confirmed) {
        setState("manual");
        setMessage("Сеть ещё индексирует перевод. Вставьте hash транзакции ниже, чтобы подтвердить его вручную.");
      }
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Пополнение отменено");
    }
  };

  const handleManualConfirm = async () => {
    if (!txHash.trim()) return;
    try {
      setState("scanning");
      setMessage("Проверяем транзакцию в TON Center...");
      await confirmDeposit(txHash.trim(), amount);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Не удалось подтвердить транзакцию");
    }
  };

  useEffect(() => {
    setState("idle");
    setMessage("");
  }, [wallet?.account]);

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/75 bg-white/80 p-5 shadow-[0_24px_70px_rgba(37,107,130,0.14)] backdrop-blur-xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#2185a4]">TON balance</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#17272f]">Пополнить баланс</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#60727b]">Внутренний баланс используется для Connects и комиссий площадки. Зачисление происходит только после проверки транзакции в сети TON.</p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#dff5fb] text-[#2185a4]"><WalletCards size={22} /></div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#77909a]">Сумма в TON</span>
          <div className="flex items-center gap-3 rounded-2xl border border-[#d8e8ed] bg-[#f8fcfd] px-4 py-3 focus-within:border-[#43bee6] focus-within:ring-4 focus-within:ring-[#43bee6]/10">
            <input className="min-w-0 flex-1 bg-transparent text-xl font-black text-[#17272f] outline-none" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(",", "."))} />
            <span className="rounded-lg bg-[#dff5fb] px-2 py-1 text-xs font-black text-[#2185a4]">TON</span>
          </div>
        </label>
        <div className="flex gap-2 sm:pb-1">{["0.5", "1", "5"].map((preset) => <button key={preset} type="button" onClick={() => setAmount(preset)} className="rounded-xl border border-[#d8e8ed] bg-white px-3 py-2 text-sm font-bold text-[#49606a] transition-colors hover:border-[#43bee6] hover:text-[#2185a4]">{preset}</button>)}</div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#eff8fa] px-4 py-3">
        <div><p className="text-xs font-bold text-[#77909a]">Доступно сейчас</p><p className="mt-1 text-lg font-black text-[#17272f]">{balanceTon.toFixed(2)} TON</p></div>
        <div className="text-right text-xs text-[#60727b]"><p className="font-bold">{network === "mainnet" ? "Mainnet" : "Testnet"}</p><p className="mt-1">Комиссия сети оплачивается отдельно</p></div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {wallet ? <button type="button" onClick={handleDeposit} disabled={state === "sending" || state === "scanning"} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#17272f] px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(23,39,47,0.18)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{state === "sending" || state === "scanning" ? <Loader2 size={17} className="animate-spin" /> : <ArrowUpRight size={17} />}{state === "sending" ? "Ожидаем подтверждение" : state === "scanning" ? "Проверяем транзакцию" : "Пополнить через TON Connect"}</button> : <div className="flex-1"><WalletGateButton className="w-full" /></div>}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#60727b]"><ShieldCheck size={16} className="text-[#27a979]" /> Без фиктивного зачисления</div>
      </div>

      {message ? <div className={`mt-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${state === "success" ? "bg-[#e6f8ef] text-[#247b58]" : state === "error" ? "bg-[#fff0ef] text-[#b54b46]" : "bg-[#eff8fa] text-[#49606a]"}`}>{state === "success" && <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}{message}</div> : null}

      {(state === "manual" || state === "error") && <div className="mt-4 rounded-2xl border border-dashed border-[#cbdfe5] bg-[#fbfdfe] p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#77909a]">Ручная проверка</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={txHash} onChange={(event) => setTxHash(event.target.value)} placeholder="Transaction hash" className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#d8e8ed] bg-white px-3 text-sm outline-none focus:border-[#43bee6]" /><button type="button" onClick={handleManualConfirm} className="min-h-11 rounded-xl bg-[#dff5fb] px-4 text-sm font-black text-[#2185a4] transition-colors hover:bg-[#c9eef7]">Проверить hash</button></div></div>}
    </section>
  );
}
