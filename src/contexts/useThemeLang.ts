'use client';

import { createContext, useContext } from 'react';
import type { Lang, Theme, TranslationDict } from '../i18n/translations';

export interface ThemeLangContextValue {
  theme: Theme;
  lang: Lang;
  setTheme: (next: Theme) => void;
  toggleTheme: () => void;
  setLang: (next: Lang) => void;
  toggleLang: () => void;
  dict: TranslationDict;
  t: (path: string) => string;
}

export const ThemeLangContext = createContext<ThemeLangContextValue | null>(null);

export function useThemeLang(): ThemeLangContextValue {
  const ctx = useContext(ThemeLangContext);
  if (!ctx) {
    throw new Error('useThemeLang must be used within ThemeLangProvider');
  }
  return ctx;
}
