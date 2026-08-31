"use client";

import { useCart } from "@/components/cart-provider";
import type { ShopifyMoney } from "@/lib/shopify";
import type { ShopifyCartLine } from "@/lib/shopify/cart";
import { openCheckout } from "@/lib/shopify/checkout";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

function formatMoney(money: ShopifyMoney): string {
  return new Intl.NumberFormat("it-CH", {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number.parseFloat(money.amount));
}

function getVariantLabel(line: ShopifyCartLine): string {
  const values = line.merchandise.selectedOptions
    .filter(
      (option) =>
        !(option.name === "Title" && option.value === "Default Title"),
    )
    .map((option) => `${option.name}: ${option.value}`);

  return values.length > 0 ? values.join(" · ") : "Variante unica";
}

export function CartView() {
  const {
    cart,
    error,
    isInitializing,
    isMutating,
    notice,
    prepareCheckout,
    refreshCart,
    removeLine,
    updateLineQuantity,
  } = useCart();
  const checkoutLockRef = useRef(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const isBusy = isMutating || isCheckingOut;

  function decreaseLine(line: ShopifyCartLine) {
    if (line.quantity <= 1) {
      void removeLine(line.id);
      return;
    }

    void updateLineQuantity(line.id, line.quantity - 1);
  }

  async function handleCheckout(): Promise<void> {
    if (checkoutLockRef.current) {
      return;
    }

    setCheckoutError(null);

    if (!cart || cart.totalQuantity < 1 || cart.lines.nodes.length === 0) {
      setCheckoutError(
        "Il carrello è vuoto. Aggiungi almeno un prodotto prima del checkout.",
      );
      return;
    }

    checkoutLockRef.current = true;
    setIsCheckingOut(true);

    try {
      const checkoutUrl = await prepareCheckout();

      if (!checkoutUrl) {
        checkoutLockRef.current = false;
        setIsCheckingOut(false);
        return;
      }

      openCheckout(checkoutUrl);
    } catch (checkoutNavigationError: unknown) {
      setCheckoutError(
        checkoutNavigationError instanceof Error
          ? checkoutNavigationError.message
          : "Non è stato possibile aprire il checkout Shopify.",
      );
      checkoutLockRef.current = false;
      setIsCheckingOut(false);
    }
  }

  return (
    <div aria-busy={isInitializing || isBusy}>
      {error ? (
        <div
          className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          <p>{error}</p>
          <button
            className="mt-3 font-semibold underline disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isInitializing || isBusy}
            onClick={() => void refreshCart()}
            type="button"
          >
            Riprova
          </button>
        </div>
      ) : null}

      {notice ? (
        <p
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      {isInitializing ? (
        <p className="rounded-xl bg-neutral-100 p-6 text-center text-sm text-neutral-600">
          Recupero del carrello da Shopify...
        </p>
      ) : !cart || cart.lines.nodes.length === 0 ? (
        <div className="rounded-xl bg-neutral-100 p-8 text-center">
          <h2 className="text-lg font-semibold text-neutral-900">
            Il carrello è vuoto
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Aggiungi un prodotto per iniziare.
          </p>
          <Link
            className="mt-5 inline-flex rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white"
            href="/"
          >
            Scopri i prodotti
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(18rem,1fr)] lg:items-start">
          <ul className="space-y-4" aria-label="Prodotti nel carrello">
            {cart.lines.nodes.map((line) => (
              <li
                className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-xl border border-neutral-200 bg-white p-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:p-4"
                key={line.id}
              >
                <Link
                  aria-label={`Apri ${line.merchandise.product.title}`}
                  className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100"
                  href={`/products/${line.merchandise.product.handle}`}
                >
                  {line.merchandise.image ? (
                    <Image
                      alt={
                        line.merchandise.image.altText ||
                        line.merchandise.product.title
                      }
                      className="object-cover"
                      fill
                      sizes="(max-width: 639px) 88px, 112px"
                      src={line.merchandise.image.url}
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center px-2 text-center text-xs text-neutral-500">
                      Immagine non disponibile
                    </span>
                  )}
                </Link>

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        className="font-semibold text-neutral-900"
                        href={`/products/${line.merchandise.product.handle}`}
                      >
                        {line.merchandise.product.title}
                      </Link>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        {getVariantLabel(line)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-neutral-900">
                      {formatMoney(line.cost.totalAmount)}
                    </span>
                  </div>

                  {!line.merchandise.availableForSale ? (
                    <p className="mt-2 text-xs font-medium text-red-700">
                      Variante non disponibile
                    </p>
                  ) : null}

                  <p className="mt-2 text-xs text-neutral-500">
                    {formatMoney(line.cost.amountPerQuantity)} ciascuno
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div
                      aria-label={`Quantità di ${line.merchandise.product.title}`}
                      className="inline-flex items-center rounded-lg border border-neutral-300"
                    >
                      <button
                        aria-label={`Diminuisci quantità di ${line.merchandise.product.title}`}
                        className="h-10 w-10 text-lg disabled:cursor-not-allowed disabled:text-neutral-300"
                        disabled={isBusy}
                        onClick={() => decreaseLine(line)}
                        type="button"
                      >
                        −
                      </button>
                      <output
                        aria-live="polite"
                        className="min-w-8 text-center text-sm font-medium"
                      >
                        {line.quantity}
                      </output>
                      <button
                        aria-label={`Aumenta quantità di ${line.merchandise.product.title}`}
                        className="h-10 w-10 text-lg disabled:cursor-not-allowed disabled:text-neutral-300"
                        disabled={
                          isBusy || !line.merchandise.availableForSale
                        }
                        onClick={() =>
                          void updateLineQuantity(line.id, line.quantity + 1)
                        }
                        type="button"
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="text-sm font-medium text-red-700 underline disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() => void removeLine(line.id)}
                      type="button"
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="rounded-xl bg-neutral-100 p-5" aria-label="Totali">
            <h2 className="text-lg font-semibold text-neutral-900">Totali</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-600">Articoli</dt>
                <dd className="font-medium text-neutral-900">
                  {cart.totalQuantity}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-600">Subtotale</dt>
                <dd className="font-medium text-neutral-900">
                  {formatMoney(cart.cost.subtotalAmount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-neutral-300 pt-3 text-base">
                <dt className="font-semibold text-neutral-900">Totale</dt>
                <dd className="font-semibold text-neutral-900">
                  {formatMoney(cart.cost.totalAmount)}
                </dd>
              </div>
            </dl>

            {!cart.checkoutUrl?.trim() ? (
              <p
                className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                role="alert"
              >
                Checkout Shopify temporaneamente non disponibile.
              </p>
            ) : null}

            {checkoutError ? (
              <p
                className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                role="alert"
              >
                {checkoutError}
              </p>
            ) : null}

            <button
              className="mt-5 w-full rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
              disabled={isBusy || !cart.checkoutUrl?.trim()}
              onClick={() => void handleCheckout()}
              type="button"
            >
              {isCheckingOut ? "Apertura checkout..." : "Checkout"}
            </button>
          </aside>
        </div>
      )}

      {isMutating ? (
        <p
          className="mt-4 text-center text-sm font-medium text-neutral-600"
          role="status"
        >
          Aggiornamento del carrello su Shopify...
        </p>
      ) : null}
    </div>
  );
}
