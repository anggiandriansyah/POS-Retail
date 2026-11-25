import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { translations } from '@shared/i18n/translations';
import { isAdminRole, type Profile, type Shift, type StoreSettings } from '@shared/types/pos';
import { supabase } from '../lib/supabaseClient';
import { PALETTES, type ThemeMode, type ThemePalette } from '../theme/tokens';

export type LangCode = 'id' | 'en';

export interface AppContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  toggleLang: () => void;
  dict: (typeof translations)[LangCode];
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  palette: ThemePalette;
  profile: Profile | null;
  isOwner: boolean;
  activeShift: Shift | null;
  storeSettings: StoreSettings;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

const DEFAULT_SETTINGS: StoreSettings = {
  id: 1,
  store_name: 'ALPHOS Store',
  address: 'Jl. AlphaGen No. 1, Jakarta',
  phone: '0811-2233-4455',
  footer_note: 'Terima kasih telah berbelanja di ALPHOS.',
  tax_enabled: false,
  tax_rate: 11,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LangCode>('id');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  const refreshSession = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setActiveShift(null);
      return;
    }

    const [{ data: prof }, { data: shift }, { data: settings }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase
        .from('shifts')
        .select('*')
        .eq('cashier_id', user.id)
        .eq('status', 'OPEN')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('store_settings').select('*').eq('id', 1).maybeSingle(),
    ]);

    setProfile((prof as Profile) || null);
    setActiveShift((shift as Shift) || null);
    if (settings) setStoreSettings(settings as StoreSettings);
  }, []);

  useEffect(() => {
    void refreshSession();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refreshSession();
    });
    return () => sub.subscription.unsubscribe();
  }, [refreshSession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setActiveShift(null);
  }, []);

  const value: AppContextValue = {
    lang,
    setLang,
    toggleLang: () => setLang((prev) => (prev === 'id' ? 'en' : 'id')),
    dict: translations[lang],
    theme,
    setTheme,
    toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    palette: PALETTES[theme],
    profile,
    isOwner: isAdminRole(profile?.role),
    activeShift,
    storeSettings,
    refreshSession,
    signOut,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
