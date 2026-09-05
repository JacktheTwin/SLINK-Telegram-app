import { CartProvider } from "@/components/cart-provider";
import { TelegramWebAppInitializer } from "@/components/telegram-web-app-initializer";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SLINK | Mini Shop su Telegram",
  description: "La selezione SLINK, direttamente su Telegram.",
  icons: {
    icon: {
      url: "/brand/slink-favicon.png",
      sizes: "30x32",
      type: "image/png",
    },
    shortcut: "/brand/slink-favicon.png",
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#008892",
  viewportFit: "cover",
  width: "device-width",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        <CartProvider>
          {children}
          <TelegramWebAppInitializer />
        </CartProvider>
      </body>
    </html>
  );
}
