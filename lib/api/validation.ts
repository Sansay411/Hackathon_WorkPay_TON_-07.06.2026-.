import { z } from "zod";
import { isLikelyTonAddress } from "@/lib/ton/address";

export const languageSchema = z.enum(["en", "ru"]);
export const roleSchema = z.enum(["client", "freelancer", "both"]);

export const profileUpdateSchema = z.object({
  initData: z.string().optional(),
  language: languageSchema.optional(),
  role: roleSchema.optional(),
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string().min(1).max(60)).max(20).optional(),
  hourlyRate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  walletAddress: z.string().refine(isLikelyTonAddress, { message: "Invalid TON wallet address" }).optional(),
  portfolioChannel: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional()
});

export const walletConnectSchema = z.object({
  initData: z.string().optional(),
  walletAddress: z.string().min(20),
  network: z.enum(["testnet", "mainnet"]).default("testnet")
});

export const jobCreateSchema = z.object({
  title: z.string().min(5).max(160),
  description: z.string().min(20).max(5000),
  category: z.string().min(2).max(80),
  budgetAmount: z.string().regex(/^\d+(\.\d{1,9})?$/),
  budgetToken: z.string().min(2).max(20),
  deadline: z.string().nullable().optional()
});

export const applyJobSchema = z.object({
  initData: z.string().optional(),
  proposalText: z.string().min(20).max(5000)
});

export const paymentCreateSchema = z.object({
  initData: z.string().optional(),
  dealId: z.string().min(1),
  asset: z.string().min(2).max(20),
  amount: z.string().regex(/^\d+(\.\d{1,9})?$/).optional(),
  paymentMode: z.enum(["direct_ton", "stonfi_swap"]).default("direct_ton")
});

export const paymentVerifySchema = z.object({
  initData: z.string().optional(),
  dealId: z.string().min(1),
  txHash: z.string().min(40).max(200),
  walletAddress: z.string().min(20).optional(),
  network: z.enum(["testnet", "mainnet"]).default("testnet")
});

export const stonfiQuoteSchema = z.object({
  fromAsset: z.string().min(2).max(20),
  toAsset: z.string().min(2).max(20),
  settlementAmount: z.string().regex(/^\d+(\.\d{1,9})?$/),
  network: z.enum(["testnet", "mainnet"]).default("mainnet"),
  dealId: z.string().min(1).max(120).optional()
});

export const stonfiSwapSchema = z.object({
  initData: z.string().optional(),
  dealId: z.string().min(1).max(120),
  quoteId: z.string().min(1).max(200),
  network: z.enum(["testnet", "mainnet"]).default("mainnet")
});
