"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { TelegramProvider } from "@/components/telegram-provider";
import { TelegramOnlyGate } from "@/components/telegram-only-gate";
import { LanguageProvider } from "@/components/language-provider";
import { getTonConnectManifestUrl } from "@/lib/ton/network";
import type { WorkPayLanguage } from "@/lib/domain/types";

export function Providers({ children, initialLanguage }: { children: React.ReactNode; initialLanguage?: WorkPayLanguage }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TonConnectUIProvider manifestUrl={getTonConnectManifestUrl()}>
          <TelegramProvider>
            <LanguageProvider initialLanguage={initialLanguage}>
              <TelegramOnlyGate>{children}</TelegramOnlyGate>
            </LanguageProvider>
          </TelegramProvider>
        </TonConnectUIProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
