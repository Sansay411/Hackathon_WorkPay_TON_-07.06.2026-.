"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Link as LinkIcon, Star, Trophy, UserRound } from "lucide-react";
import { useTelegram } from "@/components/telegram-provider";
import { useLanguage } from "@/components/language-provider";
import type { Profile } from "@/lib/domain/types";

type ProfileResponse = {
  ok: true;
  data: {
    profile: Profile;
    source: string;
  };
};

export function TelegramProfilePanel() {
  const { user, isTelegram, authStatus, initData } = useTelegram();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!initData) {
      return;
    }

    const controller = new AbortController();
    void fetch("/api/profile/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Profile sync failed");
        }
        return (await response.json()) as ProfileResponse;
      })
      .then((result) => {
        setProfile(result.data.profile);
        setBio(result.data.profile.bio ?? "");
        setSkills(result.data.profile.skills?.join(", ") ?? "");
        setRate(result.data.profile.hourlyRate ?? "");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      });

    return () => controller.abort();
  }, [initData]);

  const displayName = useMemo(() => {
    const firstName = profile?.firstName ?? user?.firstName;
    const lastName = profile?.lastName ?? user?.lastName;
    if (!firstName && !lastName) {
      return t.onboarding.telegramFallback;
    }
    return [firstName, lastName].filter(Boolean).join(" ");
  }, [profile?.firstName, profile?.lastName, t.onboarding.telegramFallback, user?.firstName, user?.lastName]);

  const avatarUrl = profile?.avatarUrl ?? user?.photoUrl ?? null;
  const telegramUsername = profile?.telegramUsername ?? user?.username ?? null;

  async function handleSave() {
    if (!initData) return;
    setBusy(true);
    setStatusMsg(null);

    const skillsArray = skills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updatePayload: Record<string, unknown> = {
      initData,
      bio: bio.trim(),
      skills: skillsArray
    };

    if (rate.trim()) {
      // Validate rate format: e.g. 55 or 55.50
      if (!/^\d+(\.\d{1,2})?$/.test(rate.trim())) {
        setStatusMsg("Invalid hourly rate. Must be a number (e.g. 55 or 55.50).");
        setBusy(false);
        return;
      }
      updatePayload.hourlyRate = rate.trim();
    }

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setStatusMsg(result.error?.message ?? "Failed to save profile.");
        return;
      }
      setProfile(result.data.profile);
      setStatusMsg("Profile details saved successfully!");
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : "Error saving profile.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRole() {
    if (!profile) return;
    const nextRole = profile.activeRole === "client" ? "freelancer" : "client";
    setBusy(true);
    setStatusMsg(null);
    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, activeRole: nextRole })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setStatusMsg(result.error?.message ?? "Failed to switch role.");
        return;
      }
      setProfile(result.data.profile);
      setStatusMsg(`Switched role to ${nextRole === "client" ? "Client" : "Freelancer"}!`);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : "Error switching role.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[#dfe3e8] bg-white p-5 shadow-[0_10px_30px_rgba(0,101,142,0.07)]">
        <div className="flex items-center gap-4">
          <Avatar photoUrl={avatarUrl} name={displayName} />
          <div className="min-w-0">
            <p className="text-sm font-black text-[#229ED9]">{t.profile.identity}</p>
            <h1 className="truncate text-2xl font-black leading-tight">{displayName}</h1>
            <p className="truncate text-sm font-semibold text-[#64748b]">
              {telegramUsername ? `@${telegramUsername}` : isTelegram ? t.profile.usernameMissing : t.onboarding.openInTelegram}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label={t.profileExtra.statDeals} value={String(profile?.completedDealsCount ?? 0)} />
          <Stat label={t.profileExtra.statRating} value={profile?.completedDealsCount && profile.rating != null ? `${profile.rating.toFixed(1)}/5` : t.profileExtra.ratingNew} />
          <Stat label={t.profileExtra.statPaid} value={profile?.completedDealsCount && profile.hourlyRate != null ? `${profile.hourlyRate} TON` : t.profileExtra.paidZero} />
        </div>

        <div className="mt-4 rounded-2xl bg-[#f6faff] p-3">
          <p className="text-xs font-black text-[#64748b]">{t.profileExtra.authStatus}</p>
          <p className="mt-1 text-sm font-black text-[#171c20]">
            {authStatus === "verified" ? t.profile.authVerified : authStatus === "verifying" ? t.profile.authVerifying : t.profile.authUnavailable}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#64748b]">{t.profile.sourceNote}</p>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#f6faff] p-4 border border-[#e6f4ff]">
          <div>
            <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Active Role</p>
            <p className="text-base font-black text-[#171c20] capitalize mt-0.5">
              {profile?.activeRole ?? "Client"}
            </p>
          </div>
          <button
            onClick={toggleRole}
            disabled={busy}
            className="rounded-xl bg-[#229ED9] px-3 py-2 text-xs font-black text-white hover:bg-[#1a85b8] active:scale-95 transition-all shadow-sm"
            type="button"
          >
            Switch to {profile?.activeRole === "client" ? "Freelancer" : "Client"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-[#dfe3e8] bg-white p-5 shadow-[0_10px_30px_rgba(0,101,142,0.07)]">
        <p className="text-sm font-black text-[#229ED9]">{t.profile.complete}</p>
        <h2 className="mt-1 text-2xl font-black">{t.profile.freelanceDetails}</h2>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-2">
            <span className="text-xs font-black text-[#64748b]">{t.profile.bio}</span>
            <textarea className="min-h-24 rounded-2xl border border-[#dfe3e8] bg-[#f6faff] px-4 py-3 text-sm font-semibold outline-none focus:border-[#229ED9]" onChange={(event) => setBio(event.target.value)} placeholder={t.profile.bioPlaceholder} value={bio} />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black text-[#64748b]">{t.profile.skills}</span>
            <input className="h-12 rounded-2xl border border-[#dfe3e8] bg-[#f6faff] px-4 text-sm font-semibold outline-none focus:border-[#229ED9]" onChange={(event) => setSkills(event.target.value)} placeholder={t.profile.skillsPlaceholder} value={skills} />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black text-[#64748b]">{t.profile.hourlyRate}</span>
            <input className="h-12 rounded-2xl border border-[#dfe3e8] bg-[#f6faff] px-4 text-sm font-semibold outline-none focus:border-[#229ED9]" inputMode="decimal" onChange={(event) => setRate(event.target.value)} placeholder="55" value={rate} />
          </label>
        </div>

        {statusMsg ? (
          <div className={`mt-3 rounded-2xl p-3 text-xs font-black ${statusMsg.includes("success") ? "bg-[#eafaf1] text-[#27ae60]" : "bg-[#fff4f4] text-[#c0392b]"}`}>
            {statusMsg}
          </div>
        ) : null}

        <button 
          className="mt-4 w-full rounded-2xl bg-[#229ED9] px-4 py-3 text-sm font-black text-white disabled:opacity-50" 
          onClick={handleSave}
          disabled={busy}
          type="button"
        >
          {busy ? "Saving..." : t.profile.saveDetails}
        </button>
      </section>

      <section className="rounded-3xl bg-[#00658e] p-5 text-white shadow-[0_18px_38px_rgba(0,101,142,0.20)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-[#acedff]">{t.profileExtra.reputationLayer}</p>
            <h2 className="mt-1 text-2xl font-black">{t.profileExtra.onChainTrust}</h2>
          </div>
          <Trophy className="h-7 w-7 text-[#acedff]" />
        </div>
        <p className="mt-3 text-sm font-medium leading-6 text-white/70">{t.profileExtra.reputationBody}</p>
      </section>

      <div className="grid gap-3">
        <ProfileRow icon={<BadgeCheck className="h-5 w-5" />} title={t.profile.identity} value={authStatus === "verified" ? t.onboarding.verified : t.onboarding.openInTelegram} />
        <ProfileRow icon={<Star className="h-5 w-5" />} title={t.profileExtra.clientScore} value={t.profileExtra.noCompletedDeals} />
        <ProfileRow icon={<LinkIcon className="h-5 w-5" />} title={t.profileExtra.portfolio} value={t.profileExtra.portfolioHint} />
      </div>
    </div>
  );
}

function Avatar({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  if (photoUrl) {
    return <img alt={name} className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-white" src={photoUrl} />;
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#001e2e] text-xl font-black text-white ring-4 ring-white">
      <UserRound className="h-8 w-8 text-[#85cfff]" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f6faff] p-3 text-center">
      <p className="text-lg font-black">{value}</p>
      <p className="text-xs font-bold text-[#64748b]">{label}</p>
    </div>
  );
}

function ProfileRow({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl border border-[#dfe3e8] bg-white p-4 shadow-[0_8px_24px_rgba(0,101,142,0.06)]">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-[#e6f7ff] p-3 text-[#00658e]">{icon}</div>
        <div>
          <p className="font-black">{title}</p>
          <p className="text-xs font-semibold text-[#64748b]">{value}</p>
        </div>
      </div>
    </div>
  );
}
