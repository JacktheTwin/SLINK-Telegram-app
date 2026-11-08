"use client";

import { useI18n } from "@/components/language-provider";
import type { Language, Messages } from "@/lib/i18n";
import {
  ShopifyCartMutationError,
  addCartLines,
  createCart,
  getCart,
  getCheckoutHosts,
  isInvalidShopifyCartError,
  removeCartLine,
  updateCartLine,
  type ShopifyCart,
  type ShopifyCartOperationResult,
  type ShopifyCartWarning,
} from "@/lib/shopify/cart";
import { isTrustedCheckoutUrl, openCheckout } from "@/lib/shopify/checkout";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const CART_STORAGE_KEY = "slinklab_cart_id";

type CartContextValue = {
  cart: ShopifyCart | null;
  error: string | null;
  notice: string | null;
  isInitializing: boolean;
  isCheckingOut: boolean;
  isMutating: boolean;
  addVariant: (merchandiseId: string, quantity?: number) => Promise<boolean>;
  checkout: () => Promise<void>;
  updateLineQuantity: (lineId: string, quantity: number) => Promise<boolean>;
  removeLine: (lineId: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
};

type CartProviderProps = {
  children: ReactNode;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartErrorMessages = Messages["cartErrors"];

function getReadableError(
  error: unknown,
  fallback: string,
  connectionHint: string,
): string {
  if (error instanceof TypeError) {
    return fallback + " " + connectionHint;
  }

  // I messaggi degli userErrors arrivano da Shopify nella lingua richiesta.
  if (error instanceof ShopifyCartMutationError) {
    return [fallback, ...error.errors.map((item) => item.message)].join(" ");
  }

  return fallback;
}

function getWarningMessage(
  warnings: ShopifyCartWarning[],
  errors: CartErrorMessages,
): string {
  const messages = warnings.map((warning) => {
    switch (warning.code) {
      case "MERCHANDISE_NOT_ENOUGH_STOCK":
        return errors.notEnoughStock;
      case "MERCHANDISE_OUT_OF_STOCK":
        return errors.outOfStock;
      default:
        return errors.warning(warning.message);
    }
  });

  return Array.from(new Set(messages)).join(" ");
}

async function recoverCartAfterError(
  cartId: string,
  language: Language,
): Promise<ShopifyCart | null | undefined> {
  try {
    return await getCart(cartId, language);
  } catch (error: unknown) {
    return isInvalidShopifyCartError(error) ? null : undefined;
  }
}

export function CartProvider({ children }: CartProviderProps) {
  const { language, t } = useI18n();
  const errors = t.cartErrors;
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const checkoutLockRef = useRef(false);

  const storeCart = useCallback((nextCart: ShopifyCart) => {
    setCart(nextCart);
    setError(null);
    setNotice(null);

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, nextCart.id);
    } catch {
      setError(errors.storeIdFailed);
    }
  }, [errors]);

  const clearStoredCart = useCallback((message?: string) => {
    setCart(null);
    setError(null);

    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Il carrello in memoria viene comunque azzerato in modo sicuro.
    }

    setNotice(message ?? null);
  }, []);

  const applyCartResult = useCallback(
    (result: ShopifyCartOperationResult) => {
      storeCart(result.cart);

      if (result.warnings.length > 0) {
        setNotice(getWarningMessage(result.warnings, errors));
      }
    },
    [errors, storeCart],
  );

  const refreshCart = useCallback(async () => {
    setIsInitializing(true);

    let storedCartId: string | null = null;

    try {
      storedCartId = window.localStorage.getItem(CART_STORAGE_KEY)?.trim() || null;
    } catch {
      setCart(null);
      setError(errors.readFailed);
      setNotice(null);
      setIsInitializing(false);
      return;
    }

    if (!storedCartId) {
      setCart(null);
      setError(null);
      setNotice(null);
      setIsInitializing(false);
      return;
    }

    try {
      const remoteCart = await getCart(storedCartId, language);

      if (!remoteCart) {
        clearStoredCart(errors.savedUnavailable);
      } else {
        storeCart(remoteCart);
      }
    } catch (loadError: unknown) {
      if (isInvalidShopifyCartError(loadError)) {
        clearStoredCart(errors.savedInvalid);
      } else {
        setError(getReadableError(loadError, errors.loadFailed, errors.connection));
      }
    } finally {
      setIsInitializing(false);
    }
  }, [clearStoredCart, errors, language, storeCart]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshCart();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshCart]);

  const addVariant = useCallback(
    async (merchandiseId: string, quantity = 1): Promise<boolean> => {
      if (isInitializing || isMutating) {
        return false;
      }

      setIsMutating(true);
      setError(null);
      setNotice(null);

      try {
        const line = { merchandiseId, quantity };
        let result: ShopifyCartOperationResult;

        if (!cart) {
          result = await createCart([line], language);
        } else {
          try {
            result = await addCartLines(cart.id, [line], language);
          } catch (mutationError: unknown) {
            const recoveredCart = await recoverCartAfterError(cart.id, language);

            if (recoveredCart !== null) {
              if (recoveredCart) {
                storeCart(recoveredCart);
              }

              throw mutationError;
            }

            clearStoredCart();
            result = await createCart([line], language);
          }
        }

        applyCartResult(result);
        return result.warnings.length === 0;
      } catch (mutationError: unknown) {
        setError(getReadableError(mutationError, errors.addFailed, errors.connection));
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [
      applyCartResult,
      cart,
      clearStoredCart,
      errors,
      isInitializing,
      isMutating,
      language,
      storeCart,
    ],
  );

  const updateLineQuantity = useCallback(
    async (lineId: string, quantity: number): Promise<boolean> => {
      if (!cart || isInitializing || isMutating) {
        return false;
      }

      setIsMutating(true);
      setError(null);
      setNotice(null);

      try {
        const result = await updateCartLine(cart.id, lineId, quantity, language);
        applyCartResult(result);
        return result.warnings.length === 0;
      } catch (mutationError: unknown) {
        const recoveredCart = await recoverCartAfterError(cart.id, language);

        if (recoveredCart === null) {
          clearStoredCart(errors.unavailable);
        } else {
          if (recoveredCart) {
            storeCart(recoveredCart);
          }

          setError(getReadableError(mutationError, errors.updateFailed, errors.connection));
        }

        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [
      applyCartResult,
      cart,
      clearStoredCart,
      errors,
      isInitializing,
      isMutating,
      language,
      storeCart,
    ],
  );

  const removeLine = useCallback(
    async (lineId: string): Promise<boolean> => {
      if (!cart || isInitializing || isMutating) {
        return false;
      }

      setIsMutating(true);
      setError(null);
      setNotice(null);

      try {
        const result = await removeCartLine(cart.id, lineId, language);
        applyCartResult(result);
        return result.warnings.length === 0;
      } catch (mutationError: unknown) {
        const recoveredCart = await recoverCartAfterError(cart.id, language);

        if (recoveredCart === null) {
          clearStoredCart(errors.unavailable);
        } else {
          if (recoveredCart) {
            storeCart(recoveredCart);
          }

          setError(getReadableError(mutationError, errors.removeFailed, errors.connection));
        }

        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [
      applyCartResult,
      cart,
      clearStoredCart,
      errors,
      isInitializing,
      isMutating,
      language,
      storeCart,
    ],
  );

  const prepareCheckout = useCallback(async (): Promise<string | null> => {
    if (!cart || cart.totalQuantity < 1 || cart.lines.nodes.length === 0) {
      setError(errors.empty);
      return null;
    }

    if (isInitializing || isMutating) {
      return null;
    }

    setError(null);
    setNotice(null);

    try {
      const [remoteCart, trustedHosts] = await Promise.all([
        getCart(cart.id, language),
        getCheckoutHosts(),
      ]);

      if (!remoteCart) {
        clearStoredCart(errors.unavailable);
        return null;
      }

      storeCart(remoteCart);

      if (
        remoteCart.totalQuantity < 1 ||
        remoteCart.lines.nodes.length === 0
      ) {
        setError(errors.empty);
        return null;
      }

      const checkoutUrl = remoteCart.checkoutUrl?.trim();

      if (!checkoutUrl) {
        setError(errors.noCheckoutUrl);
        return null;
      }

      if (!isTrustedCheckoutUrl(checkoutUrl, trustedHosts)) {
        console.error("Checkout URL non attendibile:", checkoutUrl);
        setError(errors.checkoutFailed);
        return null;
      }

      return checkoutUrl;
    } catch (checkoutError: unknown) {
      if (isInvalidShopifyCartError(checkoutError)) {
        clearStoredCart(errors.invalid);
      } else {
        setError(getReadableError(checkoutError, errors.checkoutFailed, errors.connection));
      }

      return null;
    }
  }, [
    cart,
    clearStoredCart,
    errors,
    isInitializing,
    isMutating,
    language,
    storeCart,
  ]);

  const checkout = useCallback(async (): Promise<void> => {
    if (checkoutLockRef.current) {
      return;
    }

    checkoutLockRef.current = true;
    setIsCheckingOut(true);

    const checkoutUrl = await prepareCheckout();

    if (!checkoutUrl) {
      checkoutLockRef.current = false;
      setIsCheckingOut(false);
      return;
    }

    openCheckout(checkoutUrl);
  }, [prepareCheckout]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      error,
      notice,
      isInitializing,
      isCheckingOut,
      isMutating,
      addVariant,
      checkout,
      updateLineQuantity,
      removeLine,
      refreshCart,
    }),
    [
      addVariant,
      cart,
      checkout,
      error,
      isCheckingOut,
      isInitializing,
      isMutating,
      notice,
      refreshCart,
      removeLine,
      updateLineQuantity,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart deve essere usato all'interno di CartProvider.");
  }

  return context;
}
