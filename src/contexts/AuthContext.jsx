import { useCallback, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../supabaseClient';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeShift, setActiveShift] = useState(null);
  const [hasOwner, setHasOwner] = useState(true);
  const [loading, setLoading] = useState(isSupabaseConfigured && Boolean(supabase));
  const [authError, setAuthError] = useState('');

  const checkHasOwner = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return true;
    const { data, error } = await supabase.rpc('has_any_owner');
    if (error) return true;
    const exists = Boolean(data);
    setHasOwner(exists);
    return exists;
  }, []);

  const fetchActiveShift = useCallback(async (userId) => {
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
    setActiveShift(data || null);
    return data || null;
  }, []);

  const loadUserContext = useCallback(
    async (currentSession) => {
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

      if (profileData.is_active === false) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
        setActiveShift(null);
        setAuthError('Akun Anda telah dinonaktifkan oleh Owner. Hubungi admin toko.');
        return;
      }

      setAuthError('');
      setSession(currentSession);
      setUser(currentUser);
      setProfile(profileData);
      await fetchActiveShift(currentUser.id);
    },
    [fetchActiveShift]
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    let mounted = true;

    async function init() {
      await checkHasOwner();
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      await loadUserContext(data.session);
      if (mounted) setLoading(false);
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
    async (email, password) => {
      if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
      setAuthError('');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      await loadUserContext(data.session);
      return data;
    },
    [loadUserContext]
  );

  const signUp = useCallback(async (email, password, fullName) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const claimFirstOwner = useCallback(
    async (email, password, fullName) => {
      if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
      setAuthError('');
      const trimmedName = fullName.trim();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: trimmedName,
          },
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
    if (!supabase) return;
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

  const value = {
    session,
    user,
    profile,
    activeShift,
    hasOwner,
    loading,
    authError,
    signIn,
    signUp,
    claimFirstOwner,
    signOut,
    refreshShift,
    checkHasOwner,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
