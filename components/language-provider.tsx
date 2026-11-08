"use client";

import { messages, type Language, type Messages } from "@/lib/i18n";
import { createContext, useContext, type ReactNode } from "react";

type LanguageContextValue = {
  language: Language;
  t: Messages;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

type LanguageProviderProps = {
  children: ReactNode;
  language: Language;
};

export function LanguageProvider({ children, language }: LanguageProviderProps) {
  return (
    <LanguageContext.Provider value={{ language, t: messages[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useI18n deve essere usato all'interno di LanguageProvider.");
  }

  return context;
}
