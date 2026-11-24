'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import type { StoreSettings } from '../types/pos';
import { STORE_INFO } from '../utils/format';
import { useAuth } from './useAuth';
import {
  DEFAULT_STORE_SETTINGS,
  StoreSettingsContext,
  type StoreSettingsContextValue,
  writeCachedStoreName,
} from './useStoreSettings';

interface QuerySettingsResult {
  data: StoreSettings;
  error: string;
  fromDb: boolean;
}

function normalizeStoreSettings(raw: Partial<StoreSettings> | null | undefined): StoreSettings {
  const storeName =
    typeof raw?.store_name === 'string' && raw.store_name.trim()
      ? raw.store_name.trim()
      : STORE_INFO.name;
  const address = typeof raw?.address === 'string' ? raw.address : STORE_INFO.address;
  const phone = typeof raw?.phone === 'string' ? raw.phone : STORE_INFO.phone;
  const footerNote =
    typeof raw?.footer_note === 'string' ? raw.footer_note : STORE_INFO.footerNote;
  const taxEnabled = Boolean(raw?.tax_enabled);
  const parsedRate = Number(raw?.tax_rate);
  const taxRate =
    Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 100 ? parsedRate : 0;

  return {
    id: typeof raw?.id === 'number' ? raw.id : 1,
    store_name: storeName,
    address,
    phone,
    footer_note: footerNote,
    tax_enabled: taxEnabled,
    tax_rate: taxRate,
    updated_by: raw?.updated_by ?? null,
    created_at: raw?.created_at,
    updated_at: raw?.updated_at,
  };
}

function isMissingStoreSettingsTableError(
  err: { code?: string; message?: string; status?: number } | null | undefined
): boolean {
  if (!err) return false;
  if (err.code === 'PGRST205' || err.code === '42P01' || err.status === 404) {
    return true;
  }
  const msg = (err.message || '').toLowerCase();
  return msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('404');
}

async function queryStoreSettings(): Promise<QuerySettingsResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: DEFAULT_STORE_SETTINGS, error: '', fromDb: false };
  }

  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      if (isMissingStoreSettingsTableError(error as { code?: string; message?: string; status?: number })) {
        return { data: DEFAULT_STORE_SETTINGS, error: '', fromDb: false };
      }
      return {
        data: DEFAULT_STORE_SETTINGS,
        error: error.message || 'Gagal memuat pengaturan toko.',
        fromDb: false,
      };
    }

    if (!data) {
      return { data: DEFAULT_STORE_SETTINGS, error: '', fromDb: false };
    }

    return {
      data: normalizeStoreSettings(data as Partial<StoreSettings>),
      error: '',
      fromDb: true,
    };
  } catch (err) {
    const typed = err as { code?: string; message?: string; status?: number };
    if (isMissingStoreSettingsTableError(typed)) {
      return { data: DEFAULT_STORE_SETTINGS, error: '', fromDb: false };
    }
    const message = err instanceof Error ? err.message : 'Gagal memuat pengaturan toko.';
    return { data: DEFAULT_STORE_SETTINGS, error: message, fromDb: false };
  }
}

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const userId = session?.user?.id ?? '';
  const hasProfile = Boolean(profile);

  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const refreshStoreSettings = useCallback(async (): Promise<StoreSettings> => {
    if (!userId || !hasProfile) {
      setSettings(DEFAULT_STORE_SETTINGS);
      setError('');
      setLoading(false);
      return DEFAULT_STORE_SETTINGS;
    }

    setLoading(true);
    const result = await queryStoreSettings();
    setSettings(result.data);
    setError(result.error);
    setLoading(false);

    if (result.fromDb) {
      writeCachedStoreName(result.data.store_name);
    }
    return result.data;
  }, [userId, hasProfile]);

  useEffect(() => {
    if (!userId || !hasProfile) {
      const resetTimer = setTimeout(() => {
        setSettings(DEFAULT_STORE_SETTINGS);
        setError('');
        setLoading(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    let cancelled = false;
    const initTimer = setTimeout(() => {
      if (!cancelled) setLoading(true);
    }, 0);

    queryStoreSettings().then((result) => {
      if (cancelled) return;
      clearTimeout(initTimer);
      setSettings(result.data);
      setError(result.error);
      setLoading(false);
      if (result.fromDb) {
        writeCachedStoreName(result.data.store_name);
      }
    });

    const client = supabase;
    const channel = client
      ? client
          .channel('store-settings-sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'store_settings', filter: 'id=eq.1' },
            () => {
              if (!cancelled) {
                void refreshStoreSettings();
              }
            }
          )
          .subscribe()
      : null;

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      if (client && channel) {
        client.removeChannel(channel);
      }
    };
  }, [userId, hasProfile, refreshStoreSettings]);

  const value = useMemo<StoreSettingsContextValue>(
    () => ({
      settings,
      loading,
      error,
      refreshStoreSettings,
    }),
    [settings, loading, error, refreshStoreSettings]
  );

  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
}
