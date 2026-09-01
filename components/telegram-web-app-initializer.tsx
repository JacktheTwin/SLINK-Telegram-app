"use client";

import { useCart } from "@/components/cart-provider";
import type { ShopifyMoney } from "@/lib/shopify";
import {
  initializeTelegramWebApp,
  isRunningInTelegram,
  setupTelegramBackButton,
  setupTelegramMainButton,
} from "@/lib/telegram";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useSyncExternalStore } from "react";

type TelegramEnvironment = "browser" | "pending" | "telegram";

function subscribeToTelegramEnvironment(): () => void {
  return () => undefined;
}

function getTelegramEnvironmentSnapshot(): TelegramEnvironment {
  return isRunningInTelegram() ? "telegram" : "browser";
}

function getServerTelegramEnvironmentSnapshot(): TelegramEnvironment {
  return "pending";
}

function formatMoney(money: ShopifyMoney): string {
  return new Intl.NumberFormat("it-CH", {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number.parseFloat(money.amount));
}

export function TelegramWebAppInitializer() {
  const {
    cart,
    checkout,
    isCheckingOut,
    isInitializing,
    isMutating,
  } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const telegramEnvironment = useSyncExternalStore(
    subscribeToTelegramEnvironment,
    getTelegramEnvironmentSnapshot,
    getServerTelegramEnvironmentSnapshot,
  );
  const hasCartProducts = Boolean(
    cart && cart.totalQuantity > 0 && cart.lines.nodes.length > 0,
  );
  const isHomeCtaVisible = pathname === "/" && hasCartProducts;
  const isCartCtaVisible = pathname === "/cart" && hasCartProducts;
  const isMainButtonVisible = isHomeCtaVisible || isCartCtaVisible;
  const isMainButtonBusy = isInitializing || isMutating || isCheckingOut;
  const total = cart ? formatMoney(cart.cost.totalAmount) : "";
  const mainButtonText = isHomeCtaVisible
    ? `Carrello · ${total}`
    : isCartCtaVisible
      ? `Checkout · ${total}`
      : "";

  const handleMainButtonClick = useCallback(() => {
    if (!isMainButtonVisible || isMainButtonBusy) {
      return;
    }

    if (pathname === "/") {
      router.push("/cart");
      return;
    }

    if (pathname === "/cart") {
      void checkout();
    }
  }, [checkout, isMainButtonBusy, isMainButtonVisible, pathname, router]);

  useEffect(() => {
    initializeTelegramWebApp();

    const shouldShowBackButton =
      pathname === "/cart" || pathname.startsWith("/products/");

    return setupTelegramBackButton(shouldShowBackButton, () => {
      router.back();
    });
  }, [pathname, router]);

  useEffect(
    () =>
      setupTelegramMainButton({
        isBusy: isMainButtonBusy,
        isVisible: isMainButtonVisible,
        onClick: handleMainButtonClick,
        text: mainButtonText,
      }),
    [
      handleMainButtonClick,
      isMainButtonBusy,
      isMainButtonVisible,
      mainButtonText,
    ],
  );

  if (telegramEnvironment !== "browser" || !isMainButtonVisible) {
    return null;
  }

  return (
    <>
      <div aria-hidden className="h-24" />
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <button
          aria-busy={isMainButtonBusy}
          className="mx-auto block w-full max-w-6xl rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
          disabled={isMainButtonBusy}
          onClick={handleMainButtonClick}
          type="button"
        >
          {mainButtonText}
        </button>
      </div>
    </>
  );
}
