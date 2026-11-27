'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import type { Profile, Shift } from '../types/pos';
import { AuthContext, type AuthContextValue } from './useAuth';
import { registerLocalSession, clearActiveSession, getActiveSession, getLocalDeviceId } from '../utils/session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [hasOwner, setHasOwner] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(
    isSupabaseConfigured && Boolean(supabase)
  );
  const [authError, setAuthError] = useState<string>('');

  const checkHasOwner = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) return true;
    const { data, error } = await supabase.rpc('has_any_owner');
    if (error) return true;
    const exists = Boolean(data);
    setHasOwner(exists);
    return exists;
  }, []);

  const fetchActiveShift = useCallback(async (userId: string): Promise<Shift | null> => {
    if (!supabase || !userId) {
      setActiveShift(null);
      return null;
    }
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('cashier_id', userId)
      .eq('status', 'OPEN')
      .maybeSingle();

    if (error) {
      setActiveShift(null);
      return null;
    }
    const shift = (data as Shift | null) || null;
    setActiveShift(shift);
    return shift;
  }, []);

  const loadUserContext = useCallback(
    async (currentSession: Session | null) => {
      if (!supabase || !currentSession?.user) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setActiveShift(null);
        return;
      }

      const currentUser = currentSession.user;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profileError || !profileData) {
        setAuthError(
          profileError
            ? `Gagal memuat profil pengguna: ${profileError.message}`
            : 'Profil pengguna tidak ditemukan.'
        );
        setSession(null);
        setUser(null);
        setProfile(null);
        setActiveShift(null);
        return;
      }

      const typedProfile = profileData as Profile;

      if (typedProfile.is_active === false) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setActiveShift(null);
        setAuthError('Akun Anda telah dinonaktifkan oleh Owner. Hubungi admin toko.');
        return;
      }

      // Guard: Google OAuth Login requires existing registration (Sign Up first)
      if (typeof window !== 'undefined') {
        const oauthIntent = sessionStorage.getItem('alphos_oauth_intent');
        if (oauthIntent) {
          sessionStorage.removeItem('alphos_oauth_intent');
          if (oauthIntent === 'login') {
            const createdAt = new Date(currentUser.created_at).getTime();
            const lastSignIn = currentUser.last_sign_in_at
              ? new Date(currentUser.last_sign_in_at).getTime()
              : createdAt;
            const now = Date.now();
            const isBrandNewAccount =
              Math.abs(createdAt - lastSignIn) < 3000 && now - createdAt < 45000;

            if (isBrandNewAccount) {
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setProfile(null);
              setActiveShift(null);
              setAuthError(
                'Akun Google ini belum terdaftar di ALPHOS. Silakan lakukan pendaftaran akun terlebih dahulu melalui tab Daftar.'
              );
              return;
            }
          }
        }
      }

      setAuthError('');
      setSession(currentSession);
      setUser(currentUser);
      setProfile(typedProfile);
      await fetchActiveShift(currentUser.id);
    },
    [fetchActiveShift]
  );

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) {
      return;
    }

    let mounted = true;

    async function init() {
      if (!client) return;
      await checkHasOwner();
      const { data } = await client.auth.getSession();
      if (!mounted) return;
      await loadUserContext(data.session);
      if (mounted) setLoading(false);
    }

    init();

    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      loadUserContext(nextSession).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [checkHasOwner, loadUserContext]);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      setAuthError('');
      const trimmed = identifier.trim();
      const cleanId = trimmed.toLowerCase();

      // Environment & Domain isolation check (Hotfix v1.5.1)
      if (typeof window !== 'undefined') {
        const host = window.location.hostname.toLowerCase();
        const isDevHost = host === 'localhost' || host === '127.0.0.1' || host.includes('develop') || host.includes('-dev');
        const isProdHost = !isDevHost;

        if ((cleanId === 'admindev' || cleanId === 'admindev@alphagen.id') && isProdHost) {
          throw new Error('Akun admindev hanya dapat digunakan pada environment Development / Local.');
        }
        if ((cleanId === 'adminprod' || cleanId === 'adminprod@alphagen.id') && isDevHost) {
          throw new Error('Akun adminprod hanya dapat digunakan pada environment Production.');
        }
      }

      // Dual-Device Session Guard (Hotfix v1.5.1)
      const existingSession = getActiveSession();
      const currentDeviceId = getLocalDeviceId();
      if (existingSession && existingSession.userId && existingSession.deviceId !== currentDeviceId && (existingSession.userId === cleanId || existingSession.userId === trimmed)) {
        throw new Error('User Sedang Aktif Digunakan di perangkat lain.');
      }

      if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
      let resolvedEmail = trimmed;

      const { data: emailData, error: rpcError } = await supabase.rpc('resolve_login_email', {
        p_identifier: trimmed,
      });

      if (rpcError) {
        if (!trimmed.includes('@')) {
          throw rpcError;
        }
      } else if (typeof emailData === 'string' && emailData) {
        resolvedEmail = emailData;
      } else if (!trimmed.includes('@')) {
        throw new Error('Username tidak ditemukan.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });
      if (error) throw error;
      await loadUserContext(data.session);
      if (data.user?.id) registerLocalSession(data.user.id);
      return data;
    },
    [loadUserContext]
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, username?: string) => {
      if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
      const metadata: { full_name: string; username?: string } = {
        full_name: fullName.trim(),
      };
      if (username && username.trim()) {
        metadata.username = username.trim().toLowerCase();
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata,
        },
      });
      if (error) throw error;
      return data;
    },
    []
  );

  const signInWithGoogle = useCallback(async (intent: 'login' | 'signup' = 'login') => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    setAuthError('');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('alphos_oauth_intent', intent);
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const claimFirstOwner = useCallback(
    async (email: string, password: string, fullName: string, username?: string) => {
      if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
      setAuthError('');
      const trimmedName = fullName.trim();
      const metadata: { full_name: string; username?: string } = {
        full_name: trimmedName,
      };
      if (username && username.trim()) {
        metadata.username = username.trim().toLowerCase();
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata,
        },
      });
      if (error) throw error;

      if (!data.session) {
        return { needsEmailConfirmation: true };
      }

      const { error: claimError } = await supabase.rpc('claim_first_owner', {
        p_full_name: trimmedName,
      });
      if (claimError) throw claimError;

      await checkHasOwner();
      await loadUserContext(data.session);
      return { needsEmailConfirmation: false };
    },
    [checkHasOwner, loadUserContext]
  );

  const signOut = useCallback(async () => {
    clearActiveSession();
    if (!supabase) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setActiveShift(null);
      return;
    }
    setAuthError('');
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setActiveShift(null);
  }, []);

  const refreshShift = useCallback(async () => {
    if (!user?.id) return null;
    return fetchActiveShift(user.id);
  }, [fetchActiveShift, user]);

  const value: AuthContextValue = {
    session,
    user,
    profile,
    activeShift,
    hasOwner,
    loading,
    authError,
    signIn,
    signUp,
    signInWithGoogle,
    claimFirstOwner,
    signOut,
    refreshShift,
    checkHasOwner,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
