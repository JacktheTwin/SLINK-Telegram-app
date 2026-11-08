import { BrandMark } from "@/components/brand-mark";
import { getRequestI18n } from "@/lib/i18n/server";
import Link from "next/link";

export default async function ProductNotFound() {
  const { t } = await getRequestI18n();

  return (
    <main className="telegram-safe-page app-shell flex items-center justify-center">
      <div className="surface-panel w-full max-w-md px-6 py-10 text-center">
        <BrandMark linked={false} />
        <p className="meta-label mt-6">{t.notFound.kicker}</p>
        <h1 className="product-title mt-2">
          {t.notFound.title}
        </h1>
        <p className="mt-3 text-base leading-6 text-[var(--app-muted)]">
          {t.notFound.text}
        </p>
        <Link
          className="app-cta mt-6"
          href="/"
        >
          {t.notFound.back}
        </Link>
      </div>
    </main>
  );
}
