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
    <div className="mt-6 border-t border-neutral-200 pt-6">
      {selectableOptions.length > 0 ? (
        <div className="space-y-5">
          {selectableOptions.map((option) => (
            <fieldset key={option.id}>
              <legend className="text-sm font-medium text-neutral-900">
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
                      className={`rounded-lg border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                        isSelected
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : isAvailable
                            ? "border-neutral-300 bg-white text-neutral-900"
                            : "border-neutral-200 bg-neutral-50 text-neutral-400 line-through"
                      }`}
                      disabled={isMutating}
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

          <p className="text-xs text-neutral-500">
            Le opzioni barrate non sono disponibili con la selezione corrente.
          </p>
        </div>
      ) : null}

      <div className="mt-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {selectedVariant ? (
            <>
              <span className="text-2xl font-semibold text-neutral-900">
                {formatMoney(selectedVariant.price)}
              </span>
              {selectedVariant.compareAtPrice ? (
                <span className="text-base text-neutral-500 line-through">
                  {formatMoney(selectedVariant.compareAtPrice)}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-sm font-medium text-neutral-600">
              Prezzo non disponibile
            </span>
          )}
        </div>

        <p className="mt-3 text-sm text-neutral-600">
          Variante: {" "}
          {selectedVariant
            ? selectedVariant.title === "Default Title"
              ? "Unica"
              : selectedVariant.title
            : "Nessuna variante corrispondente"}
        </p>

        <p
          aria-live="polite"
          className={`mt-1 text-sm font-medium ${
            selectedVariant?.availableForSale
              ? "text-emerald-700"
              : "text-red-700"
          }`}
        >
          {!selectedVariant
            ? "Combinazione non disponibile"
            : selectedVariant.availableForSale
              ? "Disponibile"
              : "Variante esaurita"}
        </p>

        <button
          className="mt-5 w-full rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-600"
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
          <p className="mt-3 text-sm text-red-700" role="alert">
            {cartError}
          </p>
        ) : null}

        {cartNotice ? (
          <p className="mt-3 text-sm text-amber-800" role="status">
            {cartNotice}
          </p>
        ) : null}

        {addedVariantId === selectedVariant?.id ? (
          <p className="mt-3 text-sm text-emerald-700" role="status">
            Prodotto aggiunto. {" "}
            <Link className="font-semibold underline" href="/cart">
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
