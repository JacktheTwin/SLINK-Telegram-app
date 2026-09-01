import { CartProvider } from "@/components/cart-provider";
import { TelegramWebAppInitializer } from "@/components/telegram-web-app-initializer";
import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slinklab | Mini Shop",
  description: "SLINK Telegram App",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        <Script
          src="https://telegram.org/js/telegram-web-app.js?63"
          strategy="beforeInteractive"
        />
        <CartProvider>
          {children}
          <TelegramWebAppInitializer />
        </CartProvider>
      </body>
    </html>
  );
}
