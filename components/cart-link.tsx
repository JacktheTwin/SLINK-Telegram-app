"use client";

import { useCart } from "@/components/cart-provider";
import Link from "next/link";

export function CartLink() {
  const { cart, isInitializing } = useCart();
  const quantity = cart?.totalQuantity ?? 0;

  return (
    <Link
      aria-label={
        isInitializing
          ? "Carrello in caricamento"
          : `Carrello, ${quantity} ${quantity === 1 ? "articolo" : "articoli"}`
      }
      className="inline-flex shrink-0 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      href="/cart"
    >
      Carrello{!isInitializing && quantity > 0 ? ` (${quantity})` : ""}
    </Link>
  );
}
