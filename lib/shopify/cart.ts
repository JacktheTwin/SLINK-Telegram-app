import {
  ShopifyGraphQLError,
  shopifyFetch,
  type ShopifyMoney,
  type ShopifyProductImage,
  type ShopifySelectedOption,
} from "@/lib/shopify";

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
  query Cart($id: ID!) {
    cart(id: $id) {
      ...CartFields
    }
  }
`;

const CART_CREATE_MUTATION = `
  ${CART_FIELDS}
  mutation CartCreate($input: CartInput) {
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
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
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
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
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
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
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
    throw new ShopifyCartMutationError(action, [
      {
        field: null,
        message: "Shopify non ha restituito il carrello aggiornato",
        code: null,
      },
    ]);
  }

  return {
    cart: payload.cart,
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

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const normalizedCartId = cartId.trim();

  if (!normalizedCartId) {
    return null;
  }

  const data = await shopifyFetch<CartQuery>({
    query: CART_QUERY,
    variables: { id: normalizedCartId },
  });

  return data.cart;
}

export async function createCart(
  lines: ShopifyCartLineInput[],
): Promise<ShopifyCartOperationResult> {
  lines.forEach(validateLineInput);

  const data = await shopifyFetch<CartCreateMutation>({
    query: CART_CREATE_MUTATION,
    variables: { input: { lines } },
  });

  return getMutationCart(data.cartCreate, "Impossibile creare il carrello");
}

export async function addCartLines(
  cartId: string,
  lines: ShopifyCartLineInput[],
): Promise<ShopifyCartOperationResult> {
  lines.forEach(validateLineInput);

  const data = await shopifyFetch<CartLinesAddMutation>({
    query: CART_LINES_ADD_MUTATION,
    variables: { cartId, lines },
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
): Promise<ShopifyCartOperationResult> {
  if (!lineId.trim()) {
    throw new Error("Line ID mancante.");
  }

  const data = await shopifyFetch<CartLinesRemoveMutation>({
    query: CART_LINES_REMOVE_MUTATION,
    variables: { cartId, lineIds: [lineId] },
  });

  return getMutationCart(
    data.cartLinesRemove,
    "Impossibile rimuovere il prodotto",
  );
}
