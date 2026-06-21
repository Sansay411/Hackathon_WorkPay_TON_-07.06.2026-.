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
      const response = await fetch(`/api/deals/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, status: targetStatus })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setErrorMsg(payload.error?.message ?? "Action failed.");
        return;
      }
      handleReload();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "A connection issue occurred.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitDelivery(e: React.FormEvent) {
    e.preventDefault();
    if (!initData || !id) return;
    if (!deliveryMessage) {
      setErrorMsg("Please include a brief message with your submission.");
      return;
    }
    setBusy(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/deals/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          message: deliveryMessage,
          file_url: deliveryLink || null
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setErrorMsg(payload.error?.message ?? "Submission failed.");
        return;
      }
      setDeliveryMessage("");
      setDeliveryLink("");
      handleReload();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "A connection issue occurred.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <MobileShell>
        <div className="flex h-64 items-center justify-center text-sm font-semibold text-[#64748b]">
          Loading escrow contract details...
        </div>
      </MobileShell>
    );
  }

  if (errorMsg && !deal) {
    return (
      <MobileShell>
        <div className="rounded-3xl bg-[#fff4f4] p-5 text-center text-[#c0392b]">
          <p className="font-black">Error occurred</p>
          <p className="mt-2 text-sm font-semibold">{errorMsg}</p>
          <button className="mt-4 rounded-2xl bg-[#c0392b] px-4 py-2 text-sm font-black text-white" onClick={handleReload}>
            Retry
          </button>
        </div>
      </MobileShell>
    );
  }

  if (!deal) {
    return (
      <MobileShell>
        <div className="text-center py-10 text-sm font-semibold text-[#64748b]">
          Contract not found.
        </div>
      </MobileShell>
    );
  }

  const isClient = profile?.id === deal.client_id;
  const isFreelancer = profile?.id === deal.freelancer_id;

  function getFriendlyStatus(status: string): string {
    switch (status) {
      case "draft":
        return "Draft";
      case "waiting_payment":
        return "Waiting Payment";
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
      <div className="space-y-5">
        {/* Deal Header card */}
        <header className="relative overflow-hidden rounded-[34px] bg-[#00658e] p-5 text-white shadow-[0_22px_44px_rgba(0,101,142,0.24)]">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#85cfff]/25" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-[#acedff]">Escrow Contract</p>
              <h1 className="mt-2 text-[26px] font-black leading-tight tracking-normal truncate">{deal.title}</h1>
              <p className="mt-1 text-xs font-semibold text-white/70">ID: {deal.id}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 text-[#acedff] shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[22px] bg-white/10 p-3">
              <p className="text-xs text-white/60">Amount</p>
              <p className="mt-1 text-lg font-black truncate">{deal.price_amount} {deal.price_token}</p>
            </div>
            <div className="rounded-[22px] bg-white/10 p-3">
              <p className="text-xs text-white/60">Status</p>
              <p className="mt-1 text-lg font-black truncate">{getFriendlyStatus(deal.status)}</p>
            </div>
          </div>
        </header>

        {/* Agreement Details */}
        <section className="rounded-[30px] border border-[#dfe3e8] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-[#171c20]">Scope & Terms</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#64748b] whitespace-pre-wrap">{deal.description}</p>
          
          <div className="mt-4 pt-4 border-t border-[#f0f2f5] grid grid-cols-2 gap-3 text-xs font-semibold text-[#64748b]">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#229ED9]" />
              <div>
                <p className="text-[10px] text-[#94a3b8] uppercase">Client</p>
                <p className="font-bold text-[#171c20] truncate">{deal.client?.first_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#229ED9]" />
              <div>
                <p className="text-[10px] text-[#94a3b8] uppercase">Freelancer</p>
                <p className="font-bold text-[#171c20] truncate">{deal.freelancer?.first_name}</p>
              </div>
            </div>
          </div>

          {deal.deadline ? (
            <div className="mt-3 pt-3 border-t border-[#f0f2f5] flex items-center gap-2 text-xs font-semibold text-[#64748b]">
              <Calendar className="h-4 w-4 text-[#229ED9]" />
              <div>
                <p className="text-[10px] text-[#94a3b8] uppercase">Deadline</p>
                <p className="font-bold text-[#171c20]">{new Date(deal.deadline).toLocaleDateString()}</p>
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
            <div className="rounded-[20px] bg-[#fff4f4] p-4 text-xs font-black text-[#c0392b] leading-5">
              {errorMsg}
            </div>
          ) : null}

          {/* DRAFT (Waiting acceptance) */}
          {deal.status === "draft" && isFreelancer ? (
            <button
              className="w-full rounded-[22px] bg-[#229ED9] px-4 py-3 font-black text-white shadow-sm disabled:opacity-50"
              onClick={() => handleTransition("waiting_payment")}
              disabled={busy}
            >
              Accept Contract & Terms
            </button>
          ) : deal.status === "draft" && isClient ? (
            <div className="rounded-2xl bg-[#f6faff] p-4 text-center text-xs font-semibold text-[#64748b]">
              Awaiting freelancer acceptance of escrow terms.
            </div>
          ) : null}

          {/* WAITING PAYMENT (Freelancer waiting for Client to fund) */}
          {deal.status === "waiting_payment" && isFreelancer ? (
            <div className="rounded-2xl bg-[#f6faff] p-4 text-center text-xs font-semibold text-[#64748b]">
              Awaiting client escrow payment.
            </div>
          ) : null}

          {/* FUNDED (Escrow locked, freelancer starts work) */}
          {deal.status === "funded" && isFreelancer ? (
            <button
              className="w-full rounded-[22px] bg-[#229ED9] px-4 py-3 font-black text-white shadow-sm disabled:opacity-50"
              onClick={() => handleTransition("in_progress")}
              disabled={busy}
            >
              Start Work (Confirm Escrow Lock)
            </button>
          ) : deal.status === "funded" && isClient ? (
            <div className="rounded-2xl bg-[#e6f7ff] p-4 text-center text-xs font-semibold text-[#00658e]">
              Escrow funds locked. Awaiting freelancer to confirm work initiation.
            </div>
          ) : null}

          {/* IN PROGRESS (Freelancer working, submits deliverables) */}
          {deal.status === "in_progress" && isFreelancer ? (
            <div className="space-y-4">
              {/* Progress Update Panel */}
              <div className="rounded-[30px] border border-[#dfe3e8] bg-white p-5 shadow-sm space-y-3">
                <h3 className="font-black text-[#171c20]">Log Progress</h3>
                <p className="text-xs font-semibold text-[#64748b] leading-relaxed">
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
                      className="rounded-xl border border-[#dfe3e8] bg-[#f6faff] py-2 text-[10px] font-black text-[#00658e] hover:border-[#229ED9] active:scale-95 transition-all"
                    >
                      {stepName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Deliverables Form */}
              <form onSubmit={handleSubmitDelivery} className="rounded-[30px] border border-[#dfe3e8] bg-white p-5 shadow-sm space-y-3">
                <h3 className="font-black text-[#171c20]">Submit Deliverables</h3>
                <label className="block space-y-1">
                  <span className="text-xs font-black text-[#64748b]">Message to Client</span>
                  <textarea
                    className="min-h-20 w-full rounded-xl border border-[#dfe3e8] bg-[#f6faff] px-3 py-2 text-xs font-semibold outline-none focus:border-[#229ED9]"
                    placeholder="e.g. Logo designs are completed and attached."
                    onChange={(e) => setDeliveryMessage(e.target.value)}
                    value={deliveryMessage}
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-black text-[#64748b]">Work URL / Deliverable Link</span>
                  <input
                    className="h-10 w-full rounded-xl border border-[#dfe3e8] bg-[#f6faff] px-3 text-xs font-semibold outline-none focus:border-[#229ED9]"
                    placeholder="https://drive.google.com/... or Figma Link"
                    type="url"
                    onChange={(e) => setDeliveryLink(e.target.value)}
                    value={deliveryLink}
                  />
                </label>
                <button
                  className="w-full rounded-xl bg-[#229ED9] py-2.5 text-xs font-black text-white disabled:opacity-50"
                  type="submit"
                  disabled={busy}
                >
                  Submit Deliverables to Client
                </button>
              </form>
            </div>
          ) : deal.status === "in_progress" && isClient ? (
            <div className="rounded-2xl bg-[#f6faff] p-4 text-center text-xs font-semibold text-[#64748b]">
              Contract is in progress. Awaiting freelancer work submission.
            </div>
          ) : null}

          {/* SUBMITTED (Client reviews and releases) */}
          {deal.status === "submitted" && isClient ? (
            <div className="space-y-2">
              <button
                className="w-full rounded-[22px] bg-[#229ED9] px-4 py-3 font-black text-white shadow-sm disabled:opacity-50"
                onClick={() => handleTransition("completed")}
                disabled={busy}
              >
                Approve & Release Escrow
              </button>
              <button
                className="w-full rounded-[22px] border border-[#c0392b] bg-white px-4 py-3 font-black text-[#c0392b] shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                onClick={() => handleTransition("disputed")}
                disabled={busy}
              >
                <AlertTriangle className="h-4 w-4" />
                Raise Escrow Dispute
              </button>
            </div>
          ) : deal.status === "submitted" && isFreelancer ? (
            <div className="rounded-2xl bg-[#e6f7ff] p-4 text-center text-xs font-semibold text-[#00658e]">
              Work submitted. Awaiting client review and release.
            </div>
          ) : null}

          {/* GENERAL CANCEL & DISPUTE ACTIONS */}
          {(deal.status === "draft" || deal.status === "waiting_payment") && (isClient || isFreelancer) ? (
            <button
              className="w-full rounded-[22px] bg-[#f1f3f5] hover:bg-[#e2e8f0] px-4 py-3 text-sm font-black text-[#64748b] transition-colors"
              onClick={() => handleTransition("cancelled")}
              disabled={busy}
            >
              Cancel Contract
            </button>
          ) : null}

          {(deal.status === "funded" || deal.status === "in_progress") && (isClient || isFreelancer) ? (
            <button
              className="w-full rounded-[22px] border border-[#c0392b] bg-white px-4 py-3 text-sm font-black text-[#c0392b] shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
          <section className="rounded-[30px] border border-[#dfe3e8] bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-[#171c20] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#229ED9]" />
              Submitted Work
            </h2>
            <div className="space-y-3">
              {deal.deliveries.map((item) => (
                <div key={item.id} className="rounded-2xl bg-[#f6faff] p-3 text-xs border border-[#eef3f8]">
                  <p className="font-semibold text-[#171c20] whitespace-pre-wrap">{item.message}</p>
                  {item.storage_path ? (
                    <div className="mt-2">
                      <a 
                        className="font-black text-[#229ED9] hover:underline break-all" 
                        href={item.storage_path} 
                        target="_blank" 
                        rel="noreferrer"
                      >
                        Attachment: {item.storage_path}
                      </a>
                    </div>
                  ) : null}
                  <p className="mt-2 text-[10px] text-[#94a3b8] text-right">
                    {new Date(item.submitted_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Timeline of transaction step */}
        <DealTimeline status={deal.status} />

        <Link className="flex items-center justify-center gap-2 rounded-[22px] bg-[#229ED9] px-4 py-3 font-black text-white" href={`/deals/${deal.id}/receipt`}>
          <ReceiptText className="h-4 w-4" />
          {t.dealDetail.openReceipt}
        </Link>
      </div>
    </MobileShell>
  );
}
