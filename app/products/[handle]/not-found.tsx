import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="telegram-safe-page flex items-center justify-center px-4 py-10">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-neutral-500">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Prodotto non trovato
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Il prodotto richiesto non esiste o non è disponibile nello storefront.
        </p>
        <Link
          className="mt-6 inline-flex rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white"
          href="/"
        >
          Torna ai prodotti
        </Link>
      </div>
    </main>
  );
}
