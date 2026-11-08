import { LANGUAGES, type Language } from "@/lib/i18n";

const REQUIRED_API_VERSION = "2026-07";

type ShopifyConfig = {
  endpoint: string;
  hostname: string;
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
  priceVaries: boolean;
  compareAtPrice: ShopifyMoney | null;
};

export type ShopifyCollection = {
  // Parte numerica del GID: stabile in tutte le lingue, a differenza
  // dell'handle che Shopify traduce.
  id: string;
  title: string;
  image: ShopifyProductImage | null;
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
  vendor: string;
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
    maxVariantPrice: ShopifyMoney;
  };
  variants: {
    nodes: Array<{
      price: ShopifyMoney;
      compareAtPrice: ShopifyMoney | null;
    }>;
    pageInfo: {
      hasNextPage: boolean;
    };
  };
};

type ProductsQuery = {
  products: {
    nodes: ProductNode[];
  };
};

type CollectionProductsQuery = {
  collection: {
    products: {
      nodes: ProductNode[];
    };
  } | null;
};

type CollectionsQuery = {
  collections: {
    nodes: Array<{
      id: string;
      handle: string;
      title: string;
      image: ShopifyProductImage | null;
      products: {
        nodes: Array<{ id: string }>;
      };
    }>;
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
  vendor: string;
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

// Valore dell'unica opzione dei prodotti senza varianti. Shopify ne traduce il
// nome ("Title", "Titolo"...) ma non il valore: le opzioni con questo valore
// vengono tolte qui, così i componenti non devono conoscerlo.
const DEFAULT_VARIANT_VALUE = "Default Title";

export function withoutDefaultOption(
  options: ShopifySelectedOption[],
): ShopifySelectedOption[] {
  return options.filter((option) => option.value !== DEFAULT_VARIANT_VALUE);
}

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
    hostname,
    storefrontToken,
  };
}

export function getStoreHostname(): string {
  return getShopifyConfig().hostname;
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

const PRODUCT_CARD_FIELDS = `
  fragment ProductCardFields on Product {
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
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 250) {
      nodes {
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

const PRODUCTS_QUERY = `
  ${PRODUCT_CARD_FIELDS}
  query Products($first: Int!, $language: LanguageCode)
  @inContext(language: $language) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...ProductCardFields
      }
    }
  }
`;

const COLLECTION_PRODUCTS_QUERY = `
  ${PRODUCT_CARD_FIELDS}
  query CollectionProducts($id: ID!, $first: Int!, $language: LanguageCode)
  @inContext(language: $language) {
    collection(id: $id) {
      products(first: $first, sortKey: CREATED, reverse: true) {
        nodes {
          ...ProductCardFields
        }
      }
    }
  }
`;

const COLLECTIONS_QUERY = `
  query Collections($language: LanguageCode)
  @inContext(language: $language) {
    collections(first: 20) {
      nodes {
        id
        handle
        title
        image {
          url
          altText
        }
        products(first: 1) {
          nodes {
            id
          }
        }
      }
    }
  }
