"use client";

import {
  addCartLines,
  createCart,
  getCart,
  isInvalidShopifyCartError,
  removeCartLine,
  updateCartLine,
  type ShopifyCart,
  type ShopifyCartOperationResult,
  type ShopifyCartWarning,
} from "@/lib/shopify/cart";
import { openCheckout } from "@/lib/shopify/checkout";
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

function getReadableError(error: unknown, fallback: string): string {
  if (error instanceof TypeError) {
    return fallback + " Controlla la connessione e riprova.";
  }

  return error instanceof Error ? error.message : fallback;
}

function getWarningMessage(warnings: ShopifyCartWarning[]): string {
  const messages = warnings.map((warning) => {
    switch (warning.code) {
      case "MERCHANDISE_NOT_ENOUGH_STOCK":
        return "La quantità richiesta supera lo stock disponibile. Shopify ha mantenuto la quantità massima acquistabile.";
      case "MERCHANDISE_OUT_OF_STOCK":
        return "Un prodotto nel carrello è esaurito. Rimuovilo prima di continuare.";
      default:
        return "Shopify ha aggiornato il carrello con un avviso: " + warning.message;
    }
  });

  return Array.from(new Set(messages)).join(" ");
}

async function recoverCartAfterError(
  cartId: string,
): Promise<ShopifyCart | null | undefined> {
  try {
    return await getCart(cartId);
  } catch (error: unknown) {
    return isInvalidShopifyCartError(error) ? null : undefined;
  }
}

export function CartProvider({ children }: CartProviderProps) {
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
      setError(
        "Il carrello è stato aggiornato, ma il browser non ha potuto salvarne l'identificatore.",
      );
    }
  }, []);

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
        setNotice(getWarningMessage(result.warnings));
      }
    },
    [storeCart],
  );

  const refreshCart = useCallback(async () => {
    setIsInitializing(true);

    let storedCartId: string | null = null;

    try {
      storedCartId = window.localStorage.getItem(CART_STORAGE_KEY)?.trim() || null;
    } catch {
      setCart(null);
      setError("Il browser non permette di leggere il carrello salvato.");
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
      const remoteCart = await getCart(storedCartId);

      if (!remoteCart) {
        clearStoredCart(
          "Il carrello salvato non è più disponibile. Puoi iniziarne uno nuovo.",
        );
      } else {
        storeCart(remoteCart);
      }
    } catch (loadError: unknown) {
      if (isInvalidShopifyCartError(loadError)) {
        clearStoredCart(
          "Il carrello salvato non è più valido. Puoi iniziarne uno nuovo.",
        );
      } else {
        setError(
          getReadableError(
            loadError,
            "Non è stato possibile recuperare il carrello da Shopify.",
          ),
        );
      }
    } finally {
      setIsInitializing(false);
    }
  }, [clearStoredCart, storeCart]);

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
          result = await createCart([line]);
        } else {
          try {
            result = await addCartLines(cart.id, [line]);
          } catch (mutationError: unknown) {
            const recoveredCart = await recoverCartAfterError(cart.id);

            if (recoveredCart !== null) {
              if (recoveredCart) {
                storeCart(recoveredCart);
              }

              throw mutationError;
            }

            clearStoredCart();
            result = await createCart([line]);
          }
        }

        applyCartResult(result);
        return result.warnings.length === 0;
      } catch (mutationError: unknown) {
        setError(
          getReadableError(
            mutationError,
            "Non è stato possibile aggiungere il prodotto al carrello.",
          ),
        );
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [
      applyCartResult,
      cart,
      clearStoredCart,
      isInitializing,
      isMutating,
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
        const result = await updateCartLine(cart.id, lineId, quantity);
        applyCartResult(result);
        return result.warnings.length === 0;
      } catch (mutationError: unknown) {
        const recoveredCart = await recoverCartAfterError(cart.id);

        if (recoveredCart === null) {
          clearStoredCart(
            "Il carrello non è più disponibile. Puoi iniziarne uno nuovo.",
          );
        } else {
          if (recoveredCart) {
            storeCart(recoveredCart);
          }

          setError(
            getReadableError(
              mutationError,
              "Non è stato possibile aggiornare la quantità.",
            ),
          );
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
      isInitializing,
      isMutating,
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
        const result = await removeCartLine(cart.id, lineId);
        applyCartResult(result);
        return result.warnings.length === 0;
      } catch (mutationError: unknown) {
        const recoveredCart = await recoverCartAfterError(cart.id);

        if (recoveredCart === null) {
          clearStoredCart(
            "Il carrello non è più disponibile. Puoi iniziarne uno nuovo.",
          );
        } else {
          if (recoveredCart) {
            storeCart(recoveredCart);
          }

          setError(
            getReadableError(
              mutationError,
              "Non è stato possibile rimuovere il prodotto.",
            ),
          );
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
      isInitializing,
      isMutating,
      storeCart,
    ],
  );

  const prepareCheckout = useCallback(async (): Promise<string | null> => {
    if (!cart || cart.totalQuantity < 1 || cart.lines.nodes.length === 0) {
      setError(
        "Il carrello è vuoto. Aggiungi almeno un prodotto prima del checkout.",
      );
      return null;
    }

    if (isInitializing || isMutating) {
      return null;
    }

    setError(null);
    setNotice(null);

    try {
      const remoteCart = await getCart(cart.id);

      if (!remoteCart) {
        clearStoredCart(
          "Il carrello non è più disponibile. Puoi iniziarne uno nuovo.",
        );
        return null;
      }

      storeCart(remoteCart);

      if (
        remoteCart.totalQuantity < 1 ||
        remoteCart.lines.nodes.length === 0
      ) {
        setError(
          "Il carrello è vuoto. Aggiungi almeno un prodotto prima del checkout.",
        );
        return null;
      }

      const checkoutUrl = remoteCart.checkoutUrl?.trim();

      if (!checkoutUrl) {
        setError(
          "Shopify non ha restituito l'indirizzo del checkout. Riprova tra poco.",
        );
        return null;
      }

      return checkoutUrl;
    } catch (checkoutError: unknown) {
      if (isInvalidShopifyCartError(checkoutError)) {
        clearStoredCart(
          "Il carrello non è più valido. Puoi iniziarne uno nuovo.",
        );
      } else {
        setError(
          getReadableError(
            checkoutError,
            "Non è stato possibile preparare il checkout Shopify.",
          ),
        );
      }

      return null;
    }
  }, [
    cart,
    clearStoredCart,
    isInitializing,
    isMutating,
    storeCart,
  ]);

  const checkout = useCallback(async (): Promise<void> => {
    if (checkoutLockRef.current) {
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
    } catch (checkoutError: unknown) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Non è stato possibile aprire il checkout Shopify.",
      );
      checkoutLockRef.current = false;
      setIsCheckingOut(false);
    }
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
