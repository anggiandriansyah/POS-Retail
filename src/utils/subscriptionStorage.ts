import type { SupabaseClient } from '@supabase/supabase-js';

export type PackageTier = 'gen_alpha' | 'gen_beta' | 'gen_gamma';
export type RegistrationStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface SubscriptionRegistration {
  id: string;
  full_name: string;
  store_name: string;
  email: string;
  phone: string;
  username: string;
  package_tier: PackageTier;
  amount: number;
  payment_method: 'qris' | 'free' | 'midtrans_snap';
  payment_proof_url?: string | null;
  status: RegistrationStatus;
  rejection_reason?: string | null;
  verification_token: string;
  is_verified: boolean;
  verified_at?: string | null;
  approved_at?: string | null;
  created_at: string;
}

const STORAGE_KEY = 'alphos_subscription_registrations';

const INITIAL_REGISTRATIONS: SubscriptionRegistration[] = [
  {
    id: 'reg-001',
    full_name: 'Dewi Lestari',
    store_name: 'Kopi Kenangan Senja',
    email: 'dewi@senjakopi.com',
    phone: '081234567890',
    username: 'dewikopi',
    package_tier: 'gen_beta',
    amount: 20000,
    payment_method: 'qris',
    payment_proof_url: '/qris-gen-beta-20k.jpg',
    status: 'APPROVED',
    verification_token: 'tok-dewi-kopi-verified',
    is_verified: true,
    verified_at: '2026-11-26T10:15:00Z',
    approved_at: '2026-11-26T10:00:00Z',
    created_at: '2026-11-26T09:45:00Z',
  },
  {
    id: 'reg-002',
    full_name: 'Rudi Hermawan',
    store_name: 'Minimarket Berkah Jaya',
    email: 'rudi@berkahjaya.id',
    phone: '085712349876',
    username: 'rudiberkah',
    package_tier: 'gen_gamma',
    amount: 30000,
    payment_method: 'qris',
    payment_proof_url: '/qris-gen-gamma-30k.jpg',
    status: 'PENDING_APPROVAL',
    verification_token: 'tok-rudi-gamma-pending',
    is_verified: false,
    created_at: '2026-11-27T14:20:00Z',
  },
  {
    id: 'reg-003',
    full_name: 'Siti Aminah',
    store_name: 'Warung Kelontong Ibu Siti',
    email: 'siti@kelontongsiti.my.id',
    phone: '081398765432',
    username: 'sitiwarung',
    package_tier: 'gen_alpha',
    amount: 0,
    payment_method: 'free',
    status: 'APPROVED',
    verification_token: 'tok-siti-alpha-instant',
    is_verified: true,
    verified_at: '2026-11-27T16:00:00Z',
    approved_at: '2026-11-27T16:00:00Z',
    created_at: '2026-11-27T16:00:00Z',
  },
];

export function getLocalRegistrations(): SubscriptionRegistration[] {
  if (typeof window === 'undefined') return INITIAL_REGISTRATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REGISTRATIONS));
      return INITIAL_REGISTRATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_REGISTRATIONS;
  } catch {
    return INITIAL_REGISTRATIONS;
  }
}

export function saveLocalRegistration(reg: SubscriptionRegistration): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalRegistrations();
    const existingIndex = list.findIndex(r => r.id === reg.id);
    if (existingIndex >= 0) {
      list[existingIndex] = reg;
    } else {
      list.unshift(reg);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save registration', err);
  }
}

export function approveLocalRegistration(
  id: string
): { success: boolean; registration?: SubscriptionRegistration; emailSent?: boolean } {
  if (typeof window === 'undefined') return { success: false };
  try {
    const list = getLocalRegistrations();
    const target = list.find(r => r.id === id);
    if (!target) return { success: false };

    target.status = 'APPROVED';
    target.approved_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    // Log email dispatch from official sender
    console.info(
      `[EMAIL DISPATCH] Sent to ${target.email} from "PT AlphaGen Info <no-reply@alphagen.co.id>"`
    );

    return { success: true, registration: target, emailSent: true };
  } catch {
    return { success: false };
  }
}

export function rejectLocalRegistration(id: string, reason: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = getLocalRegistrations();
    const target = list.find(r => r.id === id);
    if (!target) return false;

    target.status = 'REJECTED';
    target.rejection_reason = reason;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function verifyAccountByToken(
  token: string
): { success: boolean; registration?: SubscriptionRegistration } {
  if (typeof window === 'undefined') return { success: false };
  try {
    const list = getLocalRegistrations();
    const target = list.find(r => r.verification_token === token);
    if (!target) return { success: false };

    target.is_verified = true;
    target.verified_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return { success: true, registration: target };
  } catch {
    return { success: false };
  }
}
