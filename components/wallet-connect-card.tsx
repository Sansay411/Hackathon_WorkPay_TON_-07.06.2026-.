"use client";

import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, WalletCards } from "lucide-react";
import { truncateTonAddress } from "@/lib/ton/address";
import { useTelegram } from "@/components/telegram-provider";
import { useLanguage } from "@/components/language-provider";
import { getTonNetwork } from "@/lib/ton/network";

export function WalletConnectCard() {
  const wallet = useTonWallet();
  const { initData, isTelegram } = useTelegram();
  const { t } = useLanguage();
  const network = getTonNetwork();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const walletAddress = wallet?.account.address ?? null;
  const lastSavedWallet = useRef<string | null>(null);

  const saveWalletAddress = useCallback(async () => {
    if (!walletAddress) {
      return;
    }

    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/wallet/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ initData, walletAddress, network })
    });

    const payload = (await response.json()) as { ok?: boolean; data?: { profile?: { walletAddress?: string | null } }; error?: { message?: string } };
    if (!response.ok || !payload.ok || !payload.data?.profile?.walletAddress) {
      setStatus("error");
      setMessage(payload.error?.message ?? t.walletExtra.saveFailed);
      return;
    }

    setStatus("saved");
    setMessage(`${t.walletExtra.savedPrefix} ${truncateTonAddress(payload.data.profile.walletAddress)}`);
    lastSavedWallet.current = walletAddress;
  }, [initData, network, walletAddress, t.walletExtra.saveFailed, t.walletExtra.savedPrefix]);

  useEffect(() => {
    if (!walletAddress || walletAddress === lastSavedWallet.current) {
      return;
    }

    void saveWalletAddress();
  }, [saveWalletAddress, walletAddress]);

  return (
    <section className="rounded-[28px] border border-[#262932] bg-[#111318] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.6)] text-white">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-[#a3e635] p-3 text-black">
          <WalletCards className="h-5 w-5 text-black" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black text-[#a3e635]">{t.wallet.tonWallet}</p>
          <h2 className="mt-1 break-words text-xl font-black text-white">
            {walletAddress ? truncateTonAddress(walletAddress) : t.wallet.notConnected}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#9ca3af]">
            {walletAddress ? `${t.wallet.connectedOn} ${network}` : `${network} ${t.wallet.required}`}
          </p>
          <p className="mt-1 text-xs font-black text-[#9ca3af]">{isTelegram ? t.wallet.telegramSession : t.wallet.secureSession}</p>
        </div>
      </div>
      <div className="mt-4">
        <TonConnectButton />
      </div>
      <div className="mt-4 rounded-[20px] border border-[#262932] bg-[#16181f] p-3 text-xs font-semibold leading-5 text-[#9ca3af]">
        <p className="font-black text-white">{t.wallet.identity}</p>
        <p className="mt-1">{t.wallet.identityBody}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          className="rounded-[20px] bg-[#a3e635] px-4 py-3 text-sm font-black text-black hover:bg-[#84cc16] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!walletAddress || status === "saving" || status === "saved"}
          onClick={saveWalletAddress}
          type="button"
        >
          {status === "saving" ? t.common.saving : status === "saved" ? t.common.saved : t.wallet.saveWallet}
        </button>
        <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${walletAddress ? "border-[#a3e635]/40 bg-[#a3e635]/15 text-[#a3e635]" : "border-[#262932] bg-[#16181f] text-[#6b7280]"}`}>
          {status === "saved" ? <CheckCircle2 className="h-3.5 w-3.5 text-[#a3e635]" /> : null}
          {walletAddress ? (status === "saved" ? t.common.linked : t.common.connected) : t.wallet.connectWallet}
        </span>
      </div>
      {message ? <p className={`mt-3 text-xs font-black ${status === "error" ? "text-rose-400" : "text-[#a3e635]"}`}>{message}</p> : null}
    </section>
  );
}
