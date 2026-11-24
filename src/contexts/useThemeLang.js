import { createContext, useContext } from 'react';

export const ThemeLangContext = createContext(null);

export function useThemeLang() {
  const ctx = useContext(ThemeLangContext);
  if (!ctx) {
    throw new Error('useThemeLang must be used within ThemeLangProvider');
  }
  return ctx;
}
