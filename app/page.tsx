import { BrandMark } from "@/components/brand-mark";
import { CartLink } from "@/components/cart-link";
import { ProductCard } from "@/components/product-card";
import { getProducts, type ShopifyProduct } from "@/lib/shopify";
import { connection } from "next/server";

export default async function Home() {
  await connection();

  let products: ShopifyProduct[] = [];
  let shopifyError: string | null = null;

  try {
    products = await getProducts();
  } catch (error: unknown) {
    console.error("Shopify products query failed:", error);
    shopifyError =
      error instanceof Error
        ? error.message
        : "Impossibile recuperare i prodotti.";
  }

  return (
    <main className="telegram-safe-page app-shell">
      <header className="app-topbar">
        <BrandMark linked={false} />
        <CartLink />
      </header>

      <section className="hero-panel" aria-labelledby="home-title">
        <p className="text-[0.6875rem] font-extrabold tracking-[0.14em] text-white/75 uppercase">
          Mini shop
        </p>
        <h1 className="hero-title" id="home-title">
          Il tuo stile, a portata di chat.
        </h1>
        <p className="hero-copy">
          Una selezione SLINK essenziale, veloce e pensata per Telegram.
        </p>
      </section>

      <section aria-labelledby="products-heading" className="mt-7 sm:mt-9">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="section-heading" id="products-heading">
            In evidenza
          </h2>
          {!shopifyError && products.length > 0 ? (
            <p className="section-meta">
              {products.length} {products.length === 1 ? "prodotto" : "prodotti"}
            </p>
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
            <p className="text-sm font-semibold text-[var(--app-text)]">
              La selezione è in aggiornamento
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
              Torna tra poco per scoprire i prodotti disponibili.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
