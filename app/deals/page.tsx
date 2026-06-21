"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useTelegram } from "@/components/telegram-provider";
import { DealListCard } from "@/components/mobile/DealListCard";
import { EmptyState } from "@/components/mobile/EmptyState";
import { MobileShell } from "@/components/mobile/MobileShell";
import { WorkPayLogo } from "@/components/mobile/WorkPayLogo";

type Deal = {
  id: string;
  title: string;
  description: string;
  price_amount: string;
  price_token: string;
  status: string;
};

export default function DealsPage() {
  const { t } = useLanguage();
  const { initData } = useTelegram();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    if (!initData) {
      setLoading(false);
      return;
    }

    void fetch(`/api/deals?initData=${encodeURIComponent(initData)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((payload) => {
        if (payload.ok && Array.isArray(payload.data?.deals)) {
          setDeals(payload.data.deals);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initData]);

  function getFriendlyStatus(status: string): string {
    switch (status) {
      case "draft":
        return "Draft";
      case "waiting_payment":
        return "Waiting Payment";
      case "funded":
        return "Funded";
      case "in_progress":
        return "In Progress";
      case "submitted":
        return "Submitted";
      case "completed":
        return "Completed";
      case "disputed":
        return "Disputed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  }

  const filteredDeals = deals.filter((deal) => {
    if (activeTab === "Funded" && deal.status !== "funded") return false;
    if (activeTab === "Waiting" && deal.status !== "waiting_payment") return false;
    if (activeTab === "Completed" && deal.status !== "completed") return false;
    if (activeTab === "Disputed" && deal.status !== "disputed") return false;

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      return (
        deal.title.toLowerCase().includes(query) ||
        deal.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <MobileShell>
      <div className="space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-[#229ED9]">WorkPay Dashboard</p>
            <h1 className="mt-1 text-[34px] font-black leading-none tracking-normal">My Escrow Deals</h1>
          </div>
          <WorkPayLogo size="md" />
        </header>

        <label className="flex h-14 items-center gap-3 rounded-[24px] border border-[#dfe3e8] bg-white px-4 shadow-[0_12px_30px_rgba(0,101,142,0.08)]">
          <Search className="h-5 w-5 text-[#64748b]" />
          <input 
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#64748b]" 
            placeholder={t.deals.search} 
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
          />
        </label>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {["All", "Waiting", "Funded", "Completed", "Disputed"].map((tab) => (
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black shadow-sm ${
                activeTab === tab ? "bg-[#00658e] text-white" : "bg-white text-[#64748b]"
              }`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab === "Waiting" ? "Waiting Payment" : tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm font-semibold text-[#64748b]">
            Loading deals...
          </div>
        ) : filteredDeals.length === 0 ? (
          <EmptyState 
            title="No escrow contracts" 
            body="Create a secure contract to start working with safety." 
            action="Create Escrow" 
            href="/deals/new" 
          />
        ) : (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Contract List</h2>
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-[#64748b]">{t.common.liveFlow}</span>
            </div>
            {filteredDeals.map((deal) => (
              <DealListCard 
                key={deal.id} 
                dealId={deal.id}
                title={deal.title}
                description={deal.description}
                amount={`${deal.price_amount} ${deal.price_token}`}
                status={getFriendlyStatus(deal.status)}
                risk="Low"
              />
            ))}
          </section>
        )}
      </div>
    </MobileShell>
  );
}
