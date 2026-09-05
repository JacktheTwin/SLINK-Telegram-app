import type { ShopifyMoney, ShopifyProduct } from "@/lib/shopify";
import Image from "next/image";
import Link from "next/link";

type ProductCardProps = {
  product: ShopifyProduct;
};

function formatMoney(money: ShopifyMoney): string {
  return new Intl.NumberFormat("it-CH", {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number.parseFloat(money.amount));
}

export function ProductCard({ product }: ProductCardProps) {
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
              className={`object-cover ${
                product.availableForSale ? "" : "grayscale"
              }`}
              fill
              sizes="(max-width: 639px) 50vw, (max-width: 899px) 33vw, 25vw"
              src={product.featuredImage.url}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-xs text-[var(--app-muted)]">
              Immagine non disponibile
            </div>
          )}

          {!product.availableForSale ? (
            <span className="app-badge">
              Esaurito
            </span>
          ) : null}
        </div>

        <div className="product-card-body">
          <h2 className="product-card-title">
            {product.title}
          </h2>

          <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-2">
            <span className="product-card-price">
              {product.priceVaries ? "Da " : ""}
              {formatMoney(product.price)}
            </span>
            {product.compareAtPrice ? (
              <span className="product-card-compare">
                {formatMoney(product.compareAtPrice)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
