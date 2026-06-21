export const dealStatuses = [
  "draft",
  "ai_reviewed",
  "waiting_payment",
  "swap_pending",
  "funded",
  "in_progress",
  "submitted",
  "approved",
  "release_pending",
  "completed",
  "disputed",
  "cancelled"
] as const;

export type DealStatus = (typeof dealStatuses)[number];

const transitions: Record<DealStatus, readonly DealStatus[]> = {
  draft: ["waiting_payment", "cancelled", "ai_reviewed"],
  ai_reviewed: ["waiting_payment", "draft", "cancelled"],
  waiting_payment: ["funded", "cancelled", "swap_pending"],
  swap_pending: ["funded", "waiting_payment", "cancelled"],
  funded: ["in_progress", "disputed", "cancelled"],
  in_progress: ["submitted", "disputed", "cancelled"],
  submitted: ["completed", "approved", "in_progress", "disputed", "cancelled"],
  approved: ["completed", "release_pending", "disputed"],
  release_pending: ["completed", "disputed"],
  completed: [],
  disputed: ["cancelled", "completed"],
  cancelled: []
};

export function canTransitionDeal(from: DealStatus, to: DealStatus) {
  return transitions[from].includes(to);
}

export function assertDealTransition(from: DealStatus, to: DealStatus) {
  if (!canTransitionDeal(from, to)) {
    throw new Error(`Invalid deal status transition from ${from} to ${to}`);
  }
}
