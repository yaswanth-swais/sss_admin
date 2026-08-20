"use client";

import { useLanguage } from "../context/LanguageContext";

export function useTranslation() {
  const { translate, language, setLanguage } = useLanguage();

  const t = async (text: string) => {
    return await translate(text);
  };

  return {
    t,
    language,
    setLanguage,
  };
}