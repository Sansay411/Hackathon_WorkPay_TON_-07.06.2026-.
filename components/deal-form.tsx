"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DealForm({ intentType, intentId }: { intentType?: string; intentId?: string } = {}) {
  const router = useRouter();
  const { t } = useLanguage();
  const { initData } = useTelegram();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [token, setToken] = useState("TON");
  const [deadline, setDeadline] = useState("");
  const [freelancerUsername, setFreelancerUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title || !description || !price || !freelancerUsername) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }
    setErrorMsg(null);
    setBusy(true);

    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          title,
          description,
          price_amount: price,
          price_token: token,
          freelancer_username: freelancerUsername,
          deadline: deadline || null
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setErrorMsg(payload.error?.message ?? "Failed to create deal.");
        return;
      }

      // Success, route to new deal details page
      router.push(`/deals/${payload.data.deal.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "A connection error occurred.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-[34px] border border-[#262932] bg-[#111318] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.8)] text-white">
        <label className="block space-y-2">
          <span className="text-sm font-black text-white">{t.dealForm.dealTitle} *</span>
          <input 
            className="h-12 w-full rounded-[20px] border border-[#262932] bg-[#16181f] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-[#6b7280] focus:border-[#a3e635]" 
            onChange={(event) => setTitle(event.target.value)} 
            placeholder={t.dealForm.dealTitlePlaceholder} 
            value={title} 
            required 
          />
        </label>
        
        <label className="block space-y-2">
          <span className="text-sm font-black text-white">{t.dealForm.description} * (Min 20 chars)</span>
          <textarea 
            className="min-h-32 w-full rounded-[20px] border border-[#262932] bg-[#16181f] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-[#6b7280] focus:border-[#a3e635]" 
            onChange={(event) => setDescription(event.target.value)} 
            placeholder={t.dealForm.descriptionPlaceholder} 
            value={description} 
            required 
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-2">
            <span className="text-sm font-black text-white">{t.dealForm.price} *</span>
            <input 
              className="h-12 w-full rounded-[20px] border border-[#262932] bg-[#16181f] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-[#6b7280] focus:border-[#a3e635]" 
              inputMode="decimal" 
              onChange={(event) => setPrice(event.target.value)} 
              placeholder="250" 
              value={price} 
              required 
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-black text-white">{t.dealForm.token}</span>
            <select 
              className="h-12 w-full rounded-[20px] border border-[#262932] bg-[#16181f] px-4 py-3 text-sm font-semibold text-white outline-none shadow-sm focus:border-[#a3e635]" 
              onChange={(event) => setToken(event.target.value)} 
              value={token}
            >
              <option className="bg-[#111318] text-white">TON</option>
              <option className="bg-[#111318] text-white">USDT</option>
            </select>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-black text-white">{t.dealForm.deadline}</span>
          <div className="flex items-center rounded-[20px] border border-[#262932] bg-[#16181f] px-4 shadow-sm focus-within:border-[#a3e635]">
            <CalendarDays className="h-4 w-4 text-[#a3e635]" />
            <input 
              className="h-12 w-full bg-transparent px-3 py-3 text-sm font-semibold text-white outline-none" 
              onChange={(event) => setDeadline(event.target.value)} 
              type="date" 
              value={deadline} 
            />
          </div>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-black text-white">{t.dealForm.freelancerField} *</span>
          <input 
            className="h-12 w-full rounded-[20px] border border-[#262932] bg-[#16181f] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-[#6b7280] focus:border-[#a3e635]" 
            onChange={(event) => setFreelancerUsername(event.target.value)}
            placeholder={t.dealForm.freelancerPlaceholder} 
            value={freelancerUsername}
            required
          />
        </label>

        {errorMsg ? (
          <div className="rounded-[20px] border border-rose-500/40 bg-rose-500/15 p-4 text-xs font-black text-rose-400 leading-5">
            {errorMsg}
          </div>
        ) : null}

        <Button 
          className="h-12 w-full rounded-[22px] bg-[#a3e635] py-3 font-black text-black shadow-[0_14px_24px_rgba(163,230,53,0.20)] hover:bg-[#84cc16] disabled:opacity-50" 
          type="submit"
          disabled={busy}
        >
          <ShieldCheck className="h-4 w-4 text-black" />
          {busy ? "Creating Contract..." : "Create Escrow Contract"}
        </Button>
      </form>
    </div>
  );
}