`;

const PRODUCT_FIELDS = `
  fragment ProductFields on Product {
    id
    title
    handle
    description
    vendor
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
`;

const PRODUCT_BY_HANDLE_QUERY = `
  ${PRODUCT_FIELDS}
  query ProductByHandle($handle: String!, $language: LanguageCode)
  @inContext(language: $language) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
`;

const PRODUCT_BY_ID_QUERY = `
  ${PRODUCT_FIELDS}
  query ProductById($id: ID!, $language: LanguageCode)
  @inContext(language: $language) {
    product(id: $id) {
      ...ProductFields
    }
  }
`;

const PRODUCT_ID_BY_HANDLE_QUERY = `
  query ProductIdByHandle($handle: String!, $language: LanguageCode)
  @inContext(language: $language) {
    product(handle: $handle) {
      id
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

function hasSameMoneyValue(
  first: ShopifyMoney,
  second: ShopifyMoney,
): boolean {
  if (first.currencyCode !== second.currencyCode) {
    return false;
  }

  const firstAmount = Number.parseFloat(first.amount);
  const secondAmount = Number.parseFloat(second.amount);

  return (
    Number.isFinite(firstAmount) &&
    Number.isFinite(secondAmount) &&
    firstAmount === secondAmount
  );
}

function getProductCompareAtPrice(
  product: ProductNode,
  lowestPrice: ShopifyMoney,
): ShopifyMoney | null {
  const variants = product.variants.nodes;

  if (variants.length === 0 || product.variants.pageInfo.hasNextPage) {
    return null;
  }

  const everyVariantIsDiscounted = variants.every(
    (variant) =>
      getCompareAtPrice(variant.price, variant.compareAtPrice) !== null,
  );

  if (!everyVariantIsDiscounted) {
    return null;
  }

  const lowestPriceVariant = variants.find((variant) =>
    hasSameMoneyValue(variant.price, lowestPrice),
  );

  return lowestPriceVariant
    ? getCompareAtPrice(
        lowestPriceVariant.price,
        lowestPriceVariant.compareAtPrice,
      )
    : null;
}

const PRODUCTS_LIMIT = 24;
const COLLECTION_GID_PREFIX = "gid://shopify/Collection/";

function toProductCard(product: ProductNode): ShopifyProduct {
  const price = product.priceRange.minVariantPrice;
  const priceVaries = !hasSameMoneyValue(
    price,
    product.priceRange.maxVariantPrice,
  );

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    availableForSale: product.availableForSale,
    featuredImage: product.featuredImage,
    price,
    priceVaries,
    compareAtPrice: getProductCompareAtPrice(product, price),
  };
}

export async function getProducts(
  language: Language,
  collectionId?: string,
): Promise<ShopifyProduct[]> {
  if (collectionId && /^\d+$/.test(collectionId)) {
    const data = await shopifyFetch<CollectionProductsQuery>({
      query: COLLECTION_PRODUCTS_QUERY,
      variables: {
        id: COLLECTION_GID_PREFIX + collectionId,
        first: PRODUCTS_LIMIT,
        language,
      },
    });

    return (data.collection?.products.nodes ?? []).map(toProductCard);
  }

  const data = await shopifyFetch<ProductsQuery>({
    query: PRODUCTS_QUERY,
    variables: { first: PRODUCTS_LIMIT, language },
  });

  return data.products.nodes.map(toProductCard);
}

// Collezioni da mostrare come categorie: esclude quelle vuote e "all", la
// collezione automatica di Shopify che contiene già tutti i prodotti.
export async function getCollections(
  language: Language,
): Promise<ShopifyCollection[]> {
  const data = await shopifyFetch<CollectionsQuery>({
    query: COLLECTIONS_QUERY,
    variables: { language },
  });

  return data.collections.nodes
    .filter(
      (collection) =>
        collection.handle !== "all" && collection.products.nodes.length > 0,
    )
    .map((collection) => ({
      id: collection.id.replace(COLLECTION_GID_PREFIX, ""),
      title: collection.title,
      image: collection.image,
    }));
}

type ProductIdQuery = {
  product: { id: string } | null;
};

// Gli handle Shopify sono lettere minuscole, cifre e trattini. Un valore
// diverso non può corrispondere a un prodotto: si risponde 404 senza
// interrogare Shopify, così URL arbitrari non consumano chiamate all'API.
const HANDLE_PATTERN = /^[\p{Ll}\p{Lo}\p{N}]+(?:-[\p{Ll}\p{Lo}\p{N}]+)*$/u;
const MAX_HANDLE_LENGTH = 255;

function isValidHandle(handle: string): boolean {
  return handle.length <= MAX_HANDLE_LENGTH && HANDLE_PATTERN.test(handle);
}

// Shopify traduce anche gli handle: quello della lingua predefinita funziona in
// ogni lingua, quelli tradotti solo nella propria. Dopo un cambio lingua l'URL
// può quindi contenere l'handle di un'altra lingua: lo si cerca in parallelo
// nelle altre lingue e si ricarica il prodotto tramite ID nella lingua
// richiesta. La pagina prodotto poi reindirizza all'handle tradotto, così la
// ricerca avviene una volta per cambio lingua. Una lingua che fallisce non
// blocca le altre: l'errore conta solo se nessuna trova il prodotto.
async function findProductByOtherLanguageHandle(
  handle: string,
  language: Language,
): Promise<ProductDetailNode | null> {
  const results = await Promise.allSettled(
    LANGUAGES.filter((item) => item.code !== language).map((item) =>
      shopifyFetch<ProductIdQuery>({
        query: PRODUCT_ID_BY_HANDLE_QUERY,
        variables: { handle, language: item.code },
      }),
    ),
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.product) {
      const data = await shopifyFetch<ProductQuery>({
        query: PRODUCT_BY_ID_QUERY,
        variables: { id: result.value.product.id, language },
      });

      return data.product;
    }
  }

  const failure = results.find((result) => result.status === "rejected");

  if (failure) {
    throw failure.reason;
  }

  return null;
}

export async function getProductByHandle(
  handle: string,
  language: Language,
): Promise<ShopifyProductDetail | null> {
  const normalizedHandle = handle.trim();

  if (!isValidHandle(normalizedHandle)) {
    return null;
  }

  const data = await shopifyFetch<ProductQuery>({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: { handle: normalizedHandle, language },
  });
  const product =
    data.product ??
    (await findProductByOtherLanguageHandle(normalizedHandle, language));

  if (!product) {
    return null;
  }

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: product.description,
    vendor: product.vendor,
    availableForSale: product.availableForSale,
    images: product.images.nodes,
    options: product.options
      .map((option) => ({
        id: option.id,
        name: option.name,
        values: option.optionValues.map((value) => value.name),
      }))
      .filter(
        (option) =>
          !(option.values.length === 1 && option.values[0] === DEFAULT_VARIANT_VALUE),
      ),
    variants: product.variants.nodes.map((variant) => ({
      id: variant.id,
      title: variant.title,
      availableForSale: variant.availableForSale,
      price: variant.price,
      compareAtPrice: getCompareAtPrice(
        variant.price,
        variant.compareAtPrice,
      ),
      selectedOptions: withoutDefaultOption(variant.selectedOptions),
    })),
  };
}
