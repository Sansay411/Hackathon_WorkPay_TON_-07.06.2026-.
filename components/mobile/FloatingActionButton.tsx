import Link from "next/link";
import { Plus } from "lucide-react";

export function FloatingActionButton({ isActive = false }: { isActive?: boolean }) {
  return (
    <Link
      aria-label="Create deal"
      className={`absolute left-1/2 top-0 flex h-16 w-16 -translate-x-1/2 -translate-y-8 items-center justify-center rounded-full text-black shadow-[0_16px_32px_rgba(163,230,53,0.35)] ring-8 ring-[#08090a] transition hover:scale-105 active:scale-95 ${isActive ? "bg-[#84cc16]" : "bg-[#a3e635]"}`}
      href="/deals/new"
    >
      <Plus className="h-7 w-7 text-black" strokeWidth={2.8} />
    </Link>
  );
}
