import { CartLink } from "@/components/cart-link";
import { ProductVariantSelector } from "@/components/product-variant-selector";
import {
  getProductByHandle,
  type ShopifyProductDetail,
} from "@/lib/shopify";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

type ProductPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  await connection();
  const { handle } = await params;
  let product: ShopifyProductDetail | null = null;

  try {
    product = await getProductByHandle(handle);
  } catch (error: unknown) {
    console.error("Shopify product query failed:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Impossibile recuperare il prodotto.";

    return (
      <main className="telegram-safe-page mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <nav className="flex items-center justify-between gap-4">
          <Link className="text-sm font-medium text-neutral-600" href="/">
            ← Tutti i prodotti
          </Link>
          <CartLink />
        </nav>
        <p
          className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {message}
        </p>
      </main>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <main className="telegram-safe-page mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <nav className="flex items-center justify-between gap-4">
        <Link
          className="inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          href="/"
        >
          ← Tutti i prodotti
        </Link>
        <CartLink />
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)] lg:gap-12">
        <section aria-label={`Immagini di ${product.title}`}>
          {product.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {product.images.map((image, index) => (
                <div
                  className={`relative aspect-square overflow-hidden rounded-xl bg-neutral-100 ${
                    index === 0 ? "col-span-2" : ""
                  }`}
                  key={image.url}
                >
                  <Image
                    alt={image.altText || product.title}
                    className="object-cover"
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes={
                      index === 0
                        ? "(max-width: 1023px) 100vw, 60vw"
                        : "(max-width: 1023px) 50vw, 30vw"
                    }
                    src={image.url}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-xl bg-neutral-100 px-6 text-center text-sm text-neutral-500">
              Immagine non disponibile
            </div>
          )}
        </section>

        <section aria-labelledby="product-title" className="lg:pt-2">
          <p className="text-sm font-medium text-neutral-500">Slinklab</p>
          <h1
            className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl"
            id="product-title"
          >
            {product.title}
          </h1>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-neutral-900">
              Descrizione
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-neutral-600 sm:text-base">
              {product.description || "Descrizione non disponibile."}
            </p>
          </div>

          <ProductVariantSelector
            options={product.options}
            variants={product.variants}
          />
        </section>
      </div>
    </main>
  );
}
