"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type TelegramUserPayload = {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  language_code?: string;
};

type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramUserPayload;
  };
  colorScheme?: "light" | "dark";
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  openTelegramLink?: (url: string) => void;
};

export type VerifiedTelegramUser = {
  telegramId: string;
  username: string | null;
  firstName: string;
  lastName: string | null;
  photoUrl: string | null;
  languageCode: string | null;
  verified?: boolean;
};

export type TelegramSyncedProfile = {
  id: string;
  telegramId: string;
  telegramUsername: string | null;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
  energyBalance: number;
  tonBalance: number;
  activeRole: "client" | "freelancer";
  subscriptionUntil: string | null;
  subscriptionTier: string | null;
  connectsBalance: number;
};

type TelegramContextValue = {
  isTelegram: boolean;
  initData: string;
  colorScheme: "light" | "dark";
  authStatus: "idle" | "verifying" | "verified" | "unavailable" | "error";
  user: VerifiedTelegramUser | null;
  profile: TelegramSyncedProfile | null;
};

const TelegramContext = createContext<TelegramContextValue>({
  isTelegram: false,
  initData: "",
  colorScheme: "light",
  authStatus: "idle",
  user: null,
  profile: null
});

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<TelegramContextValue>({
    isTelegram: false,
    initData: "",
    colorScheme: "light",
    authStatus: "idle",
    user: null,
    profile: null
  });

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let controller: AbortController | null = null;

    const syncTelegram = () => {
      if (cancelled) {
        return;
      }

      const webApp = window.Telegram?.WebApp;
      if (!webApp) {
        attempts += 1;
        if (attempts < 20) {
          window.setTimeout(syncTelegram, 100);
          return;
        }
        setValue((current) => ({ ...current, authStatus: "unavailable" }));
        return;
      }

      webApp.ready();
      webApp.expand();
      webApp.setHeaderColor?.("#0ea5e9");

      const initData = webApp.initData || readTelegramInitDataFromUrl();
      const displayUser = getDisplayUser(webApp);

      setValue({
        isTelegram: true,
        initData,
        colorScheme: webApp.colorScheme ?? "light",
        authStatus: initData ? "verifying" : "unavailable",
        user: displayUser,
        profile: null
      });

      if (!initData) {
        return;
      }

      controller = new AbortController();
      void fetch("/api/telegram/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ initData }),
        signal: controller.signal
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Telegram auth failed");
          }
          return (await response.json()) as { data?: { user?: VerifiedTelegramUser; profile?: TelegramSyncedProfile } };
        })
        .then((payload) => {
          setValue((current) => ({
            ...current,
            authStatus: "verified",
            user: payload.data?.user ?? current.user,
            profile: payload.data?.profile ?? null
          }));
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setValue((current) => ({ ...current, authStatus: "error", user: current.user }));
        });
    };

    syncTelegram();

    return () => {
      cancelled = true;
      controller?.abort();
    };
  }, []);

  useEffect(() => {
    if (value.colorScheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [value.colorScheme]);

  const contextValue = useMemo(() => value, [value]);

  return <TelegramContext.Provider value={contextValue}>{children}</TelegramContext.Provider>;
}

export function useTelegram() {
  return useContext(TelegramContext);
}

function getDisplayUser(webApp: TelegramWebApp): VerifiedTelegramUser | null {
  const user = webApp.initDataUnsafe?.user ?? readTelegramUserFromUrl();
  if (!user?.id) {
    return null;
  }

  return {
    telegramId: String(user.id),
    username: user.username ?? null,
    firstName: user.first_name ?? "Telegram user",
    lastName: user.last_name ?? null,
    photoUrl: user.photo_url ?? null,
    languageCode: user.language_code ?? null,
    verified: false
  };
}

function readTelegramInitDataFromUrl() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  return hashParams.get("tgWebAppData") ?? searchParams.get("tgWebAppData") ?? "";
}

function readTelegramUserFromUrl(): TelegramUserPayload | null {
  const initData = readTelegramInitDataFromUrl();
  if (!initData) {
    return null;
  }

  const userJson = new URLSearchParams(initData).get("user");
  if (!userJson) {
    return null;
  }

  try {
    return JSON.parse(userJson) as TelegramUserPayload;
  } catch {
    return null;
  }
}
