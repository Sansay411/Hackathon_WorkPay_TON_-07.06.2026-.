import type { DealStatus } from "@/lib/domain/deal-status";

export type Profile = {
  id: string;
  telegramId: string;
  telegramUsername: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  language?: WorkPayLanguage;
  role?: ProfileRole;
  walletAddress: string | null;
  bio?: string | null;
  skills?: string[];
  hourlyRate?: string | null;
  portfolioChannel?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  rating?: number;
  completedDealsCount?: number;
  successRate?: number;
  energyBalance?: number;
  tonBalance?: number;
  activeRole?: "client" | "freelancer";
  subscriptionUntil?: string | null;
  subscriptionTier?: string | null;
  connectsBalance?: number;
  createdAt: string;
  updatedAt: string;
};

export type Deal = {
  id: string;
  clientId: string;
  freelancerId: string | null;
  title: string;
  description: string;
  priceAmount: string;
  priceToken: string;
  deadline: string | null;
  status: DealStatus;
  aiScore: number | null;
  aiRisk: string | null;
  improvedTerms: string | null;
  fundingTxHash: string | null;
  releaseTxHash: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiReview = {
  clarityScore: number;
  riskLevel: "low" | "medium" | "high";
  missingItems: string[];
  disputeRisks: string[];
  suggestedTerms: string[];
};

export type WorkPayLanguage = "en" | "ru";

export type ProfileRole = "client" | "freelancer" | "both";

export type JobStatus = "draft" | "ai_reviewed" | "published" | "in_review" | "matched" | "closed" | "cancelled";

export type ApplicationStatus = "submitted" | "shortlisted" | "accepted" | "rejected" | "withdrawn";

export type EnergyTransactionType =
  | "monthly_free_grant"
  | "application_spend"
  | "ton_purchase"
  | "stars_purchase"
  | "admin_adjustment"
  | "refund";

export type MarketplaceJob = {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  budgetAmount: string;
  budgetToken: string;
  deadline: string | null;
  status: JobStatus;
  aiScore: number | null;
  aiRisk: AiReview["riskLevel"] | null;
  deliverables: string[];
  acceptanceCriteria: string[];
  aiMissingItems: string[];
  aiSuggestedTerms: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobApplication = {
  id: string;
  jobId: string;
  freelancerId: string;
  proposalText: string;
  energyCost: number;
  status: ApplicationStatus;
  aiScore: number | null;
  aiRisk: AiReview["riskLevel"] | null;
  createdAt: string;
  updatedAt: string;
};

export type EnergyTransaction = {
  id: string;
  profileId: string;
  amount: number;
  type: EnergyTransactionType;
  reason: string;
  relatedJobId: string | null;
  relatedApplicationId: string | null;
  paymentId: string | null;
  createdAt: string;
};

export type BalanceTransactionType = "ton_deposit" | "payment_spend" | "refund" | "admin_adjustment";

export type BalanceTransaction = {
  id: string;
  profileId: string;
  amount: string;
  asset: string;
  type: BalanceTransactionType;
  reason: string;
  txHash: string | null;
  createdAt: string;
};
