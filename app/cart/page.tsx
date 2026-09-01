import { CartView } from "@/components/cart-view";
import Link from "next/link";

export default function CartPage() {
  return (
    <main className="telegram-safe-page mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-8">
        <Link
          className="inline-flex text-sm font-medium text-neutral-600 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          href="/"
        >
          ← Continua gli acquisti
        </Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
          Carrello
        </h1>
      </header>

      <CartView />
    </main>
  );
}
