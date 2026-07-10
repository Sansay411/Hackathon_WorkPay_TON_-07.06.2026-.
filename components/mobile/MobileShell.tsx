"use client";

import { MotionConfig, motion } from "motion/react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { DemoBanner } from "@/components/mobile/DemoBanner";

export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <main className="workpay-main overflow-x-hidden text-[#17272f]">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="workpay-content relative mx-auto min-h-[100dvh] w-full max-w-[430px] px-5 pb-[calc(7.25rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <DemoBanner />
          {children}
        </motion.div>
        <BottomNav />
      </main>
    </MotionConfig>
  );
}
