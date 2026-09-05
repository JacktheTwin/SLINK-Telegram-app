"use client";

import { BrandMark } from "@/components/brand-mark";
import { useEffect } from "react";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("Errore Mini App:", error);
  }, [error]);

  return (
    <main className="telegram-safe-page app-shell flex items-center justify-center">
      <div className="surface-panel w-full max-w-md px-6 py-10 text-center">
        <BrandMark linked={false} />
        <p className="brand-kicker mt-6">Qualcosa non ha funzionato</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--app-text)]">
          Riproviamo?
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
          Non siamo riusciti a caricare questa schermata. Il tuo carrello resta
          salvato su Shopify.
        </p>
        <button className="app-cta mt-6 w-full" onClick={reset} type="button">
          Riprova
        </button>
      </div>
    </main>
  );
}
