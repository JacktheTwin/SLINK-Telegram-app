import {
  ShopifyGraphQLError,
  getStoreHostname,
  shopifyFetch,
  withoutDefaultOption,
  type ShopifyMoney,
  type ShopifyProductImage,
  type ShopifySelectedOption,
} from "@/lib/shopify";
import type { Language } from "@/lib/i18n";

export type ShopifyCartLine = {
  id: string;
  quantity: number;
  cost: {
    amountPerQuantity: ShopifyMoney;
    totalAmount: ShopifyMoney;
  };
  merchandise: {
    id: string;
    title: string;
    availableForSale: boolean;
    image: ShopifyProductImage | null;
    product: {
      title: string;
      handle: string;
    };
    selectedOptions: ShopifySelectedOption[];
  };
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string | null;
  totalQuantity: number;
  lines: {
    nodes: ShopifyCartLine[];
  };
  cost: {
    subtotalAmount: ShopifyMoney;
    totalAmount: ShopifyMoney;
  };
};

export type ShopifyCartLineInput = {
  merchandiseId: string;
  quantity: number;
};

export type ShopifyCartWarning = {
  code: string;
  message: string;
  target: string;
};

export type ShopifyCartOperationResult = {
  cart: ShopifyCart;
  warnings: ShopifyCartWarning[];
};

type ShopifyCartUserError = {
  field: string[] | null;
  message: string;
  code: string | null;
};

type CartMutationPayload = {
  cart: ShopifyCart | null;
  userErrors: ShopifyCartUserError[];
  warnings: ShopifyCartWarning[];
};

type CartQuery = {
  cart: ShopifyCart | null;
};

type CartCreateMutation = {
  cartCreate: CartMutationPayload;
};

type CartLinesAddMutation = {
  cartLinesAdd: CartMutationPayload;
};

type CartLinesUpdateMutation = {
  cartLinesUpdate: CartMutationPayload;
};

type CartLinesRemoveMutation = {
  cartLinesRemove: CartMutationPayload;
};

// `errors` contiene gli userErrors di Shopify, già nella lingua richiesta, che
// l'interfaccia può mostrare.
export class ShopifyCartMutationError extends Error {
  constructor(
    action: string,
    public readonly errors: ShopifyCartUserError[],
  ) {
    super(
      action +
        ": " +
        errors.map((error) => error.message).join("; ") +
        ".",
    );
    this.name = "ShopifyCartMutationError";
  }
}

