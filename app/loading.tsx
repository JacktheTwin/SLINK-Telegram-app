"use client";

import { BrandMark } from "@/components/brand-mark";
import { useI18n } from "@/components/language-provider";

export default function HomeLoading() {
  const { t } = useI18n();

  return (
    <main className="telegram-safe-page app-shell" aria-label={t.home.loading}>
      <div className="app-topbar">
        <BrandMark linked={false} />
        <div className="topbar-actions">
          <div className="skeleton h-11 w-16 rounded-full" />
          <div className="skeleton h-11 w-11 rounded-full" />
        </div>
      </div>
      <div className="skeleton mt-3 aspect-[4/3] rounded-[var(--r-lg)] sm:aspect-video min-[900px]:aspect-[3/1]" />
      <div className="skeleton mt-6 h-3 w-36 rounded-full" />
      <div className="skeleton mt-3 h-9 w-11/12 rounded-full" />
      <div className="skeleton mt-2 h-9 w-2/3 rounded-full" />
      <div className="mt-8 flex gap-2">
        {[0, 1, 2, 3].map((item) => (
          <div className="skeleton h-11 w-24 shrink-0 rounded-full" key={item} />
        ))}
      </div>
      <div className="product-grid mt-6">
        {[0, 1, 2, 3].map((item) => (
          <div key={item}>
            <div className="skeleton aspect-square rounded-[var(--r-lg)]" />
            <div className="skeleton mt-3 h-4 w-4/5 rounded-full" />
            <div className="skeleton mt-2 h-4 w-2/5 rounded-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
