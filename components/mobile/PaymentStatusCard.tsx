"use client";

import { useEffect, useState } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { LockKeyhole, WalletCards } from "lucide-react";
import { useTelegram } from "@/components/telegram-provider";
import { WalletGateButton, WalletGateNotice, useWalletAccess } from "@/components/wallet-access";
import { sanitizeTonConnectTransaction, type TonConnectTransaction } from "@/lib/ton/tonconnect";

type PaymentStatusCardProps = {
  dealId: string;
  amount: string;
  asset: string;
  onVerifiedDeposit?: (balanceTon: number) => void;
};

type PaymentCreateResponse = {
  ok?: boolean;
  data?: {
    transaction?: TonConnectTransaction;
  };
  error?: { code?: string; message?: string };
};

type PaymentVerifyResponse = {
  ok?: boolean;
  data?: {
    verification?: { status?: string; reason?: string };
    balanceUpdate?: { status?: string; balanceTon?: number; message?: string } | null;
  };
  error?: { code?: string; message?: string };
};

type PaymentReadiness = {
  escrowWalletConfigured: boolean;
  tonCenterConfigured: boolean;
  mainnetEnabled: boolean;
};

type PaymentReadinessResponse = {
  ok?: boolean;
  data?: PaymentReadiness;
};

export function PaymentStatusCard({ dealId, amount, asset, onVerifiedDeposit }: PaymentStatusCardProps) {
  const [tonConnectUI] = useTonConnectUI();
  const { initData } = useTelegram();
  const { isConnected } = useWalletAccess();
  const [status, setStatus] = useState<string>(isConnected ? "Waiting for TON payment" : "Wallet required");
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [readiness, setReadiness] = useState<PaymentReadiness | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/payments/readiness")
      .then(async (response) => (await response.json()) as PaymentReadinessResponse)
      .then((payload) => {
        if (!cancelled) {
          setReadiness(payload.data ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReadiness(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-[30px] border border-[#262932] bg-[#111318] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.7)] text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-[#a3e635]">TON Payment Proof</p>
          <h2 className="mt-1 text-2xl font-black text-white">Secure Escrow Payment</h2>
        </div>
        <div className="rounded-2xl bg-[#a3e635] p-3 text-black">
          <LockKeyhole className="h-6 w-6 text-black" />
        </div>
      </div>

      <PaymentReadinessPanel isConnected={isConnected} readiness={readiness} />

      <div className="mt-5 grid gap-3">
        <StatusRow icon={<WalletCards className="h-4 w-4" />} label="Payment method" value={`${amount} ${asset}`} />
        <StatusRow icon={<LockKeyhole className="h-4 w-4" />} label="Escrow status" value={status} />
      </div>

      <div className="mt-4 rounded-[20px] border border-[#262932] bg-[#16181f] p-3 text-xs font-semibold leading-5 text-[#9ca3af]">
        <p className="font-black text-white">Direct Escrow Deposit</p>
        <p className="mt-1">Initiate a secure transfer to the platform escrow wallet. Wallet approval submits the transaction to the TON network.</p>
        
        {!readiness?.escrowWalletConfigured ? (
          <p className="mt-2 rounded-2xl border border-[#f43f5e]/30 bg-[#f43f5e]/15 px-3 py-2 font-black text-[#f43f5e]">ESCROW_WALLET_ADDRESS is not configured. Payments are disabled.</p>
        ) : null}

        <WalletGateButton
          className="mt-3 w-full rounded-2xl bg-[#a3e635] px-4 py-3 text-sm font-black text-black hover:bg-[#84cc16] disabled:cursor-not-allowed disabled:opacity-60"
          connectedLabel={busy ? "Opening wallet..." : `Pay ${amount} ${asset}`}
          onClick={async () => {
            setBusy(true);
            setStatus("Preparing transaction");
            try {
              const response = await fetch("/api/payments/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initData, dealId, amount, asset })
              });
              const payload = (await response.json()) as PaymentCreateResponse;
              if (!response.ok || !payload.ok || !payload.data?.transaction) {
                setStatus(payload.error?.message ?? "Setup required");
                return;
              }
              await tonConnectUI.sendTransaction(sanitizeTonConnectTransaction(payload.data.transaction));
              setStatus("Transaction sent. Paste the hash below to confirm on-chain verification.");
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "Wallet rejected transaction.");
            } finally {
              setBusy(false);
            }
          }}
        />

        <details className="mt-3">
          <summary className="cursor-pointer rounded-2xl border border-[#262932] bg-[#111318] px-3 py-2 text-xs font-black text-[#9ca3af] hover:text-white">Manual verification</summary>
          <div className="mt-2 grid gap-2 pl-2">
            <input
              className="h-11 rounded-2xl border border-[#262932] bg-[#08090a] px-3 text-sm font-semibold text-white outline-none placeholder:text-[#6b7280]"
              onChange={(event) => setTxHash(event.target.value)}
              placeholder="Paste transaction hash"
              value={txHash}
            />
            {!readiness?.tonCenterConfigured ? (
              <p className="rounded-2xl border border-[#f43f5e]/30 bg-[#f43f5e]/15 px-3 py-2 text-xs font-black text-[#f43f5e]">TONCENTER_API_KEY is not configured. Verification is unavailable.</p>
            ) : null}
            <button
              className="rounded-2xl border border-[#a3e635] bg-[#111318] px-4 py-3 text-sm font-black text-[#a3e635] hover:bg-[#a3e635]/15 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy || !readiness?.tonCenterConfigured || txHash.trim().length < 40}
              onClick={async () => {
                setBusy(true);
                setStatus("Verifying transaction...");
                try {
                  if (dealId === "wallet-readiness") {
                    const response = await fetch("/api/wallet/deposit", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ initData, txHash, amount, network: "testnet" })
                    });
                    const payload = await response.json();
                    if (!response.ok || !payload.ok) {
                      setStatus(payload.error?.message ?? "Verification failed");
                      return;
                    }
                    const newBalance = payload.data?.balanceTon;
                    setStatus(`Deposit confirmed. Wallet Balance: ${newBalance} TON`);
                    if (newBalance !== null && newBalance !== undefined) {
                      onVerifiedDeposit?.(newBalance);
                    }
                  } else {
                    const response = await fetch("/api/payments/verify", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ initData, dealId, txHash, network: "testnet" })
                    });
                    const payload = (await response.json()) as PaymentVerifyResponse;
                    const verification = payload.data?.verification;
                    const balanceUpdate = payload.data?.balanceUpdate;
                    
                    if (!response.ok || !payload.ok) {
                      setStatus(payload.error?.message ?? "Verification failed");
                      return;
                    }
                    
                    const newBalance = balanceUpdate?.balanceTon;
                    setStatus(
                      verification?.status === "confirmed"
                        ? newBalance !== null && newBalance !== undefined
                          ? `Payment confirmed. Wallet Balance: ${newBalance} TON`
                          : "Payment confirmed successfully"
                        : verification?.reason ?? verification?.status ?? "Not confirmed yet"
                    );
                    if (verification?.status === "confirmed" && newBalance !== null && newBalance !== undefined) {
                      onVerifiedDeposit?.(newBalance);
                    }
                  }
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Verification request failed");
                } finally {
                  setBusy(false);
                }
              }}
              type="button"
            >
              Verify with TONCenter
            </button>
          </div>
        </details>
      </div>
      <WalletGateNotice />
    </section>
  );
}

