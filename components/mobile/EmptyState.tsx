import Link from "next/link";
import type { Route } from "next";
import { Inbox } from "lucide-react";

export function EmptyState({ title, body, action, href }: { title: string; body: string; action: string; href: Route }) {
  return (
    <section className="rounded-3xl border border-[#262932] bg-[#111318] p-5 text-center shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-white">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#a3e635]/30 bg-[#a3e635]/15 text-[#a3e635]">
        <Inbox className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-black text-white">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#9ca3af]">{body}</p>
      <Link className="mt-4 inline-flex rounded-2xl bg-[#a3e635] px-5 py-3 text-sm font-black text-black hover:bg-[#84cc16]" href={href}>
        {action}
      </Link>
    </section>
  );
}
