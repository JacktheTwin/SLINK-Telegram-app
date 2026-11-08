import type { ShopifyMoney } from "@/lib/shopify";

export { messages, type Messages } from "@/lib/i18n/messages";

// Lingue attive sullo store Shopify e coperte dai testi dell'interfaccia.
export const LANGUAGES = [
  { code: "IT", label: "Italiano" },
  { code: "EN", label: "English" },
  { code: "DE", label: "Deutsch" },
  { code: "FR", label: "Français" },
] as const;

export type Language = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: Language = "IT";

export const LANGUAGE_COOKIE = "slink_language";

export function isLanguage(value: string | null | undefined): value is Language {
  return LANGUAGES.some((language) => language.code === value);
}

// Sceglie la prima lingua supportata indicata dall'header Accept-Language.
export function matchAcceptLanguage(header: string | null): Language | null {
  if (!header) {
    return null;
  }

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qualityParam = params.find((param) => param.trim().startsWith("q="));
      const quality = qualityParam
        ? Number.parseFloat(qualityParam.trim().slice(2))
        : 1;

      return {
        code: tag.trim().slice(0, 2).toUpperCase(),
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .filter((candidate) => candidate.quality > 0)
    .sort((first, second) => second.quality - first.quality);

  for (const candidate of candidates) {
    if (isLanguage(candidate.code)) {
      return candidate.code;
    }
  }

  return null;
}

export function formatMoney(money: ShopifyMoney, language: Language): string {
  return new Intl.NumberFormat(`${language.toLowerCase()}-CH`, {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number.parseFloat(money.amount));
}
