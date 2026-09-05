import { BrandMark } from "@/components/brand-mark";
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
      <main className="telegram-safe-page app-shell">
        <nav className="app-topbar">
          <Link className="app-icon-button web-only-control px-3" href="/">
            <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
              <path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
            Prodotti
          </Link>
          <BrandMark />
          <CartLink />
        </nav>
        <p
          className="app-alert mt-6"
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
    <main className="telegram-safe-page app-shell">
      <nav className="app-topbar">
        <Link
          className="app-icon-button web-only-control px-3"
          href="/"
        >
          <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
            <path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
          Prodotti
        </Link>
        <BrandMark />
        <CartLink />
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)] lg:items-start lg:gap-8">
        <section aria-label={`Immagini di ${product.title}`}>
          {product.images.length > 0 ? (
            <div className="product-gallery">
              {product.images.map((image, index) => (
                <div
                  className="product-gallery-item"
                  key={image.url}
                >
                  <Image
                    alt={image.altText || product.title}
                    className="object-cover"
                    fill
                    preload={index === 0}
                    sizes="(max-width: 639px) 88vw, (max-width: 899px) 70vw, 34vw"
                    src={image.url}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="product-gallery-item flex items-center justify-center px-6 text-center text-sm text-[var(--app-muted)]">
              Immagine non disponibile
            </div>
          )}
        </section>

        <section aria-labelledby="product-title" className="surface-panel p-5 sm:p-6 lg:sticky lg:top-5">
          <p className="brand-kicker">SLINK selection</p>
          <h1
            className="product-title mt-2"
            id="product-title"
          >
            {product.title}
          </h1>

          <ProductVariantSelector
            options={product.options}
            variants={product.variants}
          />

          <div className="mt-6">
            <h2 className="text-xs font-extrabold tracking-[0.1em] text-[var(--app-text)] uppercase">
              Dettagli
            </h2>
            <p className="product-description mt-2 whitespace-pre-line">
              {product.description || "Descrizione non disponibile."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
