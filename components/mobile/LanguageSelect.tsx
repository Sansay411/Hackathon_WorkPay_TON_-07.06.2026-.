"use client";

import { useLanguage } from "@/components/language-provider";
import type { WorkPayLanguage } from "@/lib/domain/types";

const languages = [{ code: "en" }, { code: "ru" }] as const satisfies readonly { code: WorkPayLanguage }[];

export function LanguageSelect() {
  const { language: selected, setLanguage, t } = useLanguage();

  return (
    <div className="grid gap-3">
      {languages.map((language) => (
        <button
          className={`rounded-2xl border p-4 text-left font-black shadow-sm transition ${
            selected === language.code ? "border-[#a3e635] bg-[#a3e635] text-black" : "border-[#262932] bg-[#16181f] text-white hover:border-[#a3e635]/40"
          }`}
          key={language.code}
          onClick={() => setLanguage(language.code)}
          type="button"
        >
          {t.onboarding.languages[language.code]}
        </button>
      ))}
    </div>
  );
}
