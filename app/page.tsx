import { BrandMark } from "@/components/brand-mark";
import { CartLink } from "@/components/cart-link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ProductCard } from "@/components/product-card";
import { getRequestI18n } from "@/lib/i18n/server";
import {
  getCollections,
  getProducts,
  type ShopifyCollection,
  type ShopifyProduct,
} from "@/lib/shopify";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

type HomeProps = {
  searchParams: Promise<{
    c?: string | string[];
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  await connection();
  const { language, t } = await getRequestI18n();
  const { c } = await searchParams;
  const requestedCollectionId = typeof c === "string" ? c : undefined;

  let collections: ShopifyCollection[] = [];
  let products: ShopifyProduct[] = [];
  let shopifyError: string | null = null;

  try {
    [collections, products] = await Promise.all([
      getCollections(language),
      getProducts(language, requestedCollectionId),
    ]);
  } catch (error: unknown) {
    console.error("Shopify products query failed:", error);
    // I dettagli tecnici restano nei log del server.
    shopifyError = t.home.loadError;
  }

  const activeCollection = collections.find(
    (collection) => collection.id === requestedCollectionId,
  );
  // La foto dell'hero arriva dalle collezioni Shopify (la prima che ne ha una,
  // oggi i gonfiabili) e resta la stessa con ogni filtro, come il titolo.
  const heroImage =
    collections.find((collection) => collection.image)?.image ?? null;

  return (
    <main className="telegram-safe-page app-shell">
      <header className="app-topbar">
        <BrandMark linked={false} />
        <div className="topbar-actions">
          <LanguageSwitcher />
          <CartLink />
        </div>
      </header>

      <section aria-labelledby="home-title" className="home-hero">
        {heroImage ? (
          <div className="home-hero-media">
            <Image
              alt={heroImage.altText || t.home.heroImage}
              className="object-cover"
              fill
              preload
              sizes="(max-width: 1152px) 100vw, 72rem"
              src={heroImage.url}
            />
          </div>
        ) : null}

        <div className="home-hero-copy">
          <p className="brand-line">{t.common.brandLine}</p>
          <h1 className="home-title" id="home-title">
            {t.home.title}
          </h1>
          <p className="home-lead">{t.home.copy}</p>
        </div>
      </section>

      <section aria-labelledby="products-heading" className="mt-8 sm:mt-12">
        {collections.length > 0 ? (
          <nav aria-label={t.home.categories} className="category-bar">
            <Link
              aria-current={activeCollection ? undefined : "page"}
              className="category-chip"
              href="/"
              scroll={false}
            >
              {t.home.all}
            </Link>
            {collections.map((collection) => (
              <Link
                aria-current={
                  collection.id === requestedCollectionId ? "page" : undefined
                }
                className="category-chip"
                href={`/?c=${collection.id}`}
                key={collection.id}
                scroll={false}
              >
                {collection.title}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="mt-6 mb-4 flex items-baseline justify-between gap-4">
          <h2 className="section-heading" id="products-heading">
            {activeCollection?.title ?? t.home.allProducts}
          </h2>
          {!shopifyError && products.length > 0 ? (
            <p className="meta-label">{t.home.productCount(products.length)}</p>
          ) : null}
        </div>

        {shopifyError ? (
          <p
            className="app-alert"
            role="alert"
          >
            {shopifyError}
          </p>
        ) : products.length === 0 ? (
          <div className="surface-panel p-7 text-center">
            <p className="text-base font-medium text-[var(--app-text)]">
              {activeCollection ? t.home.categoryEmpty : t.home.emptyTitle}
            </p>
            {activeCollection ? null : (
              <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">
                {t.home.emptyText}
              </p>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} language={language} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