const CART_FIELDS = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    lines(first: 250) {
      nodes {
        id
        quantity
        cost {
          amountPerQuantity {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            image {
              url
              altText
            }
            product {
              title
              handle
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
  }
`;

const CART_QUERY = `
  ${CART_FIELDS}
  query Cart($id: ID!, $language: LanguageCode)
  @inContext(language: $language) {
    cart(id: $id) {
      ...CartFields
    }
  }
`;

const CART_CREATE_MUTATION = `
  ${CART_FIELDS}
  mutation CartCreate($input: CartInput, $language: LanguageCode)
  @inContext(language: $language) {
    cartCreate(input: $input) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
        code
      }
      warnings {
        code
        message
        target
      }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `
  ${CART_FIELDS}
  mutation CartLinesAdd(
    $cartId: ID!
    $lines: [CartLineInput!]!
    $language: LanguageCode
  ) @inContext(language: $language) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
        code
      }
      warnings {
        code
        message
        target
      }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = `
  ${CART_FIELDS}
  mutation CartLinesUpdate(
    $cartId: ID!
    $lines: [CartLineUpdateInput!]!
    $language: LanguageCode
  ) @inContext(language: $language) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
        code
      }
      warnings {
        code
        message
        target
      }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `
  ${CART_FIELDS}
  mutation CartLinesRemove(
    $cartId: ID!
    $lineIds: [ID!]!
    $language: LanguageCode
  ) @inContext(language: $language) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
        code
      }
      warnings {
        code
        message
        target
      }
    }
  }
`;

function getMutationCart(
  payload: CartMutationPayload,
  action: string,
): ShopifyCartOperationResult {
  if (payload.userErrors.length > 0) {
    throw new ShopifyCartMutationError(action, payload.userErrors);
  }

  if (!payload.cart) {
    // Messaggio interno per i log: l'interfaccia mostra il proprio testo.
    throw new Error(action + ": Shopify non ha restituito il carrello aggiornato.");
  }

  return {
    cart: normalizeCart(payload.cart),
    warnings: payload.warnings,
  };
}

function validateLineInput(line: ShopifyCartLineInput): void {
  if (!line.merchandiseId.trim()) {
    throw new Error("Merchandise ID mancante.");
  }

  if (!Number.isInteger(line.quantity) || line.quantity < 1) {
    throw new Error("La quantità deve essere un numero intero maggiore di zero.");
  }
}

export function isInvalidShopifyCartError(error: unknown): boolean {
  if (!(error instanceof ShopifyGraphQLError)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    (message.includes("cart") || message.includes("id")) &&
    (message.includes("invalid") ||
      message.includes("not found") ||
      message.includes("does not exist"))
  );
}

type ShopDomainQuery = {
  shop: {
    primaryDomain: {
      host: string;
    };
  };
};

const SHOP_DOMAIN_QUERY = `
  query ShopDomain {
    shop {
      primaryDomain {
        host
      }
    }
  }
`;

let checkoutHostsPromise: Promise<string[]> | null = null;

// Host su cui può aprirsi il checkout: il dominio principale dello store
// letto da Shopify e il dominio configurato in NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN.
// Non cambiano durante la sessione: la richiesta parte una volta sola.
export function getCheckoutHosts(): Promise<string[]> {
  checkoutHostsPromise ??= shopifyFetch<ShopDomainQuery>({
    query: SHOP_DOMAIN_QUERY,
  })
    .then((data) => [data.shop.primaryDomain.host, getStoreHostname()])
    .catch((error: unknown) => {
      checkoutHostsPromise = null;
      throw error;
    });

  return checkoutHostsPromise;
}

function normalizeCart(cart: ShopifyCart): ShopifyCart {
  return {
    ...cart,
    lines: {
      nodes: cart.lines.nodes.map((line) => ({
        ...line,
        merchandise: {
          ...line.merchandise,
          selectedOptions: withoutDefaultOption(line.merchandise.selectedOptions),
        },
      })),
    },
  };
}

export async function getCart(
  cartId: string,
  language: Language,
): Promise<ShopifyCart | null> {
  const normalizedCartId = cartId.trim();

  if (!normalizedCartId) {
    return null;
  }

  const data = await shopifyFetch<CartQuery>({
    query: CART_QUERY,
    variables: { id: normalizedCartId, language },
  });

  return data.cart ? normalizeCart(data.cart) : null;
}

export async function createCart(
  lines: ShopifyCartLineInput[],
  language: Language,
): Promise<ShopifyCartOperationResult> {
  lines.forEach(validateLineInput);

  const data = await shopifyFetch<CartCreateMutation>({
    query: CART_CREATE_MUTATION,
    variables: { input: { lines }, language },
  });

  return getMutationCart(data.cartCreate, "Impossibile creare il carrello");
}

export async function addCartLines(
  cartId: string,
  lines: ShopifyCartLineInput[],
  language: Language,
): Promise<ShopifyCartOperationResult> {
  lines.forEach(validateLineInput);

  const data = await shopifyFetch<CartLinesAddMutation>({
    query: CART_LINES_ADD_MUTATION,
    variables: { cartId, lines, language },
  });

  return getMutationCart(
    data.cartLinesAdd,
    "Impossibile aggiungere il prodotto al carrello",
  );
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
  language: Language,
): Promise<ShopifyCartOperationResult> {
  if (!lineId.trim()) {
    throw new Error("Line ID mancante.");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("La quantità deve essere un numero intero maggiore di zero.");
  }

  const data = await shopifyFetch<CartLinesUpdateMutation>({
    query: CART_LINES_UPDATE_MUTATION,
    variables: {
      cartId,
      lines: [{ id: lineId, quantity }],
      language,
    },
  });

  return getMutationCart(
    data.cartLinesUpdate,
    "Impossibile aggiornare la quantità",
  );
}

export async function removeCartLine(
  cartId: string,
  lineId: string,
  language: Language,
): Promise<ShopifyCartOperationResult> {
  if (!lineId.trim()) {
    throw new Error("Line ID mancante.");
  }

  const data = await shopifyFetch<CartLinesRemoveMutation>({
    query: CART_LINES_REMOVE_MUTATION,
    variables: { cartId, lineIds: [lineId], language },
  });

  return getMutationCart(
    data.cartLinesRemove,
    "Impossibile rimuovere il prodotto",
  );
}
