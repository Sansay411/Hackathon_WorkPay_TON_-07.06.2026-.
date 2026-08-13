import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function DealCard() {
  return (
    <Link className="block rounded-[30px] border border-[#a3e635]/30 bg-[#111318] p-5 text-white shadow-[0_22px_44px_rgba(0,0,0,0.8)] transition hover:border-[#a3e635]/60" href="/deals/WP-1024">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-[#a3e635]">Active deal</p>
          <h3 className="mt-1 text-2xl font-black text-white">Landing Page Design</h3>
        </div>
        <ShieldCheck className="h-7 w-7 text-[#a3e635]" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[22px] border border-[#262932] bg-[#16181f] p-3">
          <p className="text-xs text-[#9ca3af]">Amount</p>
          <p className="mt-1 text-xl font-black text-[#a3e635]">20 USDT</p>
        </div>
        <div className="rounded-[22px] border border-[#262932] bg-[#16181f] p-3">
          <p className="text-xs text-[#9ca3af]">Status</p>
          <p className="mt-1 text-xl font-black text-white">Waiting</p>
        </div>
      </div>
    </Link>
  );
}
