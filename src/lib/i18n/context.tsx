'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations, type Locale, type Dictionary } from './translations';

interface LangContextValue {
  lang: Locale;
  setLang: (l: Locale) => void;
  t: Dictionary;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
});

function getInitialLang(): Locale {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|; )lang=([^;]*)/);
    const l = match?.[1];
    if (l === 'en' || l === 'zh') return l;
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Locale>(getInitialLang);

  const setLang = useCallback((l: Locale) => {
    setLangState(l);
    document.cookie = `lang=${l};path=/;max-age=${365 * 24 * 60 * 60}`;
    try {
      localStorage.setItem('lang', l);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const t = useMemo(() => translations[lang], [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LangContext);
}

export function useT() {
  return useContext(LangContext).t;
}
