import type { EnergyTransaction, JobApplication, MarketplaceJob, Profile } from "@/lib/domain/types";

export const demoDealScenario = {
  id: "WP-1024",
  title: "WorkPay Demo Deal",
  description:
    "Freelancer will implement the completed deal receipt flow for WorkPay, including TON funding proof, release proof, setup-required states, and Telegram share text.",
  amount: "20",
  token: "TON",
  deadline: "2026-06-21",
  deliverables: [
    "Receipt page for completed and waiting-payment deals",
    "Funding transaction hash section",
    "Release transaction hash section",
    "TON proof status copy",
    "Telegram share text"
  ],
  acceptanceCriteria: [
    "Receipt never claims funding from wallet approval alone",
    "Funding status depends on server-side TONCenter/TonAPI verification",
    "Missing provider keys show setup-required state",
    "Receipt is readable on Telegram mobile WebView"
  ],
  riskContextShort: "Payment proof must be server verified before completion."
};

export const demoProfile: Profile = {
  id: "demo-profile",
  telegramId: "demo-telegram",
  telegramUsername: "workpay_user",
  firstName: "Alex",
  lastName: "Morgan",
  avatarUrl: null,
  language: "en",
  role: "both",
  walletAddress: null,
  bio: "TON builder, product designer, and Mini App freelancer.",
  skills: ["Telegram Mini Apps", "Landing pages", "TON", "React"],
  hourlyRate: "55",
  rating: 4.9,
  completedDealsCount: 12,
  successRate: 98,
  energyBalance: 19,
  tonBalance: 0,
  activeRole: "freelancer",
  subscriptionUntil: null,
  subscriptionTier: "free",
  connectsBalance: 30,
  createdAt: new Date("2026-06-01T10:00:00Z").toISOString(),
  updatedAt: new Date("2026-06-05T10:00:00Z").toISOString()
};

export const demoJobs: MarketplaceJob[] = [
  {
    id: "demo-good-workpay-escrow",
    clientId: "demo-client",
    title: "Build WorkPay TON escrow receipt flow",
    description:
      "Implement a mobile receipt screen for completed WorkPay freelance deals. The page must show the client, freelancer, amount, escrow funding transaction, release transaction, TON proof state, and Telegram share text. Payment must be shown as confirmed only after server-side TONCenter or TonAPI verification.",
    category: "TON Payments",
    budgetAmount: "95",
    budgetToken: "TON",
    deadline: "2026-06-20",
    status: "published",
    aiScore: 92,
    aiRisk: "low",
    deliverables: [
      "Receipt page with deal title, client, freelancer, amount, and status",
      "TON proof section for funding and release transaction hashes",
      "Setup-required states for missing TONCenter or escrow configuration",
      "Telegram share text for completed deal"
    ],
    acceptanceCriteria: [
      "Wallet approval is never shown as payment confirmation",
      "Funded and completed states depend on server-side verification",
      "The receipt is readable inside Telegram mobile WebView",
      "Missing provider keys do not create fake success states"
    ],
    aiMissingItems: ["Exact wording for public share text"],
    aiSuggestedTerms: "Define proof fields and setup-required states before connecting final transaction verification.",
    createdAt: new Date("2026-06-07T09:00:00Z").toISOString(),
    updatedAt: new Date("2026-06-07T09:00:00Z").toISOString()
  },
  {
    id: "demo-bad-vague-bot",
    clientId: "demo-client",
    title: "Make my bot and app perfect urgently",
    description:
      "Need someone to fix everything in my Telegram bot, Mini App, TON payments, STON.fi, Mira, Supabase, design, deployment, and all bugs very fast. I will explain details later. Must be perfect and ready today.",
    category: "Unclear Scope",
    budgetAmount: "180",
    budgetToken: "TON",
    deadline: "2026-06-09",
    status: "published",
    aiScore: 31,
    aiRisk: "high",
    deliverables: [
      "Fix all integrations",
      "Make everything work"
    ],
    acceptanceCriteria: [
      "No clear acceptance criteria were provided"
    ],
    aiMissingItems: ["Scope boundaries", "Technical priority order", "Acceptance criteria", "Payment milestone plan", "Definition of done"],
    aiSuggestedTerms: "Split the request into funded milestones, define exact integrations, and require client approval before any extra scope starts.",
    createdAt: new Date("2026-06-07T10:00:00Z").toISOString(),
    updatedAt: new Date("2026-06-07T10:00:00Z").toISOString()
  }
];

export const demoApplications: JobApplication[] = [
  {
    id: "application-demo-1",
    jobId: "demo-good-workpay-escrow",
    freelancerId: demoProfile.id,
    proposalText: "I can deliver a Telegram-native landing page with TON wallet CTA, responsive sections, and clean handoff.",
    energyCost: 1,
    status: "submitted",
    aiScore: 81,
    aiRisk: "low",
    createdAt: new Date("2026-06-05T10:15:00Z").toISOString(),
    updatedAt: new Date("2026-06-05T10:15:00Z").toISOString()
  }
];

export const demoEnergyTransactions: EnergyTransaction[] = [
  {
    id: "energy-grant-june",
    profileId: demoProfile.id,
    amount: 20,
    type: "monthly_free_grant",
    reason: "June free Energy grant",
    relatedJobId: null,
    relatedApplicationId: null,
    paymentId: null,
    createdAt: new Date("2026-06-01T00:00:00Z").toISOString()
  },
  {
    id: "energy-spend-application",
    profileId: demoProfile.id,
    amount: -1,
    type: "application_spend",
    reason: "Applied to TON startup landing job",
    relatedJobId: "workpay-miniapp-onboarding",
    relatedApplicationId: "application-demo-1",
    paymentId: null,
    createdAt: new Date("2026-06-05T10:15:00Z").toISOString()
  }
];
