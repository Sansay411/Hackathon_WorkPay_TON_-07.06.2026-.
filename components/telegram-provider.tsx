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

type TelegramThemeParams = Record<string, string>;

type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: {
    user?: TelegramUserPayload;
  };
  version?: string;
  platform?: string;
  colorScheme?: "light" | "dark";
  themeParams?: TelegramThemeParams;
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  enableVerticalSwipes?: () => void;
  openTelegramLink?: (url: string) => void;
  onEvent?: (eventName: string, callback: () => void) => void;
  offEvent?: (eventName: string, callback: () => void) => void;
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

export type TelegramRuntime = "loading" | "telegram" | "outside";

type TelegramContextValue = {
  runtime: TelegramRuntime;
  isTelegram: boolean;
  initData: string;
  colorScheme: "light" | "dark";
  authStatus: "idle" | "verifying" | "verified" | "unavailable" | "error";
  user: VerifiedTelegramUser | null;
  profile: TelegramSyncedProfile | null;
};

const defaultContext: TelegramContextValue = {
  runtime: "loading",
  isTelegram: false,
  initData: "",
  colorScheme: "light",
  authStatus: "idle",
  user: null,
  profile: null
};

const TelegramContext = createContext<TelegramContextValue>(defaultContext);

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<TelegramContextValue>(defaultContext);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let controller: AbortController | null = null;
    let activeWebApp: TelegramWebApp | null = null;

    const syncTheme = () => {
      if (!activeWebApp) {
        return;
      }

      const colorScheme = applyTelegramChrome(activeWebApp);
      setValue((current) => ({ ...current, colorScheme }));
    };

    const markOutsideTelegram = () => {
      if (!cancelled) {
        setValue({ ...defaultContext, runtime: "outside", authStatus: "unavailable" });
      }
    };

    const syncTelegram = () => {
      if (cancelled) {
        return;
      }

      const webApp = window.Telegram?.WebApp;
      if (!webApp) {
        attempts += 1;
        if (attempts < 30) {
          window.setTimeout(syncTelegram, 100);
          return;
        }
        markOutsideTelegram();
        return;
      }

      const initData = webApp.initData || readTelegramInitDataFromUrl();
      if (!isTelegramRuntime(webApp, initData)) {
        markOutsideTelegram();
        return;
      }

      activeWebApp = webApp;
      webApp.ready();
      webApp.expand();
      webApp.enableVerticalSwipes?.();
      const colorScheme = applyTelegramChrome(webApp);
      webApp.onEvent?.("themeChanged", syncTheme);

      const displayUser = getDisplayUser(webApp);
      setValue({
        runtime: "telegram",
        isTelegram: true,
        initData,
        colorScheme,
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
          if (cancelled) {
            return;
          }
          setValue((current) => ({
            ...current,
            authStatus: "verified",
            user: payload.data?.user ?? current.user,
            profile: payload.data?.profile ?? null
          }));
        })
        .catch((error: unknown) => {
          if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
            return;
          }
          setValue((current) => ({ ...current, authStatus: "error", user: current.user }));
        });
    };

    syncTelegram();

    return () => {
      cancelled = true;
      controller?.abort();
      activeWebApp?.offEvent?.("themeChanged", syncTheme);
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

function isTelegramRuntime(webApp: TelegramWebApp, initData: string) {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const launchParamNames = ["tgWebAppVersion", "tgWebAppPlatform", "tgWebAppThemeParams", "tgWebAppData"];
  const hasLaunchParams = launchParamNames.some((name) => hashParams.has(name) || searchParams.has(name));
  const platform = webApp.platform?.toLowerCase();
  const hasTelegramPlatform = Boolean(platform && platform !== "unknown" && webApp.version);
  return Boolean(initData || hasLaunchParams || hasTelegramPlatform);
}

function applyTelegramChrome(webApp: TelegramWebApp) {
  const theme = webApp.themeParams ?? {};
  const backgroundColor = theme.bg_color ?? "#f2f7fa";
  const secondaryBackgroundColor = theme.secondary_bg_color ?? "#ffffff";
  document.documentElement.style.setProperty("--tg-bg-color", backgroundColor);
  document.documentElement.style.setProperty("--tg-secondary-bg-color", secondaryBackgroundColor);
  document.documentElement.style.setProperty("--tg-text-color", theme.text_color ?? "#17272f");
  document.documentElement.style.setProperty("--tg-hint-color", theme.hint_color ?? "#71838c");
  webApp.setHeaderColor?.(backgroundColor);
  webApp.setBackgroundColor?.(backgroundColor);
  webApp.setBottomBarColor?.(theme.bottom_bar_bg_color ?? secondaryBackgroundColor);
  return webApp.colorScheme === "dark" ? "dark" : "light";
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
