"use client";

import { useCart } from "@/components/cart-provider";
import { useI18n } from "@/components/language-provider";
import Link from "next/link";

export function CartLink() {
  const { cart, isInitializing } = useCart();
  const { t } = useI18n();
  const quantity = cart?.totalQuantity ?? 0;

  return (
    <Link
      aria-label={
        isInitializing ? t.common.cartLoading : t.common.cartCount(quantity)
      }
      className="app-icon-button shrink-0 px-3"
      href="/cart"
    >
      <svg
        aria-hidden="true"
        fill="none"
        height="18"
        viewBox="0 0 24 24"
        width="18"
      >
        <path
          d="M7.5 8.25V6.5a4.5 4.5 0 0 1 9 0v1.75M5.2 8.25h13.6l.7 12H4.5l.7-12Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
      {!isInitializing && quantity > 0 ? (
        <span aria-hidden="true">{quantity}</span>
      ) : null}
    </Link>
  );
}
