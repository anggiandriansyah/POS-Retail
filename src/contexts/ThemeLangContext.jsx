import { useCallback, useEffect, useMemo, useState } from 'react';
import { translations } from '../i18n/translations';
import { ThemeLangContext } from './useThemeLang';

const THEME_KEY = 'pos_theme';
const LANG_KEY = 'pos_lang';

function readStoredTheme() {
  try {
    const val = localStorage.getItem(THEME_KEY);
    return val === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function readStoredLang() {
  try {
    const val = localStorage.getItem(LANG_KEY);
    return val === 'en' ? 'en' : 'id';
  } catch {
    return 'id';
  }
}

export function ThemeLangProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);
  const [lang, setLangState] = useState(readStoredLang);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [lang]);

  const setTheme = useCallback((next) => {
    setThemeState(next === 'dark' ? 'dark' : 'light');
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setLang = useCallback((next) => {
    setLangState(next === 'en' ? 'en' : 'id');
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'en' ? 'id' : 'en'));
  }, []);

  const dict = translations[lang] || translations.id;

  const t = useCallback(
    (path) => {
      const parts = path.split('.');
      let cur = dict;
      for (const p of parts) {
        if (cur && typeof cur === 'object' && p in cur) {
          cur = cur[p];
        } else {
          return path;
        }
      }
      return typeof cur === 'string' ? cur : path;
    },
    [dict]
  );

  const value = useMemo(
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
