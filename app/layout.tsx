import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import { normalizeLanguage } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "WorkPay",
  description: "Secure freelance deals on TON"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0ea5e9"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const language = normalizeLanguage(cookieStore.get("workpay:language")?.value);

  return (
    <html data-scroll-behavior="smooth" lang={language} suppressHydrationWarning>
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <Providers initialLanguage={language}>{children}</Providers>
      </body>
    </html>
  );
}
