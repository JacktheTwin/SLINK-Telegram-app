import { BackLink } from "@/components/back-link";
import { BrandMark } from "@/components/brand-mark";
import { CartLink } from "@/components/cart-link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ProductVariantSelector } from "@/components/product-variant-selector";
import { getRequestI18n } from "@/lib/i18n/server";
import {
  getProductByHandle,
  type ShopifyProductDetail,
} from "@/lib/shopify";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

type ProductPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  await connection();
  const { handle } = await params;
  const { language, t } = await getRequestI18n();
  const topbar = (
    <nav className="app-topbar">
      <BackLink href="/" label={t.common.backToProducts} />
      <BrandMark />
      <div className="topbar-actions">
        <LanguageSwitcher />
        <CartLink />
      </div>
    </nav>
  );
  let product: ShopifyProductDetail | null = null;

  try {
    product = await getProductByHandle(handle, language);
  } catch (error: unknown) {
    // I dettagli tecnici restano nei log del server.
    console.error("Shopify product query failed:", error);

    return (
      <main className="telegram-safe-page app-shell">
        {topbar}
        <p className="app-alert mt-6" role="alert">
          {t.product.loadError}
        </p>
      </main>
    );
  }

  if (!product) {
    notFound();
  }

  // L'URL conteneva l'handle di un'altra lingua: si passa a quello tradotto,
  // così i caricamenti successivi non ripetono la ricerca nelle altre lingue.
  if (product.handle !== handle) {
    redirect(`/products/${encodeURIComponent(product.handle)}`);
  }

  return (
    <main className="telegram-safe-page app-shell">
      {topbar}

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)] lg:items-start lg:gap-8">
        <section aria-label={t.product.images(product.title)}>
          {product.images.length > 0 ? (
            <div className="product-gallery">
              {product.images.map((image, index) => (
                <div
                  className="product-gallery-item"
                  key={image.url}
                >
                  <Image
                    alt={image.altText || product.title}
                    fill
                    preload={index === 0}
                    sizes="(max-width: 639px) 88vw, (max-width: 899px) 70vw, 34vw"
                    src={image.url}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="product-gallery-item flex items-center justify-center px-6 text-center text-base text-[var(--app-muted)]">
              {t.common.imageUnavailable}
            </div>
          )}
        </section>

        <section aria-labelledby="product-title" className="lg:sticky lg:top-6 lg:pt-2">
          {product.vendor ? (
            <p className="meta-label">{product.vendor}</p>
          ) : null}
          <h1
            className="product-title mt-1"
            id="product-title"
          >
            {product.title}
          </h1>

          {/* Shopify traduce nomi e valori delle opzioni: la selezione riparte
              quando cambia la lingua. */}
          <ProductVariantSelector
            key={language}
            options={product.options}
            variants={product.variants}
          />

          <div className="mt-8 border-t border-[var(--app-line)] pt-6">
            <h2 className="section-heading">{t.product.details}</h2>
            <p className="product-description mt-3 whitespace-pre-line">
              {product.description || t.product.noDescription}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
