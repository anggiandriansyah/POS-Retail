'use client';

import { createContext, useContext } from 'react';
import type { StoreSettings } from '../types/pos';
import { STORE_INFO } from '../utils/format';

export const STORE_NAME_CACHE_KEY = 'pos_store_name';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 1,
  store_name: STORE_INFO.name,
  address: STORE_INFO.address,
  phone: STORE_INFO.phone,
  footer_note: STORE_INFO.footerNote,
  tax_enabled: false,
  tax_rate: 0,
};

export interface StoreSettingsContextValue {
  settings: StoreSettings;
  loading: boolean;
  error: string;
  refreshStoreSettings: () => Promise<StoreSettings>;
}

export const StoreSettingsContext = createContext<StoreSettingsContextValue | null>(null);

export function useStoreSettings(): StoreSettingsContextValue {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) {
    throw new Error('useStoreSettings must be used within StoreSettingsProvider');
  }
  return ctx;
}

export function readCachedStoreName(): string {
  try {
    return localStorage.getItem(STORE_NAME_CACHE_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

export function writeCachedStoreName(name: string): void {
  try {
    const clean = name.trim();
    if (clean) {
      localStorage.setItem(STORE_NAME_CACHE_KEY, clean);
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}
