import { formatMoney, messages, type Language } from "@/lib/i18n";
import type { ShopifyProduct } from "@/lib/shopify";
import Image from "next/image";
import Link from "next/link";

type ProductCardProps = {
  language: Language;
  product: ShopifyProduct;
};

export function ProductCard({ language, product }: ProductCardProps) {
  const t = messages[language];

  return (
    <article className="h-full">
      <Link
        className="product-card-link"
        href={`/products/${product.handle}`}
      >
        <div className="product-card-media">
          {product.featuredImage ? (
            <Image
              alt={product.featuredImage.altText || product.title}
              className={product.availableForSale ? undefined : "grayscale"}
              fill
              sizes="(max-width: 639px) 50vw, (max-width: 899px) 33vw, 25vw"
              src={product.featuredImage.url}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[var(--app-muted)]">
              {t.common.imageUnavailable}
            </div>
          )}

          {!product.availableForSale ? (
            <span className="app-badge">
              {t.card.soldOut}
            </span>
          ) : null}
        </div>

        <div className="product-card-body">
          <h2 className="product-card-title">
            {product.title}
          </h2>

          <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1">
            <span className="product-card-price">
              {product.priceVaries ? `${t.card.from} ` : ""}
              {formatMoney(product.price, language)}
            </span>
            {product.compareAtPrice ? (
              <span className="product-card-compare">
                {formatMoney(product.compareAtPrice, language)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
