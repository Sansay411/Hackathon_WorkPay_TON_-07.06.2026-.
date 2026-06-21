"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";
import { ConnectsWidget } from "@/components/mobile/ConnectsWidget";
import { EmptyState } from "@/components/mobile/EmptyState";
import { MobileShell } from "@/components/mobile/MobileShell";

type ConnectsPackage = {
  id: "pkg_10" | "pkg_30" | "pkg_100";
  connects: number;
  priceTon: number;
  label: string;
};

type ConnectTransaction = {
  id: string;
  amount: number;
  type: string;
  reason: string;
  created_at: string;
};

export default function EnergyPage() {
  const { t } = useLanguage();
  const { profile, initData } = useTelegram();
  const [connects, setConnects] = useState(30);
  const [tonBalance, setTonBalance] = useState(0);
  const [transactions, setTransactions] = useState<ConnectTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const packages: ConnectsPackage[] = [
    { id: "pkg_10", connects: 10, priceTon: 1.0, label: "10 Connects" },
    { id: "pkg_30", connects: 30, priceTon: 2.5, label: "30 Connects" },
    { id: "pkg_100", connects: 100, priceTon: 7.0, label: "100 Connects" }
  ];

  useEffect(() => {
    if (profile) {
      setConnects(profile.connectsBalance ?? 30);
      setTonBalance(profile.tonBalance ?? 0);
    }
  }, [profile]);

  useEffect(() => {
    if (!initData) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void fetch(`/api/energy?initData=${encodeURIComponent(initData)}`)
      .then((res) => res.json())
      .then((payload: { ok?: boolean; data?: { transactions?: ConnectTransaction[] } }) => {
        if (!cancelled && payload.ok && Array.isArray(payload.data?.transactions)) {
          setTransactions(payload.data.transactions);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initData]);

  async function handlePurchase(pkg: ConnectsPackage) {
    if (!initData) {
      setStatusMsg("Open inside Telegram to purchase connects.");
      return;
    }

    setPurchasing(pkg.id);
    setStatusMsg(null);

    try {
      const response = await fetch("/api/energy/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, packageId: pkg.id })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatusMsg(payload.error?.message ?? "Connects purchase failed.");
        return;
      }

      setConnects(payload.data.connectsBalance);
      setTonBalance(payload.data.tonBalance);
      setStatusMsg(`Successfully purchased ${pkg.label}!`);
      
      // Reload page after a delay to refresh the global state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch {
      setStatusMsg("Failed to connect to server.");
    } finally {
      setPurchasing(null);
    }
  }

  return (
    <MobileShell>
      <div className="space-y-5">
        <header>
          <p className="text-sm font-black text-[#229ED9]">Monetization & Limits</p>
          <h1 className="mt-1 text-[34px] font-black leading-none tracking-normal">Buy Connects</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-[#64748b]">
            Freelancers use connects to apply to jobs. Buy more connects instantly using your custodial TON balance.
          </p>
        </header>

        <ConnectsWidget
          connects={connects}
          subscriptionUntil={profile?.subscriptionUntil ?? null}
        />

        <div className="rounded-2xl bg-[#f6faff] p-4 flex items-center justify-between border border-[#e6f4ff]">
          <div>
            <p className="text-xs font-bold text-[#64748b]">Custodial Balance</p>
            <p className="text-lg font-black text-[#171c20] mt-0.5">
              {tonBalance.toFixed(2)} TON
            </p>
          </div>
          <p className="text-xs text-[#64748b] leading-tight max-w-[200px] text-right">
            To increase your balance, go to the Wallet tab and tap the &quot;+&quot; deposit button.
          </p>
        </div>

        {statusMsg ? (
          <div
            className={`rounded-2xl p-4 text-xs font-black ${
              statusMsg.includes("Successfully")
                ? "bg-[#eafaf1] text-[#27ae60]"
                : "bg-[#fff4f4] text-[#c0392b]"
            }`}
          >
            {statusMsg}
          </div>
        ) : null}

        <section className="grid grid-cols-3 gap-2">
          {packages.map((item) => (
            <button
              onClick={() => handlePurchase(item)}
              disabled={purchasing !== null || tonBalance < item.priceTon}
              className={`rounded-[24px] bg-[#ffffff] p-4 border border-[#dfe3e8] text-center shadow-sm flex flex-col items-center justify-between hover:border-[#229ED9] active:scale-95 transition-all ${
                tonBalance < item.priceTon ? "opacity-60 cursor-not-allowed" : ""
              }`}
              key={item.id}
              type="button"
            >
              <Zap className="h-6 w-6 text-[#229ED9] animate-pulse" />
              <p className="mt-2 text-sm font-black text-[#171c20]">{item.label}</p>
              <p className="mt-1 text-xs font-bold text-[#00658e]">{item.priceTon} TON</p>
              <span className="mt-3 w-full rounded-xl bg-[#e6f7ff] py-1 text-[10px] font-black text-[#00658e]">
                {purchasing === item.id ? "Buying..." : "Purchase"}
              </span>
            </button>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-black">History</h2>
          {loading ? (
            <div className="py-6 text-center text-sm font-semibold text-[#64748b]">Loading transaction log...</div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title={t.energyPage.emptyTitle}
              body={t.energyPage.emptyBody}
              action={t.energyPage.browseJobs}
              href="/marketplace"
            />
          ) : (
            transactions.map((transaction) => (
              <div className="rounded-[24px] bg-[#ffffff] border border-[#dfe3e8] p-4 shadow-sm" key={transaction.id}>
                <div className="flex items-center justify-between">
                  <p className="font-black text-sm text-[#171c20]">{transaction.reason}</p>
                  <span
                    className={`font-black text-sm ${
                      transaction.amount > 0 ? "text-[#27ae60]" : "text-[#c0392b]"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] font-semibold text-[#64748b] uppercase">{transaction.type}</p>
                  <p className="text-[10px] text-[#64748b]">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </MobileShell>
  );
}
