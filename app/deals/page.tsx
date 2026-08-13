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
      <div className="space-y-5 text-white">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-[#a3e635]">WorkPay Dashboard</p>
            <h1 className="mt-1 text-[34px] font-black leading-none tracking-normal text-white">My Escrow Deals</h1>
          </div>
          <WorkPayLogo size="md" />
        </header>

        <label className="flex h-14 items-center gap-3 rounded-[24px] border border-[#262932] bg-[#111318] px-4 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
          <Search className="h-5 w-5 text-[#a3e635]" />
          <input 
            className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-[#6b7280]" 
            placeholder={t.deals.search} 
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
          />
        </label>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["All", "Waiting", "Funded", "Completed", "Disputed"].map((tab) => (
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black shadow-sm transition ${
                activeTab === tab ? "bg-[#a3e635] text-black shadow-[0_4px_16px_rgba(163,230,53,0.3)]" : "border border-[#262932] bg-[#111318] text-[#9ca3af] hover:text-white"
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
          <div className="text-center py-10 text-sm font-semibold text-[#9ca3af]">
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
              <h2 className="text-xl font-black text-white">Contract List</h2>
              <span className="rounded-full border border-[#262932] bg-[#16181f] px-3 py-1 text-xs font-black text-[#9ca3af]">{t.common.liveFlow}</span>
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
