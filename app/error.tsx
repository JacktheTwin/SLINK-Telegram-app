"use client";

import { BrandMark } from "@/components/brand-mark";
import { useI18n } from "@/components/language-provider";
import { useEffect } from "react";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  const { t } = useI18n();

  useEffect(() => {
    console.error("Errore Mini App:", error);
  }, [error]);

  return (
    <main className="telegram-safe-page app-shell flex items-center justify-center">
      <div className="surface-panel w-full max-w-md px-6 py-10 text-center">
        <BrandMark linked={false} />
        <p className="meta-label mt-6">{t.error.kicker}</p>
        <h1 className="product-title mt-2">
          {t.error.title}
        </h1>
        <p className="mt-3 text-base leading-6 text-[var(--app-muted)]">
          {t.error.text}
        </p>
        <button className="app-cta mt-6 w-full" onClick={reset} type="button">
          {t.common.retry}
        </button>
      </div>
    </main>
  );
}
