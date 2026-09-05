"use client";

import { useCart } from "@/components/cart-provider";
import type {
  ShopifyMoney,
  ShopifyProductOption,
  ShopifyProductVariant,
} from "@/lib/shopify";
import Link from "next/link";
import { useState } from "react";

type ProductVariantSelectorProps = {
  options: ShopifyProductOption[];
  variants: ShopifyProductVariant[];
};

function formatMoney(money: ShopifyMoney): string {
  return new Intl.NumberFormat("it-CH", {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number.parseFloat(money.amount));
}

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
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    getInitialSelections(variants),
  );
  const [addedVariantId, setAddedVariantId] = useState<string | null>(null);
  const selectedVariant =
    variants.find((variant) => matchesSelections(variant, selections)) ?? null;
  const selectableOptions = options.filter(
    (option) =>
      !(
        option.name === "Title" &&
        option.values.length === 1 &&
        option.values[0] === "Default Title"
      ),
  );

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
            <span className="text-2xl font-extrabold tracking-tight text-[var(--app-text)]">
              {formatMoney(selectedVariant.price)}
            </span>
            {selectedVariant.compareAtPrice ? (
              <span className="text-sm text-[var(--app-muted)] line-through">
                {formatMoney(selectedVariant.compareAtPrice)}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-sm font-semibold text-[var(--app-muted)]">
            Prezzo non disponibile
          </span>
        )}
      </div>

      {selectableOptions.length > 0 ? (
        <div className="mt-6 space-y-5">
          {selectableOptions.map((option) => (
            <fieldset key={option.id}>
              <legend className="text-xs font-extrabold tracking-[0.08em] text-[var(--app-text)] uppercase">
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

          <p className="text-xs leading-5 text-[var(--app-muted)]">
            Le opzioni barrate non sono disponibili con la selezione corrente.
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <p className="text-xs text-[var(--app-muted)]">
          Variante: {" "}
          {selectedVariant
            ? selectedVariant.title === "Default Title"
              ? "Unica"
              : selectedVariant.title
            : "Nessuna variante corrispondente"}
        </p>

        <p
          aria-live="polite"
          className={`mt-1 text-xs font-bold ${
            selectedVariant?.availableForSale
              ? "text-[var(--brand)]"
              : "text-[var(--app-danger)]"
          }`}
        >
          {!selectedVariant
            ? "Combinazione non disponibile"
            : selectedVariant.availableForSale
              ? "Disponibile"
              : "Variante esaurita"}
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
            ? "Caricamento carrello..."
            : isMutating
              ? "Aggiornamento..."
              : "Aggiungi al carrello"}
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
            Prodotto aggiunto. {" "}
            <Link className="text-action underline" href="/cart">
              Apri il carrello
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