function PaymentReadinessPanel({ readiness, isConnected }: { readiness: PaymentReadiness | null; isConnected: boolean }) {
  return (
    <div className="mt-4 rounded-[20px] border border-[#262932] bg-[#16181f] p-3 text-xs font-semibold leading-5 text-[#9ca3af]">
      <p className="font-black text-white">System configuration status</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <ReadinessFlag label="Escrow Address" value={readiness?.escrowWalletConfigured} />
        <ReadinessFlag label="TONCenter Gateway" value={readiness?.tonCenterConfigured} />
        <ReadinessFlag label="Mainnet enabled" value={readiness?.mainnetEnabled} />
        <ReadinessFlag label="Connected wallet" value={isConnected} />
      </div>
    </div>
  );
}

function ReadinessFlag({ label, value }: { label: string; value?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#262932] bg-[#111318] px-3 py-2">
      <p className="text-[10px] font-black uppercase text-[#6b7280]">{label}</p>
      <p className={`mt-0.5 font-black ${value ? "text-[#a3e635]" : "text-[#f43f5e]"}`}>{value ? "ready" : "not set"}</p>
    </div>
  );
}

function StatusRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[#262932] bg-[#16181f] px-3 py-3 text-sm shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-[#9ca3af]">
        <span className="text-[#a3e635]">{icon}</span>
        {label}
      </div>
      <span className="text-right font-black text-white">{value}</span>
    </div>
  );
}
