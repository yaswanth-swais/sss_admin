"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

import {
  translateAdminText,
  bulkTranslateAdminText,
} from "../services/adminAIService";

type TextMap = Record<string, string>;

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;

  translate: (text: string) => Promise<string>;

  translations: TextMap;

  translateBulk: (
    texts: TextMap
  ) => Promise<void>;

  translating: boolean;
};

const LanguageContext = createContext<
  LanguageContextType | undefined
>(undefined);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguage] =
    useState("English");

  const [translations, setTranslations] =
    useState<TextMap>({});

  const [translating, setTranslating] =
    useState(false);

  const userEmail = "admin@sss.edu";

  const translate = async (
    text: string
  ): Promise<string> => {
    if (!text.trim() || language === "English") {
      return text;
    }

    try {
      const response = await translateAdminText({
        text,
        target_language: language,
        user_email: userEmail,
        client_name: "SSS",
      });

      return response?.translated_text || text;
    } catch (error) {
      console.error(
        "Single translation failed:",
        error
      );

      return text;
    }
  };

  const translateBulk = async (
    texts: TextMap
  ): Promise<void> => {
    if (language === "English") {
      setTranslations((prev) => ({
        ...prev,
        ...texts,
      }));

      return;
    }

    const keys = Object.keys(texts);
    const values = Object.values(texts);

    if (values.length === 0) {
      return;
    }

    try {
      setTranslating(true);

      const translatedValues =
        await bulkTranslateAdminText(
          values,
          language,
          userEmail
        );

      const translatedObject: TextMap = {};

      keys.forEach((key, index) => {
        translatedObject[key] =
          translatedValues[index] || texts[key];
      });

      setTranslations((prev) => ({
        ...prev,
        ...translatedObject,
      }));
    } catch (error) {
      console.error(
        "Bulk translation failed:",
        error
      );

      setTranslations((prev) => ({
        ...prev,
        ...texts,
      }));
    } finally {
      setTranslating(false);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        translate,
        translations,
        translateBulk,
        translating,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}