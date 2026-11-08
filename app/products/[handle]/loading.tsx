"use client";

import { BrandMark } from "@/components/brand-mark";
import { useI18n } from "@/components/language-provider";

export default function ProductLoading() {
  const { t } = useI18n();

  return (
    <main className="telegram-safe-page app-shell" aria-label={t.product.loading}>
      <div className="app-topbar">
        <div className="skeleton h-11 w-24 rounded-full" />
        <BrandMark />
        <div className="skeleton h-11 w-11 rounded-full" />
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)] lg:gap-8">
        <div className="skeleton aspect-square rounded-[var(--r-lg)] lg:aspect-[4/3]" />
        <div className="surface-panel space-y-4 p-5 sm:p-6">
          <div className="skeleton h-3 w-28 rounded-full" />
          <div className="skeleton h-8 w-4/5 rounded-full" />
          <div className="skeleton h-4 w-24 rounded-full" />
          <div className="skeleton h-20 w-full rounded-[var(--r-md)]" />
          <div className="skeleton h-12 w-full rounded-full" />
          <div className="skeleton h-13 w-full rounded-[var(--r-md)]" />
        </div>
      </div>
    </main>
  );
}
