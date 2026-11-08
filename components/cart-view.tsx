"use client";

import { useCart } from "@/components/cart-provider";
import { useI18n } from "@/components/language-provider";
import { formatMoney } from "@/lib/i18n";
import type { ShopifyCartLine } from "@/lib/shopify/cart";
import Image from "next/image";
import Link from "next/link";

function getVariantLabel(line: ShopifyCartLine): string | null {
  const values = line.merchandise.selectedOptions.map(
    (option) => `${option.name}: ${option.value}`,
  );

  return values.length > 0 ? values.join(" · ") : null;
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
  const { language, t } = useI18n();
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
            className="mt-3 inline-flex min-h-11 items-center font-medium underline disabled:opacity-50"
            disabled={isInitializing || isBusy}
            onClick={() => void refreshCart()}
            type="button"
          >
            {t.common.retry}
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
        <div aria-label={t.cart.loading} className="space-y-3">
          {[0, 1].map((item) => (
            <div className="surface-panel grid grid-cols-[5.5rem_1fr] gap-4 p-3" key={item}>
              <div className="skeleton aspect-square rounded-[var(--r-md)]" />
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--app-surface-muted)] text-[var(--app-text)]">
            <svg aria-hidden="true" fill="none" height="25" viewBox="0 0 24 24" width="25">
              <path d="M7.5 8.25V6.5a4.5 4.5 0 0 1 9 0v1.75M5.2 8.25h13.6l.7 12H4.5l.7-12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
            </svg>
          </div>
          <h2 className="section-heading mt-4">
            {t.cart.emptyTitle}
          </h2>
          <p className="mt-2 text-base text-[var(--app-muted)]">
            {t.cart.emptyText}
          </p>
          <Link
            className="app-cta mt-5"
            href="/"
          >
            {t.cart.discover}
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(18rem,1fr)] lg:items-start">
          <ul className="space-y-3" aria-label={t.cart.lines}>
            {cart.lines.nodes.map((line) => (
              <li
                className="surface-panel grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 p-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:p-4"
                key={line.id}
              >
                <Link
                  aria-label={t.cart.open(line.merchandise.product.title)}
                  className="cart-thumb"
                  href={`/products/${line.merchandise.product.handle}`}
                >
                  {line.merchandise.image ? (
                    <Image
                      alt={
                        line.merchandise.image.altText ||
                        line.merchandise.product.title
                      }
                      fill
                      sizes="(max-width: 639px) 84px, 104px"
                      src={line.merchandise.image.url}
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center px-2 text-center text-xs text-[var(--app-muted)]">
                      {t.common.imageUnavailable}
                    </span>
                  )}
                </Link>

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        className="text-base font-medium leading-snug text-[var(--app-text)] no-underline"
                        href={`/products/${line.merchandise.product.handle}`}
                      >
                        {line.merchandise.product.title}
                      </Link>
                      <p className="mt-1 text-sm leading-5 text-[var(--app-muted)]">
                        {getVariantLabel(line) ?? t.cart.singleVariant}
                      </p>
                    </div>
                    <span className="shrink-0 text-base font-medium tabular-nums text-[var(--app-text)]">
                      {formatMoney(line.cost.totalAmount, language)}
                    </span>
                  </div>

                  {!line.merchandise.availableForSale ? (
                    <p className="mt-2 text-sm font-medium text-[var(--app-danger)]">
                      {t.cart.variantUnavailable}
                    </p>
                  ) : null}

                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    {t.cart.each(
                      formatMoney(line.cost.amountPerQuantity, language),
                    )}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div
                      aria-label={t.cart.quantityOf(line.merchandise.product.title)}
                      className="quantity-control"
                      role="group"
                    >
                      <button
                        aria-label={t.cart.decrease(line.merchandise.product.title)}
                        disabled={isBusy}
                        onClick={() => decreaseLine(line)}
                        type="button"
                      >
                        −
                      </button>
                      <output
                        aria-live="polite"
                        className="text-center text-base font-medium tabular-nums text-[var(--app-text)]"
                      >
                        {line.quantity}
                      </output>
                      <button
                        aria-label={t.cart.increase(line.merchandise.product.title)}
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
                      aria-label={t.cart.remove(line.merchandise.product.title)}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--app-danger)] transition-colors hover:bg-[var(--app-surface-muted)] disabled:opacity-40"
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

          <aside className="surface-panel p-5 lg:sticky lg:top-5" aria-label={t.cart.summaryLabel}>
            <h2 className="section-heading">{t.cart.summary}</h2>
            <dl className="mt-4 space-y-3 text-base">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--app-muted)]">{t.cart.items}</dt>
                <dd className="font-medium tabular-nums text-[var(--app-text)]">
                  {cart.totalQuantity}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--app-muted)]">{t.cart.subtotal}</dt>
                <dd className="font-medium tabular-nums text-[var(--app-text)]">
                  {formatMoney(cart.cost.subtotalAmount, language)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-[var(--app-line)] pt-3 text-lg">
                <dt className="font-semibold text-[var(--app-text)]">{t.cart.total}</dt>
                <dd className="font-semibold tabular-nums text-[var(--app-text)]">
                  {formatMoney(cart.cost.totalAmount, language)}
                </dd>
              </div>
            </dl>

            {!cart.checkoutUrl?.trim() ? (
              <p
                className="app-alert mt-5"
                role="alert"
              >
                {t.cart.checkoutUnavailable}
              </p>
            ) : null}

          </aside>
        </div>
      )}

      {isMutating ? (
        <p
          className="mt-4 text-center text-sm font-medium text-[var(--app-muted)]"
          role="status"
        >
          {t.cart.updatingCart}
        </p>
      ) : null}
    </div>
  );
}
