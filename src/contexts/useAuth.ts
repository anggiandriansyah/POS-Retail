'use client';

import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile, Shift } from '../types/pos';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  activeShift: Shift | null;
  hasOwner: boolean;
  loading: boolean;
  authError: string;
  signIn: (identifier: string, password: string) => Promise<{ user: User | null; session: Session | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    username?: string
  ) => Promise<{ user: User | null; session: Session | null }>;
  signInWithGoogle: () => Promise<{ provider: string; url: string | null }>;
  claimFirstOwner: (
    email: string,
    password: string,
    fullName: string,
    username?: string
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshShift: () => Promise<Shift | null>;
  checkHasOwner: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return ctx;
}
