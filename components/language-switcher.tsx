"use client";

import { useCart } from "@/components/cart-provider";
import { useI18n } from "@/components/language-provider";
import { LANGUAGE_COOKIE, LANGUAGES, isLanguage } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function saveLanguage(language: string): void {
  // Su HTTPS il cookie resta valido anche quando Telegram Web apre la Mini App
  // in un iframe di terze parti.
  const crossSiteAttributes =
    window.location.protocol === "https:"
      ? "; SameSite=None; Secure; Partitioned"
      : "; SameSite=Lax";

  document.cookie = `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=${ONE_YEAR_IN_SECONDS}${crossSiteAttributes}`;
}

export function LanguageSwitcher() {
  const { language, t } = useI18n();
  const { isCheckingOut, isMutating } = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="app-icon-button language-switcher">
      <span className="sr-only">{t.common.language}</span>
      <span aria-hidden="true">{language}</span>
      <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 24 24" width="14">
        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
      {/* Select nativo trasparente sopra la pillola: picker di sistema su mobile. */}
      <select
        aria-busy={isPending}
        disabled={isPending || isMutating || isCheckingOut}
        onChange={(event) => {
          const nextLanguage = event.target.value;

          if (!isLanguage(nextLanguage) || nextLanguage === language) {
            return;
          }

          saveLanguage(nextLanguage);
          startTransition(() => {
            router.refresh();
          });
        }}
        value={language}
      >
        {LANGUAGES.map((item) => (
          <option key={item.code} lang={item.code.toLowerCase()} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
