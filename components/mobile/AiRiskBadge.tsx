"use client";

import { useLanguage } from "@/components/language-provider";

type Risk = "Low" | "Medium" | "High";

const riskStyles: Record<Risk, string> = {
  Low: "bg-[#a3e635]/15 text-[#a3e635] ring-[#a3e635]/40",
  Medium: "bg-[#facc15]/15 text-[#facc15] ring-[#facc15]/40",
  High: "bg-[#f43f5e]/15 text-[#f43f5e] ring-[#f43f5e]/40"
};

export function AiRiskBadge({ risk }: { risk: Risk }) {
  const { t } = useLanguage();
  const riskLabel = t.deals.risks[risk.toLowerCase() as "low" | "medium" | "high"];
  return <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${riskStyles[risk]}`}>{t.badges.aiRiskPrefix} {riskLabel}</span>;
}
