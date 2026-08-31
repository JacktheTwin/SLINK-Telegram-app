const REQUIRED_API_VERSION = "2026-07";

type ShopifyConfig = {
  endpoint: string;
  storefrontToken: string;
};

type GraphQLError = {
  message: string;
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLError[];
};

type ShopifyFetchOptions = {
  query: string;
  variables?: Record<string, unknown>;
};

export type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

export type ShopifyProductImage = {
  url: string;
  altText: string | null;
};

export type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  availableForSale: boolean;
  featuredImage: ShopifyProductImage | null;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
};

export type ShopifyProductOption = {
  id: string;
  name: string;
  values: string[];
};

export type ShopifySelectedOption = {
  name: string;
  value: string;
};

export type ShopifyProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  selectedOptions: ShopifySelectedOption[];
};

export type ShopifyProductDetail = {
  id: string;
  title: string;
  handle: string;
  description: string;
  availableForSale: boolean;
  images: ShopifyProductImage[];
  options: ShopifyProductOption[];
  variants: ShopifyProductVariant[];
};

type ProductNode = {
  id: string;
  title: string;
  handle: string;
  availableForSale: boolean;
  featuredImage: ShopifyProductImage | null;
  priceRange: {
    minVariantPrice: ShopifyMoney;
  };
  compareAtPriceRange: {
    minVariantPrice: ShopifyMoney;
  };
};

type ProductsQuery = {
  products: {
    nodes: ProductNode[];
  };
};

type ProductOptionNode = {
  id: string;
  name: string;
  optionValues: Array<{
    name: string;
  }>;
};

type ProductVariantNode = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  selectedOptions: ShopifySelectedOption[];
};

type ProductDetailNode = {
  id: string;
  title: string;
  handle: string;
  description: string;
  availableForSale: boolean;
  images: {
    nodes: ShopifyProductImage[];
  };
  options: ProductOptionNode[];
  variants: {
    nodes: ProductVariantNode[];
  };
};

type ProductQuery = {
  product: ProductDetailNode | null;
};

export class ShopifyConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyConfigurationError";
  }
}

export class ShopifyHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
  ) {
    super("Shopify ha risposto con errore HTTP " + status + " " + statusText + ".");
    this.name = "ShopifyHttpError";
  }
}

export class ShopifyGraphQLError extends Error {
  constructor(public readonly errors: GraphQLError[]) {
    super(
      "Shopify ha restituito errori GraphQL: " +
        errors.map((error) => error.message).join("; "),
    );
    this.name = "ShopifyGraphQLError";
  }
}

function getShopifyConfig(): ShopifyConfig {
  const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim();
  const storefrontToken =
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN?.trim();
  const apiVersion = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION?.trim();

  if (!storeDomain || !storefrontToken || !apiVersion) {
    const missingVariables = [
      ["NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN", storeDomain],
      ["NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN", storefrontToken],
      ["NEXT_PUBLIC_SHOPIFY_API_VERSION", apiVersion],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    throw new ShopifyConfigurationError(
      "Configurazione Shopify mancante: " + missingVariables.join(", ") + ".",
    );
  }

  if (apiVersion !== REQUIRED_API_VERSION) {
    throw new ShopifyConfigurationError(
      "Versione Shopify non valida: usa " + REQUIRED_API_VERSION + ".",
    );
  }

  let hostname: string;

  try {
    const storeUrl = storeDomain.startsWith("http")
      ? storeDomain
      : "https://" + storeDomain;
    hostname = new URL(storeUrl).hostname;
  } catch {
    throw new ShopifyConfigurationError(
      "NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN non contiene un dominio valido.",
    );
  }

  return {
    endpoint:
      "https://" + hostname + "/api/" + apiVersion + "/graphql.json",
    storefrontToken,
  };
}

export async function shopifyFetch<TData>({
  query,
  variables,
}: ShopifyFetchOptions): Promise<TData> {
  const config = getShopifyConfig();
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": config.storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ShopifyHttpError(response.status, response.statusText);
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;

  if (payload.errors && payload.errors.length > 0) {
    throw new ShopifyGraphQLError(payload.errors);
  }

  if (!payload.data) {
    throw new ShopifyGraphQLError([
      { message: "La risposta Shopify non contiene dati." },
    ]);
  }

  return payload.data;
}

const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        title
        handle
        availableForSale
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

const PRODUCT_QUERY = `
  query Product($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      availableForSale
      images(first: 12) {
        nodes {
          url
          altText
        }
      }
      options {
        id
        name
        optionValues {
          name
        }
      }
      variants(first: 250) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

function getCompareAtPrice(
  price: ShopifyMoney,
  compareAtPrice: ShopifyMoney | null,
): ShopifyMoney | null {
  if (!compareAtPrice) {
    return null;
  }

  const priceAmount = Number.parseFloat(price.amount);
  const compareAtAmount = Number.parseFloat(compareAtPrice.amount);

  if (
    compareAtPrice.currencyCode !== price.currencyCode ||
    !Number.isFinite(priceAmount) ||
    !Number.isFinite(compareAtAmount) ||
    compareAtAmount <= priceAmount
  ) {
    return null;
  }

  return compareAtPrice;
}

export async function getProducts(): Promise<ShopifyProduct[]> {
  const data = await shopifyFetch<ProductsQuery>({
    query: PRODUCTS_QUERY,
    variables: { first: 12 },
  });

  return data.products.nodes.map((product) => {
    const price = product.priceRange.minVariantPrice;

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      availableForSale: product.availableForSale,
      featuredImage: product.featuredImage,
      price,
      compareAtPrice: getCompareAtPrice(
        price,
        product.compareAtPriceRange.minVariantPrice,
      ),
    };
  });
}

export async function getProductByHandle(
  handle: string,
): Promise<ShopifyProductDetail | null> {
  const normalizedHandle = handle.trim();

  if (!normalizedHandle) {
    return null;
  }

  const data = await shopifyFetch<ProductQuery>({
    query: PRODUCT_QUERY,
    variables: { handle: normalizedHandle },
  });

  if (!data.product) {
    return null;
  }

  const product = data.product;

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: product.description,
    availableForSale: product.availableForSale,
    images: product.images.nodes,
    options: product.options.map((option) => ({
      id: option.id,
      name: option.name,
      values: option.optionValues.map((value) => value.name),
    })),
    variants: product.variants.nodes.map((variant) => ({
      id: variant.id,
      title: variant.title,
      availableForSale: variant.availableForSale,
      price: variant.price,
      compareAtPrice: getCompareAtPrice(
        variant.price,
        variant.compareAtPrice,
      ),
      selectedOptions: variant.selectedOptions,
    })),
  };
}
