"use client";

import { useCart } from "@/components/cart-provider";
import type { ShopifyMoney } from "@/lib/shopify";
import type { ShopifyCartLine } from "@/lib/shopify/cart";
import Image from "next/image";
import Link from "next/link";

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
    isCheckingOut,
    isInitializing,
    isMutating,
    notice,
    refreshCart,
    removeLine,
    updateLineQuantity,
  } = useCart();
  const isBusy = isMutating || isCheckingOut;

  function decreaseLine(line: ShopifyCartLine) {
    if (line.quantity <= 1) {
      void removeLine(line.id);
      return;
    }

    void updateLineQuantity(line.id, line.quantity - 1);
  }

  return (
    <div aria-busy={isInitializing || isBusy}>
      {error ? (
        <div
          className="app-alert mb-4"
          role="alert"
        >
          <p>{error}</p>
          <button
            className="mt-3 font-bold underline disabled:cursor-not-allowed disabled:opacity-50"
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
          className="app-notice mb-4"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      {isInitializing ? (
        <div aria-label="Recupero del carrello da Shopify" className="space-y-3">
          {[0, 1].map((item) => (
            <div className="surface-panel grid grid-cols-[5.25rem_1fr] gap-3 p-3" key={item}>
              <div className="skeleton aspect-square rounded-2xl" />
              <div className="space-y-3 py-1">
                <div className="skeleton h-4 w-4/5 rounded-full" />
                <div className="skeleton h-3 w-2/5 rounded-full" />
                <div className="skeleton h-9 w-32 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : !cart || cart.lines.nodes.length === 0 ? (
        <div className="surface-panel px-6 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand)]">
            <svg aria-hidden="true" fill="none" height="25" viewBox="0 0 24 24" width="25">
              <path d="M7.5 8.25V6.5a4.5 4.5 0 0 1 9 0v1.75M5.2 8.25h13.6l.7 12H4.5l.7-12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-bold text-[var(--app-text)]">
            Il carrello è vuoto
          </h2>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            Trova il tuo prossimo preferito nella selezione SLINK.
          </p>
          <Link
            className="app-cta mt-5"
            href="/"
          >
            Scopri i prodotti
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(18rem,1fr)] lg:items-start">
          <ul className="space-y-3" aria-label="Prodotti nel carrello">
            {cart.lines.nodes.map((line) => (
              <li
                className="surface-panel grid grid-cols-[5.25rem_minmax(0,1fr)] gap-3 p-3 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:p-4"
                key={line.id}
              >
                <Link
                  aria-label={`Apri ${line.merchandise.product.title}`}
                  className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--app-surface-muted)]"
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
                      sizes="(max-width: 639px) 84px, 104px"
                      src={line.merchandise.image.url}
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center px-2 text-center text-xs text-[var(--app-muted)]">
                      Immagine non disponibile
                    </span>
                  )}
                </Link>

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        className="text-sm font-bold leading-snug text-[var(--app-text)] no-underline sm:text-base"
                        href={`/products/${line.merchandise.product.handle}`}
                      >
                        {line.merchandise.product.title}
                      </Link>
                      <p className="mt-1 text-xs leading-4 text-[var(--app-muted)]">
                        {getVariantLabel(line)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold text-[var(--app-text)]">
                      {formatMoney(line.cost.totalAmount)}
                    </span>
                  </div>

                  {!line.merchandise.availableForSale ? (
                    <p className="mt-2 text-xs font-bold text-[var(--app-danger)]">
                      Variante non disponibile
                    </p>
                  ) : null}

                  <p className="mt-2 text-xs text-[var(--app-muted)]">
                    {formatMoney(line.cost.amountPerQuantity)} ciascuno
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div
                      aria-label={`Quantità di ${line.merchandise.product.title}`}
                      className="quantity-control"
                      role="group"
                    >
                      <button
                        aria-label={`Diminuisci quantità di ${line.merchandise.product.title}`}
                        disabled={isBusy}
                        onClick={() => decreaseLine(line)}
                        type="button"
                      >
                        −
                      </button>
                      <output
                        aria-live="polite"
                        className="text-center text-sm font-bold text-[var(--app-text)]"
                      >
                        {line.quantity}
                      </output>
                      <button
                        aria-label={`Aumenta quantità di ${line.merchandise.product.title}`}
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
                      aria-label={`Rimuovi ${line.merchandise.product.title} dal carrello`}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--app-danger)] disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={isBusy}
                      onClick={() => void removeLine(line.id)}
                      type="button"
                    >
                      <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                        <path d="M4.5 7.25h15M9.25 3.75h5.5m-8.5 3.5.8 12.25h9.9l.8-12.25M9.5 10.5v5.75m5-5.75v5.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="surface-panel p-5 lg:sticky lg:top-5" aria-label="Riepilogo ordine">
            <h2 className="text-base font-extrabold text-[var(--app-text)]">Riepilogo</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--app-muted)]">Articoli</dt>
                <dd className="font-bold text-[var(--app-text)]">
                  {cart.totalQuantity}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--app-muted)]">Subtotale</dt>
                <dd className="font-bold text-[var(--app-text)]">
                  {formatMoney(cart.cost.subtotalAmount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-[var(--app-line)] pt-3 text-base">
                <dt className="font-extrabold text-[var(--app-text)]">Totale</dt>
                <dd className="font-extrabold text-[var(--app-text)]">
                  {formatMoney(cart.cost.totalAmount)}
                </dd>
              </div>
            </dl>

            {!cart.checkoutUrl?.trim() ? (
              <p
                className="app-alert mt-5"
                role="alert"
              >
                Checkout Shopify temporaneamente non disponibile.
              </p>
            ) : null}

          </aside>
        </div>
      )}

      {isMutating ? (
        <p
          className="mt-4 text-center text-xs font-bold text-[var(--app-muted)]"
          role="status"
        >
          Aggiornamento del carrello su Shopify...
        </p>
      ) : null}
    </div>
  );
}
