'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translations, type Lang, type Theme } from '../i18n/translations';
import { ThemeLangContext, type ThemeLangContextValue } from './useThemeLang';

const THEME_KEY = 'pos_theme';
const LANG_KEY = 'pos_lang';

function readStoredTheme(): Theme {
  try {
    const val = localStorage.getItem(THEME_KEY);
    return val === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function readStoredLang(): Lang {
  try {
    const val = localStorage.getItem(LANG_KEY);
    return val === 'en' ? 'en' : 'id';
  } catch {
    return 'id';
  }
}

export function ThemeLangProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [lang, setLangState] = useState<Lang>('id');

  useEffect(() => {
    const id = setTimeout(() => {
      setThemeState(readStoredTheme());
      setLangState(readStoredLang());
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const setTheme = useCallback((next: Theme) => {
    const resolved: Theme = next === 'dark' ? 'dark' : 'light';
    setThemeState(resolved);
    try {
      localStorage.setItem(THEME_KEY, resolved);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // Ignore storage errors in restricted environments
      }
      return next;
    });
  }, []);

  const setLang = useCallback((next: Lang) => {
    const resolved: Lang = next === 'en' ? 'en' : 'id';
    setLangState(resolved);
    try {
      localStorage.setItem(LANG_KEY, resolved);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === 'en' ? 'id' : 'en';
      try {
        localStorage.setItem(LANG_KEY, next);
      } catch {
        // Ignore storage errors in restricted environments
      }
      return next;
    });
  }, []);

  const dict = translations[lang] || translations.id;

  const t = useCallback(
    (path: string): string => {
      const parts = path.split('.');
      let cur: unknown = dict;
      for (const p of parts) {
        if (cur && typeof cur === 'object' && p in cur) {
          cur = (cur as Record<string, unknown>)[p];
        } else {
          return path;
        }
      }
      return typeof cur === 'string' ? cur : path;
    },
    [dict]
  );

  const value = useMemo<ThemeLangContextValue>(
    () => ({
      theme,
      lang,
      setTheme,
      toggleTheme,
      setLang,
      toggleLang,
      dict,
      t,
    }),
    [theme, lang, setTheme, toggleTheme, setLang, toggleLang, dict, t]
  );

  return <ThemeLangContext.Provider value={value}>{children}</ThemeLangContext.Provider>;
}
