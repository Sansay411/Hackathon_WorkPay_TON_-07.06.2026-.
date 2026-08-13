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
    <section className="rounded-[30px] border border-[#262932] bg-[#111318] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.6)] text-white">
      <h2 className="text-2xl font-black text-white">Transaction Timeline</h2>
      
      {status === "disputed" ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#f43f5e]/30 bg-[#f43f5e]/15 p-4 text-[#f43f5e]">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-black text-sm">Deal Disputed</p>
            <p className="text-xs font-semibold leading-5 text-[#f43f5e]/90">An arbitrator is reviewing the uploaded deliverables and chat history.</p>
          </div>
        </div>
      ) : status === "cancelled" ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#262932] bg-[#16181f] p-4 text-[#9ca3af]">
          <XCircle className="h-5 w-5 shrink-0 text-[#9ca3af]" />
          <div>
            <p className="font-black text-sm text-white">Deal Cancelled</p>
            <p className="text-xs font-semibold leading-5 text-[#9ca3af]">This deal has been cancelled by the participants.</p>
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
                    ? "bg-[#16181f] text-[#6b7280] border border-[#262932]" 
                    : state === "current" 
                      ? "bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]" 
                      : "bg-[#a3e635] text-black"
                }`}>
                  {state === "done" ? <Check className="h-4 w-4 text-black" /> : <Circle className="h-2 w-2" />}
                </span>
                {index < steps.length - 1 ? <span className={`h-6 w-px ${item.isDone ? "bg-[#a3e635]" : "bg-[#262932]"}`} /> : null}
              </div>
              <div className="pt-0.5">
                <p className={`font-black text-sm ${state === "pending" ? "text-[#6b7280]" : "text-white"}`}>{item.label}</p>
                <p className="text-xs font-semibold text-[#9ca3af]">
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
