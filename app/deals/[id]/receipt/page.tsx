"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Share2, ShieldCheck } from "lucide-react";
import { MobileShell } from "@/components/mobile/MobileShell";
import { useLanguage } from "@/components/language-provider";

export default function DealReceiptPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { t } = useLanguage();
  const title = t.receipt.dealName;
  const statusText = t.receipt.statusWaitingPayment;
  const shareText = `WorkPay Deal: ${title}\nStatus: ${statusText}\nPowered by TON`;

  return (
    <MobileShell>
      <div className="space-y-5 text-white">
        <section className="rounded-[34px] border border-[#262932] bg-[#111318] p-5 shadow-[0_22px_44px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-[#a3e635]">{t.receipt.eyebrow}</p>
              <h1 className="mt-1 text-3xl font-black text-white">{title}</h1>
            </div>
            <ShieldCheck className="h-8 w-8 text-[#a3e635]" />
          </div>
          <p className="mt-3 text-sm font-medium text-[#9ca3af]">{t.receipt.dealIdLabel}: {id}</p>
        </section>

        <section className="rounded-[30px] border border-[#262932] bg-[#111318] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.6)]">
          <ReceiptRow label={t.receipt.client} value={t.receipt.clientName} />
          <ReceiptRow label={t.receipt.freelancer} value={t.receipt.freelancerName} />
          <ReceiptRow label={t.receipt.amount} value="20 TON" />
          <ReceiptRow label={t.receipt.status} value={statusText} />
          <ReceiptRow label={t.receipt.fundingTx} value={t.receipt.notConfirmed} />
          <ReceiptRow label={t.receipt.releaseTx} value={t.receipt.notReleased} />
        </section>

        <section className="rounded-[30px] border border-[#262932] bg-[#111318] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.6)]">
          <h2 className="text-xl font-black text-white">{t.receipt.tonProof}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#9ca3af]">
            {t.receipt.tonProofBody}
          </p>
        </section>

        <Link className="flex items-center justify-center gap-2 rounded-[22px] bg-[#a3e635] px-4 py-3 font-black text-black hover:bg-[#84cc16]" href={`https://t.me/share/url?text=${encodeURIComponent(shareText)}`}>
          <Share2 className="h-4 w-4 text-black" />
          {t.receipt.shareReceipt}
        </Link>
      </div>
    </MobileShell>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#262932] py-3 last:border-b-0">
      <span className="text-sm font-bold text-[#9ca3af]">{label}</span>
      <span className="text-right text-sm font-black text-white">{value}</span>
    </div>
  );
}
