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
    <main className="telegram-safe-page px-4 py-8 sm:px-6 sm:py-10">
      <header className="mx-auto mb-8 flex max-w-6xl items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Slinklab
          </h1>
          <p className="mt-1 text-sm text-neutral-500 sm:text-base">
            Mini Shop
          </p>
        </div>
        <CartLink />
      </header>

      <section aria-labelledby="products-heading" className="mx-auto max-w-6xl">
        <h2 className="sr-only" id="products-heading">
          Prodotti
        </h2>

        {shopifyError ? (
          <p
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            {shopifyError}
          </p>
        ) : products.length === 0 ? (
          <p className="rounded-xl bg-neutral-100 p-6 text-center text-sm text-neutral-600">
            Nessun prodotto disponibile al momento.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
