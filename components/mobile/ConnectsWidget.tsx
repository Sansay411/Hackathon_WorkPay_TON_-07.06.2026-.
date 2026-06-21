"use client";

import { useLanguage } from "@/components/language-provider";

export function ConnectsWidget({ connects, subscriptionUntil }: { connects: number; subscriptionUntil: string | null }) {
  const { t } = useLanguage();
  const maxConnects = 30;
  const percentage = Math.max(0, Math.min(100, (connects / maxConnects) * 100));

  let daysLeft = 30;
  if (subscriptionUntil) {
    const diffTime = new Date(subscriptionUntil).getTime() - new Date().getTime();
    daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Choose appropriate Russian translation format if language is 'ru', otherwise English
  const isRu = typeof window !== "undefined" && window.localStorage.getItem("workpay:language") === "ru";
  const connectsLabel = isRu
    ? `Коннекты: Осталось ${connects} из ${maxConnects}`
    : `Connects: ${connects} of ${maxConnects} remaining`;
  
  const updateLabel = isRu
    ? `Обновление через ${daysLeft} ${daysLeft === 1 ? "день" : daysLeft > 1 && daysLeft < 5 ? "дня" : "дней"}`
    : `Renewal in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;

  return (
    <div className="rounded-[28px] border border-[#dfe3e8] bg-white p-5 shadow-[0_12px_32px_rgba(0,101,142,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
            {isRu ? "Мощность откликов" : "Apply Energy"}
          </p>
          <h3 className="mt-1 text-lg font-black text-[#171c20]">
            {connectsLabel}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-[#229ED9]">
            {updateLabel}
          </p>
        </div>
      </div>
      <div className="mt-4 h-2.5 w-full rounded-full bg-[#f1f5f9] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#229ED9] to-[#00658e] transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
