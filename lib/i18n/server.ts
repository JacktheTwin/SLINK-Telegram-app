import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  isLanguage,
  matchAcceptLanguage,
  messages,
  type Language,
  type Messages,
} from "@/lib/i18n";
import { cookies, headers } from "next/headers";

// Lingua della richiesta: scelta salvata nel cookie, poi lingua del
// dispositivo, infine la lingua predefinita della Mini App.
export async function getRequestLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const savedLanguage = cookieStore.get(LANGUAGE_COOKIE)?.value;

  if (isLanguage(savedLanguage)) {
    return savedLanguage;
  }

  const requestHeaders = await headers();

  return (
    matchAcceptLanguage(requestHeaders.get("accept-language")) ??
    DEFAULT_LANGUAGE
  );
}

// Equivalente server di useI18n(): lingua della richiesta e relativi testi.
export async function getRequestI18n(): Promise<{
  language: Language;
  t: Messages;
}> {
  const language = await getRequestLanguage();

  return { language, t: messages[language] };
}
