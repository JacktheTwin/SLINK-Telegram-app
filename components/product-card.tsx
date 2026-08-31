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
        className="flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        href={`/products/${product.handle}`}
      >
        <div className="relative aspect-square overflow-hidden bg-neutral-100">
          {product.featuredImage ? (
            <Image
              alt={product.featuredImage.altText || product.title}
              className={`object-cover ${
                product.availableForSale ? "" : "grayscale"
              }`}
              fill
              sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
              src={product.featuredImage.url}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-xs text-neutral-500">
              Immagine non disponibile
            </div>
          )}

          {!product.availableForSale ? (
            <span className="absolute top-2 left-2 rounded-full bg-neutral-900 px-2.5 py-1 text-[0.6875rem] font-medium text-white">
              Esaurito
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <h2 className="text-sm leading-snug font-medium text-neutral-900 sm:text-base">
            {product.title}
          </h2>

          <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-3 text-sm">
            <span className="font-semibold text-neutral-900">
              {formatMoney(product.price)}
            </span>
            {product.compareAtPrice ? (
              <span className="text-neutral-500 line-through">
                {formatMoney(product.compareAtPrice)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
