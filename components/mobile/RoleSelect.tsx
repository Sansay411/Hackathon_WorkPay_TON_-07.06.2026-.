"use client";

import { useState } from "react";
import { BriefcaseBusiness, Handshake, UserRound } from "lucide-react";

const roles = [
  { label: "I am a Client", icon: BriefcaseBusiness },
  { label: "I am a Freelancer", icon: UserRound },
  { label: "Both", icon: Handshake }
];

export function RoleSelect() {
  const [selected, setSelected] = useState(roles[0].label);

  return (
    <div className="grid gap-3">
      {roles.map((role) => {
        const Icon = role.icon;
        return (
          <button
            className={`flex items-center gap-3 rounded-[24px] border p-4 text-left font-black shadow-sm transition ${
              selected === role.label ? "border-[#a3e635] bg-[#a3e635] text-black" : "border-[#262932] bg-[#16181f] text-white hover:border-[#a3e635]/40"
            }`}
            key={role.label}
            onClick={() => setSelected(role.label)}
            type="button"
          >
            <span className={`rounded-2xl p-3 ${selected === role.label ? "bg-black text-[#a3e635]" : "bg-[#111318] text-[#a3e635]"}`}>
              <Icon className="h-5 w-5" />
            </span>
            {role.label}
          </button>
        );
      })}
    </div>
  );
}
