import { BottomNav } from "@/components/mobile/BottomNav";
import { DemoBanner } from "@/components/mobile/DemoBanner";

export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="workpay-main overflow-x-hidden text-[#17272f]">
      <div className="workpay-content relative mx-auto min-h-[100dvh] w-full max-w-[430px] px-5 pb-[calc(7.25rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <DemoBanner />
        {children}
      </div>
      <BottomNav />
    </main>
  );
}
