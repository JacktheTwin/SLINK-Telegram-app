import { BrandMark } from "@/components/brand-mark";
import { CartView } from "@/components/cart-view";
import Link from "next/link";

export default function CartPage() {
  return (
    <main className="telegram-safe-page app-shell">
      <nav className="app-topbar">
        <Link
          className="app-icon-button web-only-control px-3"
          href="/"
        >
          <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
            <path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
          Shop
        </Link>
        <BrandMark />
      </nav>

      <header className="mt-6 mb-5">
        <p className="brand-kicker">Il tuo ordine</p>
        <h1 className="product-title mt-1">Carrello</h1>
      </header>

      <CartView />
    </main>
  );
}
