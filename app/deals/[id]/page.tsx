"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldCheck, ReceiptText, Calendar, User, FileText, AlertTriangle } from "lucide-react";
import { DealTimeline } from "@/components/mobile/DealTimeline";
import { MobileShell } from "@/components/mobile/MobileShell";
import { PaymentStatusCard } from "@/components/mobile/PaymentStatusCard";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";

type ProfileInfo = {
  id: string;
  telegram_username: string | null;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
};

type Delivery = {
  id: string;
  message: string;
  storage_path: string | null;
  submitted_at: string;
};

type Deal = {
  id: string;
  title: string;
  description: string;
  price_amount: number;
  price_token: string;
  status: string;
  deadline: string | null;
  client_id: string;
  freelancer_id: string;
  funding_tx_hash: string | null;
  release_tx_hash: string | null;
  client: ProfileInfo;
  freelancer: ProfileInfo;
  deliveries: Delivery[] | null;
};

export default function DealDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useLanguage();
  const { initData, profile } = useTelegram();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [triggerCount, setTriggerCount] = useState(0);

  // Delivery form states
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryLink, setDeliveryLink] = useState("");

  useEffect(() => {
    if (!initData || !id) {
      setLoading(false);
      return;
    }

    let active = true;
    void fetch(`/api/deals/${id}?initData=${encodeURIComponent(initData)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load escrow contract details.");
        }
        return res.json();
      })
      .then((payload) => {
        if (active && payload.ok && payload.data?.deal) {
          setDeal(payload.data.deal);
        }
      })
      .catch((err) => {
        if (active) setErrorMsg(err instanceof Error ? err.message : "Error loading deal.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initData, id, triggerCount]);

  const handleReload = () => {
    setLoading(true);
    setErrorMsg(null);
    setTriggerCount((prev) => prev + 1);
  };

  async function handleTransition(targetStatus: string) {
    if (!initData || !id) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/deals/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, status: targetStatus })
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        setErrorMsg(payload.error?.message ?? "Status update failed.");
      } else {
        setDeal(payload.data.deal);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Connection error.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitDelivery(e: React.FormEvent) {
    e.preventDefault();
    if (!initData || !id || !deliveryMessage) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/deals/${id}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          message: deliveryMessage,
          storagePath: deliveryLink || null
        })
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        setErrorMsg(payload.error?.message ?? "Delivery submission failed.");
      } else {
        setDeliveryMessage("");
        setDeliveryLink("");
        handleReload();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Connection error.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <MobileShell>
        <div className="flex h-64 items-center justify-center text-sm font-bold text-[#9ca3af]">
          Loading escrow contract details...
        </div>
      </MobileShell>
    );
  }

  if (!deal) {
    return (
      <MobileShell>
        <div className="space-y-4 rounded-[30px] border border-[#262932] bg-[#111318] p-6 text-center text-white">
          <p className="text-[#f43f5e] font-black">{errorMsg ?? "Escrow contract not found or access denied."}</p>
          <button onClick={handleReload} className="rounded-full bg-[#a3e635] px-4 py-2 text-xs font-black text-black">
            Retry
          </button>
        </div>
      </MobileShell>
    );
  }

  const isClient = profile?.id === deal.client_id;
  const isFreelancer = profile?.id === deal.freelancer_id;

  function getFriendlyStatus(status: string) {
    switch (status) {
      case "draft":
        return "Draft (Waiting Acceptance)";
      case "waiting_payment":
        return "Waiting Escrow Payment";
      case "funded":
        return "Funded";
      case "in_progress":
        return "In Progress";
      case "submitted":
        return "Submitted";
      case "completed":
        return "Completed";
      case "disputed":
        return "Disputed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  }

  return (
    <MobileShell>
      <div className="space-y-5 text-white">
        {/* Deal Header card */}
        <header className="relative overflow-hidden rounded-[34px] border border-[#262932] bg-[#111318] p-5 text-white shadow-[0_22px_44px_rgba(0,0,0,0.8)]">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#a3e635]/10" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-[#a3e635]">Escrow Contract</p>
              <h1 className="mt-2 text-[26px] font-black leading-tight tracking-normal truncate text-white">{deal.title}</h1>
              <p className="mt-1 text-xs font-semibold text-[#9ca3af]">ID: {deal.id}</p>
            </div>
            <div className="rounded-2xl border border-[#a3e635]/30 bg-[#a3e635]/15 p-3 text-[#a3e635] shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[22px] border border-[#262932] bg-[#16181f] p-3">
              <p className="text-xs text-[#9ca3af]">Amount</p>
              <p className="mt-1 text-lg font-black truncate text-[#a3e635]">{deal.price_amount} {deal.price_token}</p>
            </div>
            <div className="rounded-[22px] border border-[#262932] bg-[#16181f] p-3">
              <p className="text-xs text-[#9ca3af]">Status</p>
              <p className="mt-1 text-lg font-black truncate text-white">{getFriendlyStatus(deal.status)}</p>
            </div>
          </div>
        </header>

        {/* Agreement Details */}
        <section className="rounded-[30px] border border-[#262932] bg-[#111318] p-5 shadow-sm text-white">
          <h2 className="text-lg font-black text-white">Scope & Terms</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#9ca3af] whitespace-pre-wrap">{deal.description}</p>
          
          <div className="mt-4 pt-4 border-t border-[#262932] grid grid-cols-2 gap-3 text-xs font-semibold text-[#9ca3af]">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#a3e635]" />
              <div>
                <p className="text-[10px] text-[#6b7280] uppercase">Client</p>
                <p className="font-bold text-white truncate">{deal.client?.first_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#a3e635]" />
              <div>
                <p className="text-[10px] text-[#6b7280] uppercase">Freelancer</p>
                <p className="font-bold text-white truncate">{deal.freelancer?.first_name}</p>
              </div>
            </div>
          </div>

          {deal.deadline ? (
            <div className="mt-3 pt-3 border-t border-[#262932] flex items-center gap-2 text-xs font-semibold text-[#9ca3af]">
              <Calendar className="h-4 w-4 text-[#a3e635]" />
              <div>
                <p className="text-[10px] text-[#6b7280] uppercase">Deadline</p>
                <p className="font-bold text-white">{new Date(deal.deadline).toLocaleDateString()}</p>
              </div>
            </div>
          ) : null}
        </section>

        {/* Dynamic Payment/Deposit panel */}
        {deal.status === "waiting_payment" && isClient ? (
          <PaymentStatusCard 
            dealId={deal.id} 
            amount={String(deal.price_amount)} 
            asset={deal.price_token} 
            onVerifiedDeposit={() => handleReload()}
          />
        ) : null}

        {/* Dynamic Action Buttons based on status & role */}
        <section className="space-y-3">
          {errorMsg ? (
            <div className="rounded-[20px] border border-rose-500/40 bg-rose-500/15 p-4 text-xs font-black text-rose-400 leading-5">
              {errorMsg}
            </div>
          ) : null}

          {/* DRAFT (Waiting acceptance) */}
          {deal.status === "draft" && isFreelancer ? (
            <button
              className="w-full rounded-[22px] bg-[#a3e635] px-4 py-3 font-black text-black shadow-sm disabled:opacity-50 hover:bg-[#84cc16]"
              onClick={() => handleTransition("waiting_payment")}
              disabled={busy}
            >
              Accept Contract & Terms
            </button>
          ) : deal.status === "draft" && isClient ? (
            <div className="rounded-2xl border border-[#262932] bg-[#16181f] p-4 text-center text-xs font-semibold text-[#9ca3af]">
              Awaiting freelancer acceptance of escrow terms.
            </div>
          ) : null}

          {/* WAITING PAYMENT (Freelancer waiting for Client to fund) */}
          {deal.status === "waiting_payment" && isFreelancer ? (
            <div className="rounded-2xl border border-[#262932] bg-[#16181f] p-4 text-center text-xs font-semibold text-[#9ca3af]">
              Awaiting client escrow payment.
            </div>
          ) : null}

          {/* FUNDED (Escrow locked, freelancer starts work) */}
          {deal.status === "funded" && isFreelancer ? (
            <button
              className="w-full rounded-[22px] bg-[#a3e635] px-4 py-3 font-black text-black shadow-sm disabled:opacity-50 hover:bg-[#84cc16]"
              onClick={() => handleTransition("in_progress")}
              disabled={busy}
            >
              Start Work (Confirm Escrow Lock)
            </button>
          ) : deal.status === "funded" && isClient ? (
            <div className="rounded-2xl border border-[#a3e635]/40 bg-[#a3e635]/15 p-4 text-center text-xs font-semibold text-[#a3e635]">
              Escrow funds locked. Awaiting freelancer to confirm work initiation.
            </div>
          ) : null}

          {/* IN PROGRESS (Freelancer working, submits deliverables) */}
          {deal.status === "in_progress" && isFreelancer ? (
            <div className="space-y-4">
              {/* Progress Update Panel */}
              <div className="rounded-[30px] border border-[#262932] bg-[#111318] p-5 shadow-sm space-y-3">
                <h3 className="font-black text-white">Log Progress</h3>
                <p className="text-xs font-semibold text-[#9ca3af] leading-relaxed">
                  Select your current status to log it on-chain/in database:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {["Разработка архитектуры", "Фронтенд готов", "Тестирование"].map((stepName) => (
                    <button
                      key={stepName}
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        setErrorMsg(null);
                        try {
                          const res = await fetch(`/api/deals/${deal.id}/progress`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ initData, progressStatus: stepName })
                          });
                          const payload = await res.json();
                          if (!res.ok || !payload.ok) {
                            setErrorMsg(payload.error?.message ?? "Failed to log progress.");
                          } else {
                            setErrorMsg("Progress logged: " + stepName);
                            setTimeout(() => setErrorMsg(null), 3000);
                          }
                        } catch {
                          setErrorMsg("Connection issue.");
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="rounded-xl border border-[#262932] bg-[#16181f] py-2 text-[10px] font-black text-[#a3e635] hover:border-[#a3e635] active:scale-95 transition-all"
                    >
                      {stepName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Deliverables Form */}
              <form onSubmit={handleSubmitDelivery} className="rounded-[30px] border border-[#262932] bg-[#111318] p-5 shadow-sm space-y-3">
                <h3 className="font-black text-white">Submit Deliverables</h3>
                <label className="block space-y-1">
                  <span className="text-xs font-black text-[#9ca3af]">Message to Client</span>
                  <textarea
                    className="min-h-20 w-full rounded-xl border border-[#262932] bg-[#16181f] px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#a3e635]"
                    placeholder="e.g. Logo designs are completed and attached."
                    onChange={(e) => setDeliveryMessage(e.target.value)}
                    value={deliveryMessage}
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-black text-[#9ca3af]">Work URL / Deliverable Link</span>
                  <input
                    className="h-10 w-full rounded-xl border border-[#262932] bg-[#16181f] px-3 text-xs font-semibold text-white outline-none focus:border-[#a3e635]"
                    placeholder="https://drive.google.com/... or Figma Link"
                    type="url"
                    onChange={(e) => setDeliveryLink(e.target.value)}
                    value={deliveryLink}
                  />
                </label>
                <button
                  className="w-full rounded-xl bg-[#a3e635] py-2.5 text-xs font-black text-black hover:bg-[#84cc16] disabled:opacity-50"
                  type="submit"
                  disabled={busy}
                >
                  Submit Deliverables to Client
                </button>
              </form>
            </div>
          ) : deal.status === "in_progress" && isClient ? (
            <div className="rounded-2xl border border-[#262932] bg-[#16181f] p-4 text-center text-xs font-semibold text-[#9ca3af]">
              Contract is in progress. Awaiting freelancer work submission.
            </div>
          ) : null}

          {/* SUBMITTED (Client reviews and releases) */}
          {deal.status === "submitted" && isClient ? (
            <div className="space-y-2">
              <button
                className="w-full rounded-[22px] bg-[#a3e635] px-4 py-3 font-black text-black shadow-sm disabled:opacity-50 hover:bg-[#84cc16]"
                onClick={() => handleTransition("completed")}
                disabled={busy}
              >
                Approve & Release Escrow
              </button>
              <button
                className="w-full rounded-[22px] border border-rose-500/50 bg-[#111318] px-4 py-3 font-black text-rose-400 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                onClick={() => handleTransition("disputed")}
                disabled={busy}
              >
                <AlertTriangle className="h-4 w-4" />
                Raise Escrow Dispute
              </button>
            </div>
          ) : deal.status === "submitted" && isFreelancer ? (
            <div className="rounded-2xl border border-[#a3e635]/40 bg-[#a3e635]/15 p-4 text-center text-xs font-semibold text-[#a3e635]">
              Work submitted. Awaiting client review and release.
            </div>
          ) : null}

          {/* GENERAL CANCEL & DISPUTE ACTIONS */}
          {(deal.status === "draft" || deal.status === "waiting_payment") && (isClient || isFreelancer) ? (
            <button
              className="w-full rounded-[22px] border border-[#262932] bg-[#16181f] hover:bg-[#222630] px-4 py-3 text-sm font-black text-[#9ca3af] transition-colors"
              onClick={() => handleTransition("cancelled")}
              disabled={busy}
            >
              Cancel Contract
            </button>
          ) : null}

          {(deal.status === "funded" || deal.status === "in_progress") && (isClient || isFreelancer) ? (
            <button
              className="w-full rounded-[22px] border border-rose-500/50 bg-[#111318] px-4 py-3 text-sm font-black text-rose-400 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={() => handleTransition("disputed")}
              disabled={busy}
            >
              <AlertTriangle className="h-4 w-4" />
              Raise Escrow Dispute
            </button>
          ) : null}
        </section>

        {/* Deliveries Display list */}
        {deal.deliveries && deal.deliveries.length > 0 ? (
          <section className="rounded-[30px] border border-[#262932] bg-[#111318] p-5 shadow-sm space-y-4 text-white">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#a3e635]" />
              Submitted Work
            </h2>
            <div className="space-y-3">
              {deal.deliveries.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#262932] bg-[#16181f] p-3 text-xs">
                  <p className="font-semibold text-white whitespace-pre-wrap">{item.message}</p>
                  {item.storage_path ? (
                    <div className="mt-2">
                      <a 
                        className="font-black text-[#a3e635] hover:underline break-all" 
                        href={item.storage_path} 
                        target="_blank" 
                        rel="noreferrer"
                      >
                        Attachment: {item.storage_path}
                      </a>
                    </div>
                  ) : null}
                  <p className="mt-2 text-[10px] text-[#6b7280] text-right">
                    {new Date(item.submitted_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Timeline of transaction step */}
        <DealTimeline status={deal.status} />

        <Link className="flex items-center justify-center gap-2 rounded-[22px] bg-[#a3e635] px-4 py-3 font-black text-black hover:bg-[#84cc16]" href={`/deals/${deal.id}/receipt`}>
          <ReceiptText className="h-4 w-4 text-black" />
          {t.dealDetail.openReceipt}
        </Link>
      </div>
    </MobileShell>
  );
}
