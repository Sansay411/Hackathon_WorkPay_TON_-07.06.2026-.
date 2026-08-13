import Link from "next/link";
import { Bot, Coins, Gem, Sparkles, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spline3DLogo } from "@/components/mobile/Spline3DLogo";

export function WorkPayHero() {
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-[#262932] bg-[#111318] p-5 shadow-[0_24px_54px_rgba(0,0,0,0.7)] text-white">
      <div className="pointer-events-none absolute -right-16 -top-16 text-[132px] font-black leading-none text-[#a3e635]/5">wp</div>
      
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[22px] bg-[#a3e635] text-black shadow-[0_0_20px_rgba(163,230,53,0.3)]">
            <ShieldCheck className="h-6 w-6 text-black" />
          </div>
          <div>
            <p className="text-sm font-black text-white">WorkPay</p>
            <p className="text-xs font-medium text-[#9ca3af]">Protected by TON</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-[#a3e635]/40 bg-[#a3e635]/15 px-3 py-1 text-xs font-black text-[#a3e635]">Testnet</span>
      </div>

      {/* 3D Web3 Spline Logo Interactive Banner */}
      <div className="relative z-10 mt-5">
        <Spline3DLogo height="h-44" />
      </div>

      <div className="relative z-10 mt-6">
        <h1 className="max-w-[300px] text-[34px] font-black leading-[1.02] tracking-normal text-white">
          Secure Freelance Deals on TON
        </h1>
        <p className="mt-3 max-w-[300px] text-[15px] font-semibold leading-6 text-[#9ca3af]">
          Secure freelance marketplace inside Telegram, powered by TON.
        </p>
      </div>

      <div className="relative z-10 mt-6 rounded-[30px] border border-[#262932] bg-[#16181f] p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#a3e635] text-sm font-black text-black ring-4 ring-[#111318]">CL</div>
          <div className="-ml-7 flex h-12 w-12 items-center justify-center rounded-full bg-[#84cc16] text-sm font-black text-black ring-4 ring-[#111318]">FR</div>
          <div className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#1e222b] text-[#a3e635] shadow-sm">
            <Gem className="h-5 w-5 text-[#a3e635]" />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1.05fr] gap-3">
          <div className="rounded-[24px] bg-[#a3e635] p-4 text-black shadow-[0_16px_30px_rgba(163,230,53,0.2)]">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-black" />
              <span className="text-xs font-black">AI review</span>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-black/80">Low risk terms</p>
          </div>

          <div className="rounded-[24px] border border-[#262932] bg-[#111318] p-4 text-white">
            <div className="flex items-center justify-between">
              <Coins className="h-5 w-5 text-[#a3e635]" />
              <span className="rounded-full bg-[#a3e635]/15 px-2 py-1 text-[11px] font-black text-[#a3e635]">Funded</span>
            </div>
            <p className="mt-4 text-xs font-bold text-[#9ca3af]">Escrow</p>
            <p className="text-xl font-black text-white">20 USDT</p>
          </div>
        </div>

        <div className="mt-3 inline-flex rounded-full border border-[#a3e635]/30 bg-[#a3e635]/10 px-4 py-2 text-xs font-black text-[#a3e635]">
          Protected by TON
        </div>
        <Sparkles className="absolute right-6 top-20 h-5 w-5 text-[#a3e635]" />
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
        <Button asChild className="h-12 rounded-[22px] bg-[#a3e635] font-black text-black shadow-[0_12px_24px_rgba(163,230,53,0.25)] hover:bg-[#84cc16]">
          <Link href="/deals">Get Started</Link>
        </Button>
        <Button className="h-12 rounded-[22px] border border-[#262932] bg-[#1a1d24] font-black text-white hover:border-[#a3e635]/50 hover:bg-[#222630]" variant="outline">
          <WalletCards className="h-4 w-4 text-[#a3e635]" />
          Connect Wallet
        </Button>
      </div>
    </section>
  );
}
