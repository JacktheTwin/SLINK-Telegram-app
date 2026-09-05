"use client";

import { useCart } from "@/components/cart-provider";
import type { ShopifyMoney } from "@/lib/shopify";
import {
  getTelegramStartProductHandle,
  initializeTelegramWebApp,
  isRunningInTelegram,
  setupTelegramBackButton,
  setupTelegramMainButton,
} from "@/lib/telegram";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

type TelegramEnvironment = "browser" | "pending" | "telegram";
const TELEGRAM_SDK_READY_EVENT = "slinklab:telegram-sdk-ready";

function subscribeToTelegramEnvironment(onStoreChange: () => void): () => void {
  window.addEventListener(TELEGRAM_SDK_READY_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(TELEGRAM_SDK_READY_EVENT, onStoreChange);
  };
}

function getTelegramEnvironmentSnapshot(): TelegramEnvironment {
  return isRunningInTelegram() ? "telegram" : "browser";
}

function getServerTelegramEnvironmentSnapshot(): TelegramEnvironment {
  return "pending";
}

function notifyTelegramSdkReady(): void {
  window.dispatchEvent(new Event(TELEGRAM_SDK_READY_EVENT));
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
  const startParamWasHandled = useRef(false);
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
    const root = document.documentElement;

    if (telegramEnvironment === "telegram") {
      root.dataset.telegram = "true";
    } else {
      delete root.dataset.telegram;
    }

    return () => {
      delete root.dataset.telegram;
    };
  }, [telegramEnvironment]);

  useEffect(() => {
    if (
      telegramEnvironment !== "telegram" ||
      pathname !== "/" ||
      startParamWasHandled.current
    ) {
      return;
    }

    startParamWasHandled.current = true;
    const productHandle = getTelegramStartProductHandle();

    if (productHandle) {
      router.replace(`/products/${encodeURIComponent(productHandle)}`);
    }
  }, [pathname, router, telegramEnvironment]);

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
        color: "#008892",
        isBusy: isMainButtonBusy,
        isVisible: isMainButtonVisible,
        onClick: handleMainButtonClick,
        text: mainButtonText,
        textColor: "#ffffff",
      }),
    [
      handleMainButtonClick,
      isMainButtonBusy,
      isMainButtonVisible,
      mainButtonText,
    ],
  );

  return (
    <>
      <Script
        id="telegram-web-app-sdk"
        onLoad={notifyTelegramSdkReady}
        src="https://telegram.org/js/telegram-web-app.js?63"
        strategy="afterInteractive"
      />
      {telegramEnvironment === "browser" && isMainButtonVisible ? (
        <>
          <div aria-hidden className="web-main-cta-spacer" />
          <div className="web-main-cta">
            <button
              aria-busy={isMainButtonBusy}
              className="app-cta mx-auto flex w-full max-w-4xl"
              disabled={isMainButtonBusy}
              onClick={handleMainButtonClick}
              type="button"
            >
              {mainButtonText}
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
