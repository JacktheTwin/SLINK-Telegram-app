"use client";

import { useCart } from "@/components/cart-provider";
import { useI18n } from "@/components/language-provider";
import { formatMoney } from "@/lib/i18n";
import type {
  ShopifyProductOption,
  ShopifyProductVariant,
} from "@/lib/shopify";
import Link from "next/link";
import { useState } from "react";

type ProductVariantSelectorProps = {
  options: ShopifyProductOption[];
  variants: ShopifyProductVariant[];
};

function getInitialSelections(
  variants: ShopifyProductVariant[],
): Record<string, string> {
  const initialVariant =
    variants.find((variant) => variant.availableForSale) ?? variants[0];

  if (!initialVariant) {
    return {};
  }

  return Object.fromEntries(
    initialVariant.selectedOptions.map((option) => [option.name, option.value]),
  );
}

function matchesSelections(
  variant: ShopifyProductVariant,
  selections: Record<string, string>,
): boolean {
  return variant.selectedOptions.every(
    (option) => selections[option.name] === option.value,
  );
}

export function ProductVariantSelector({
  options,
  variants,
}: ProductVariantSelectorProps) {
  const {
    addVariant,
    cart,
    error: cartError,
    isInitializing,
    isMutating,
    notice: cartNotice,
  } = useCart();
  const { language, t } = useI18n();
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    getInitialSelections(variants),
  );
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null);
  const selectedVariant =
    variants.find((variant) => matchesSelections(variant, selections)) ?? null;

  function selectOption(name: string, value: string) {
    setAddedVariantId(null);
    setSelections((currentSelections) => ({
      ...currentSelections,
      [name]: value,
    }));
  }

  async function addSelectedVariant() {
    if (!selectedVariant?.availableForSale) {
      return;
    }

    const wasAdded = await addVariant(selectedVariant.id);
    setAddedVariantId(wasAdded ? selectedVariant.id : null);
  }

  function isOptionValueAvailable(optionName: string, value: string): boolean {
    const candidateSelections = {
      ...selections,
      [optionName]: value,
    };

    return variants.some(
      (variant) =>
        variant.availableForSale &&
        matchesSelections(variant, candidateSelections),
    );
  }

  return (
    <div className="mt-6 border-t border-[var(--app-line)] pt-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {selectedVariant ? (
          <>
            <span className="text-2xl font-medium tracking-tight tabular-nums text-[var(--app-text)]">
              {formatMoney(selectedVariant.price, language)}
            </span>
            {selectedVariant.compareAtPrice ? (
              <span className="text-sm text-[var(--app-muted)] line-through">
                {formatMoney(selectedVariant.compareAtPrice, language)}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-sm font-semibold text-[var(--app-muted)]">
            {t.product.priceUnavailable}
          </span>
        )}
      </div>

      {options.length > 0 ? (
        <div className="mt-6 space-y-5">
          {options.map((option) => (
            <fieldset key={option.id}>
              <legend className="field-label">
                {option.name}
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const isSelected = selections[option.name] === value;
                  const isAvailable = isOptionValueAvailable(
                    option.name,
                    value,
                  );

                  return (
                    <button
                      aria-pressed={isSelected}
                      className="option-chip"
                      disabled={isMutating || !isAvailable}
                      key={value}
                      onClick={() => selectOption(option.name, value)}
                      type="button"
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <p className="text-sm leading-5 text-[var(--app-muted)]">
            {t.product.unavailableOptionsHint}
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        {/* Con una sola variante la riga non aggiunge informazioni. */}
        {options.length > 0 ? (
          <p className="mb-1 text-sm text-[var(--app-muted)]">
            {t.product.variant}{" "}
            {selectedVariant
              ? selectedVariant.title
              : t.product.noMatchingVariant}
          </p>
        ) : null}

        <p
          aria-live="polite"
          className={`text-sm font-medium ${
            selectedVariant?.availableForSale
              ? "text-[var(--action-text)]"
              : "text-[var(--app-danger)]"
          }`}
        >
          {!selectedVariant
            ? t.product.combinationUnavailable
            : selectedVariant.availableForSale
              ? t.product.available
              : t.product.variantSoldOut}
        </p>

        <button
          className="app-cta mt-5 w-full"
          data-merchandise-id={selectedVariant?.id}
          disabled={
            !selectedVariant?.availableForSale ||
            isInitializing ||
            isMutating
          }
          onClick={() => void addSelectedVariant()}
          type="button"
        >
          {isInitializing
            ? t.product.cartLoading
            : isMutating
              ? t.product.updating
              : t.product.addToCart}
        </button>

        {cartError ? (
          <p className="app-alert mt-3" role="alert">
            {cartError}
          </p>
        ) : null}

        {cartNotice ? (
          <p className="app-notice mt-3" role="status">
            {cartNotice}
          </p>
        ) : null}

        {addedVariantId === selectedVariant?.id ? (
          <p className="app-notice mt-3" role="status">
            {t.product.added}{" "}
            <Link className="text-action underline" href="/cart">
              {t.product.openCart}
              {cart && cart.totalQuantity > 0
                ? ` (${cart.totalQuantity})`
                : ""}
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
