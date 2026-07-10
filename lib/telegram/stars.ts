import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getConnectPackage, type ConnectPackageId } from "@/lib/monetization/connect-packages";

const payloadVersion = "wp1";
const payloadTtlMs = 30 * 60 * 1000;

type StarsPayload = {
  profileId: string;
  telegramId: string;
  packageId: ConnectPackageId;
  issuedAt: number;
};

function paymentSecret() {
  const secret = process.env.BOT_WEBHOOK_SECRET || process.env.TELEGRAM_BOT_TOKEN;
  if (!secret) throw new Error("Telegram Stars payment secret is not configured");
  return secret;
}

function signature(value: string) {
  return createHmac("sha256", paymentSecret()).update(value).digest("base64url").slice(0, 22);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createStarsInvoicePayload(profileId: string, telegramId: string, packageId: ConnectPackageId) {
  const issuedAt = Date.now().toString(36);
  const nonce = randomBytes(6).toString("base64url");
  const base = [payloadVersion, profileId, telegramId, packageId, issuedAt, nonce].join(".");
  return `${base}.${signature(base)}`;
}

export function parseStarsInvoicePayload(value: string): StarsPayload | null {
  const parts = value.split(".");
  if (parts.length !== 7 || parts[0] !== payloadVersion) return null;
  const [version, profileId, telegramId, packageId, issuedAtRaw, nonce, suppliedSignature] = parts;
  const base = [version, profileId, telegramId, packageId, issuedAtRaw, nonce].join(".");
  if (!safeEqual(suppliedSignature, signature(base))) return null;

  const issuedAt = Number.parseInt(issuedAtRaw, 36);
  const pack = getConnectPackage(packageId);
  if (!pack || !Number.isFinite(issuedAt) || Date.now() - issuedAt > payloadTtlMs || issuedAt > Date.now() + 60_000) return null;
  return { profileId, telegramId, packageId: pack.id, issuedAt };
}

export function validateStarsCheckout(input: { telegramId: string; currency: string; totalAmount: number; invoicePayload: string }) {
  const claims = parseStarsInvoicePayload(input.invoicePayload);
  if (!claims) return { ok: false as const, reason: "This WorkPay invoice has expired. Create a new one in the Mini App." };
  const pack = getConnectPackage(claims.packageId);
  if (!pack || claims.telegramId !== input.telegramId || input.currency !== "XTR" || input.totalAmount !== pack.priceStars) {
    return { ok: false as const, reason: "The invoice does not match your WorkPay account." };
  }
  return { ok: true as const, claims, pack };
}

export async function applySuccessfulStarsPayment(input: {
  telegramId: string;
  currency: string;
  totalAmount: number;
  invoicePayload: string;
  telegramPaymentChargeId: string;
}) {
  const validation = validateStarsCheckout(input);
  if (!validation.ok) throw new Error(validation.reason);
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) throw new Error("Supabase service role is required for Stars payments");

  const marker = `stars:${input.telegramPaymentChargeId}`;
  const { data: existingMarker } = await supabase.from("deposit_transactions").select("id").eq("tx_hash", marker).maybeSingle();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, telegram_id, connects_balance")
    .eq("id", validation.claims.profileId)
    .single();
  if (!profile || String(profile.telegram_id) !== input.telegramId) throw new Error("Stars payment profile mismatch");
  if (existingMarker) return { connectsBalance: Number(profile.connects_balance ?? 0), duplicate: true };

  const { error: markerError } = await supabase.from("deposit_transactions").insert({
    profile_id: validation.claims.profileId,
    amount: validation.pack.priceStars,
    tx_hash: marker,
    network: "telegram-stars"
  });
  if (markerError) {
    if (markerError.code === "23505") return { connectsBalance: Number(profile.connects_balance ?? 0), duplicate: true };
    throw new Error("Unable to record the Telegram Stars charge");
  }

  let connectsBalance: number | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: current } = await supabase.from("profiles").select("connects_balance").eq("id", validation.claims.profileId).single();
    if (!current) break;
    const currentBalance = Number(current.connects_balance ?? 0);
    const { data: updated } = await supabase
      .from("profiles")
      .update({ connects_balance: currentBalance + validation.pack.connects })
      .eq("id", validation.claims.profileId)
      .eq("connects_balance", currentBalance)
      .select("connects_balance")
      .maybeSingle();
    if (updated) {
      connectsBalance = Number(updated.connects_balance);
      break;
    }
  }

  if (connectsBalance == null) {
    await supabase.from("deposit_transactions").delete().eq("tx_hash", marker);
    throw new Error("Unable to credit Connects after Stars payment");
  }

  await supabase.from("connect_transactions").insert({
    profile_id: validation.claims.profileId,
    amount: validation.pack.connects,
    type: "purchase",
    reason: `Telegram Stars: ${validation.pack.priceStars} XTR (${input.telegramPaymentChargeId})`
  });
  return { connectsBalance, duplicate: false };
}
