import { CartProvider } from "@/components/cart-provider";
import { LanguageProvider } from "@/components/language-provider";
import { TelegramWebAppInitializer } from "@/components/telegram-web-app-initializer";
import { getRequestI18n } from "@/lib/i18n/server";
import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// Sans geometrico vicino al logotipo SLINK, scelto con la skill
// design-taste-frontend (abbinamento "figtree" per negozi di prodotto).
const figtree = Figtree({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-figtree",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestI18n();

  return {
    title: t.meta.title,
    description: t.meta.description,
    icons: {
      icon: {
        url: "/brand/slink-favicon.png",
        sizes: "30x32",
        type: "image/png",
      },
      shortcut: "/brand/slink-favicon.png",
    },
  };
}

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: "#008892",
  viewportFit: "cover",
  width: "device-width",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  const { language } = await getRequestI18n();

  return (
    <html
      className={figtree.variable}
      lang={language.toLowerCase()}
      suppressHydrationWarning
    >
      <body>
        <LanguageProvider language={language}>
          <CartProvider>
            {children}
            <TelegramWebAppInitializer />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
