"use client";

import { Check, Circle, AlertCircle, XCircle } from "lucide-react";

type DealTimelineProps = {
  status: string;
};

export function DealTimeline({ status }: DealTimelineProps) {
  const steps = [
    { label: "Deal Created", isDone: true, isCurrent: false },
    { 
      label: "Waiting Payment", 
      isDone: ["waiting_payment", "funded", "in_progress", "submitted", "completed"].includes(status), 
      isCurrent: status === "draft" 
    },
    { 
      label: "Funded on TON", 
      isDone: ["funded", "in_progress", "submitted", "completed"].includes(status), 
      isCurrent: status === "waiting_payment" 
    },
    { 
      label: "Work Submitted", 
      isDone: ["submitted", "completed"].includes(status), 
      isCurrent: status === "in_progress" 
    },
    { 
      label: "Completed", 
      isDone: status === "completed", 
      isCurrent: status === "submitted" 
    }
  ];

  return (
    <section className="rounded-[30px] border border-white/70 bg-[#ffffff] p-5 shadow-[0_14px_34px_rgba(17,24,15,0.09)]">
      <h2 className="text-2xl font-black">Transaction Timeline</h2>
      
      {status === "disputed" ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#fff4f4] p-4 text-[#c0392b]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-black text-sm">Deal Disputed</p>
            <p className="text-xs font-semibold leading-5">An arbitrator is reviewing the uploaded deliverables and chat history.</p>
          </div>
        </div>
      ) : status === "cancelled" ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#f1f3f5] p-4 text-[#64748b]">
          <XCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-black text-sm">Deal Cancelled</p>
            <p className="text-xs font-semibold leading-5">This deal has been cancelled by the participants.</p>
          </div>
        </div>
      ) : null}

      <ol className="mt-5 space-y-4">
        {steps.map((item, index) => {
          const state = item.isDone ? "done" : item.isCurrent ? "current" : "pending";
          return (
            <li className="flex gap-3" key={item.label}>
              <div className="flex flex-col items-center">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  state === "pending" 
                    ? "bg-white text-[#b7c6a6] border border-[#dfe3e8]" 
                    : state === "current" 
                      ? "bg-[#e6f7ff] text-[#00658e] border border-[#229ED9]" 
                      : "bg-[#229ED9] text-white"
                }`}>
                  {state === "done" ? <Check className="h-4 w-4" /> : <Circle className="h-2 w-2" />}
                </span>
                {index < steps.length - 1 ? <span className={`h-6 w-px ${item.isDone ? "bg-[#229ED9]" : "bg-[#dfe3e8]"}`} /> : null}
              </div>
              <div className="pt-0.5">
                <p className={`font-black text-sm ${state === "pending" ? "text-[#a0aec0]" : "text-[#171c20]"}`}>{item.label}</p>
                <p className="text-xs font-semibold text-[#64748b]">
                  {state === "current" ? "Current Step" : state === "done" ? "Completed" : "Pending"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
