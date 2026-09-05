import { BrandMark } from "@/components/brand-mark";
import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="telegram-safe-page app-shell flex items-center justify-center">
      <div className="surface-panel w-full max-w-md px-6 py-10 text-center">
        <BrandMark linked={false} />
        <p className="brand-kicker mt-6">Errore 404</p>
        <h1 className="product-title mt-2">
          Prodotto non trovato
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--app-muted)]">
          Il prodotto richiesto non esiste o non è disponibile nello storefront.
        </p>
        <Link
          className="app-cta mt-6"
          href="/"
        >
          Torna ai prodotti
        </Link>
      </div>
    </main>
  );
}
