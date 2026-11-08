import { BackLink } from "@/components/back-link";
import { BrandMark } from "@/components/brand-mark";
import { CartView } from "@/components/cart-view";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getRequestI18n } from "@/lib/i18n/server";

export default async function CartPage() {
  const { t } = await getRequestI18n();

  return (
    <main className="telegram-safe-page app-shell">
      <nav className="app-topbar">
        <BackLink href="/" label={t.common.backToShop} />
        <BrandMark />
        <div className="topbar-actions">
          <LanguageSwitcher />
        </div>
      </nav>

      <header className="mt-6 mb-5">
        <p className="meta-label">{t.cart.kicker}</p>
        <h1 className="product-title mt-1">{t.cart.title}</h1>
      </header>

      <CartView />
    </main>
  );
}
