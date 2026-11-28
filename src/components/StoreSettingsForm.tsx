'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Bell, RefreshCw, RotateCcw, Save, Settings, Volume2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { DEFAULT_STORE_SETTINGS, useStoreSettings } from '../contexts/useStoreSettings';
import { useThemeLang } from '../contexts/useThemeLang';
import { supabase } from '../lib/supabaseClient';
import { isAdminRole, type FeedbackMessage } from '../types/pos';
import AlphosLogo from './AlphosLogo';

interface SupabaseErrorLike {
  code?: unknown;
  message?: unknown;
  status?: unknown;
}

function isMissingStoreSettingsTableError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const typed = err as SupabaseErrorLike;
  if (typed.code === 'PGRST205' || typed.code === '42P01' || typed.status === 404) {
    return true;
  }
  const msg = typeof typed.message === 'string' ? typed.message.toLowerCase() : '';
  return msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('404');
}

function formatMissingTableMessage(err: SupabaseErrorLike, lang: 'id' | 'en'): string {
  const rawMsg = typeof err.message === 'string' ? err.message.trim() : '';
  const friendly =
    lang === 'en'
      ? 'Store settings table (store_settings) is not available yet. Please apply database migration v1.3.0.'
      : 'Tabel pengaturan toko (store_settings) belum tersedia. Silakan terapkan migrasi database v1.3.0.';
  return rawMsg ? `${friendly} (${rawMsg})` : friendly;
}

function extractErrorMessage(err: unknown, fallback: string, lang: 'id' | 'en'): string {
  if (err instanceof Error) {
    const trimmed = err.message.trim();
    if (
      isMissingStoreSettingsTableError(err) &&
      !trimmed.startsWith('Tabel pengaturan toko') &&
      !trimmed.startsWith('Store settings table')
    ) {
      return formatMissingTableMessage({ message: trimmed }, lang);
    }
    return trimmed || fallback;
  }
  if (typeof err === 'string') {
    return err.trim() || fallback;
  }
  if (typeof err === 'object' && err !== null) {
    if (isMissingStoreSettingsTableError(err)) {
      return formatMissingTableMessage(err as SupabaseErrorLike, lang);
    }
    if ('message' in err) {
      const msg = (err as { message?: unknown }).message;
      if (typeof msg === 'string' && msg.trim()) {
        return msg.trim();
      }
      if (msg !== null && msg !== undefined && typeof msg !== 'object') {
        return String(msg);
      }
    }
  }
  return fallback;
}

export default function StoreSettingsForm() {
  const { profile, user } = useAuth();
  const { settings, loading, error: contextError, refreshStoreSettings } = useStoreSettings();
  const { dict, lang } = useThemeLang();
  const t = dict.settings;

  const isAdmin = isAdminRole(profile?.role);

  const [storeName, setStoreName] = useState(settings.store_name);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [footerNote, setFooterNote] = useState(settings.footer_note);
  const [taxEnabled, setTaxEnabled] = useState(settings.tax_enabled);
  const [taxRate, setTaxRate] = useState(String(settings.tax_rate ?? 0));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [antiFraudDiscountLocked, setAntiFraudDiscountLocked] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const s = localStorage.getItem('alphos_notification_sound');
      if (s !== null) setSoundEnabled(s === 'true');
      const d = localStorage.getItem('alphos_anti_fraud_discount');
      if (d !== null) setAntiFraudDiscountLocked(d === 'true');
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      setStoreName(settings.store_name);
      setAddress(settings.address);
      setPhone(settings.phone);
      setFooterNote(settings.footer_note);
      setTaxEnabled(settings.tax_enabled);
      setTaxRate(String(settings.tax_rate ?? 0));
    }, 0);
    return () => clearTimeout(id);
  }, [settings]);

  if (!isAdmin) {
    return (
      <div className="settings-layout">
        <div className="card">
          <div className="alert alert-error">{t.ownerOnly}</div>
        </div>
      </div>
    );
  }

  function handleResetDefaults() {
    setFeedback(null);
    setStoreName(DEFAULT_STORE_SETTINGS.store_name);
    setAddress(DEFAULT_STORE_SETTINGS.address);
    setPhone(DEFAULT_STORE_SETTINGS.phone);
    setFooterNote(DEFAULT_STORE_SETTINGS.footer_note);
    setTaxEnabled(DEFAULT_STORE_SETTINGS.tax_enabled);
    setTaxRate(String(DEFAULT_STORE_SETTINGS.tax_rate));
  }

  async function handleRefresh() {
    setFeedback(null);
    await refreshStoreSettings();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);

    if (!isAdmin) {
      setFeedback({ type: 'error', text: t.ownerOnly });
      return;
    }

    const cleanName = storeName.trim();
    if (!cleanName) {
      setFeedback({ type: 'error', text: t.errStoreNameRequired });
      return;
    }

    const rawTax = taxRate.trim();
    const parsedTax = rawTax === '' ? 0 : Number(rawTax);

    if (taxEnabled && (rawTax === '' || !Number.isFinite(parsedTax) || parsedTax < 0 || parsedTax > 100)) {
      setFeedback({ type: 'error', text: t.errTaxRateRange });
      return;
    }
    if (!taxEnabled && rawTax !== '' && (!Number.isFinite(parsedTax) || parsedTax < 0 || parsedTax > 100)) {
      setFeedback({ type: 'error', text: t.errTaxRateRange });
      return;
    }

    const resolvedTaxRate = rawTax === '' ? 0 : Math.round(parsedTax * 100) / 100;

    if (!supabase) {
      setFeedback({ type: 'error', text: dict.supabaseNotConfigured });
      return;
    }

    setSaving(true);
    try {
      const { error: upsertErr } = await supabase
        .from('store_settings')
        .upsert(
          {
            id: 1,
            store_name: cleanName,
            address: address.trim(),
            phone: phone.trim(),
            footer_note: footerNote.trim(),
            tax_enabled: taxEnabled,
            tax_rate: resolvedTaxRate,
            updated_by: user?.id ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (upsertErr) {
        const message = isMissingStoreSettingsTableError(upsertErr)
          ? formatMissingTableMessage(upsertErr, lang)
          : upsertErr.message || t.saveError;
        throw new Error(message);
      }

      await refreshStoreSettings();
      setFeedback({ type: 'success', text: t.saveSuccess });
    } catch (err) {
      const message = extractErrorMessage(err, t.saveError, lang);
      const text = message === t.saveError ? t.saveError : `${t.saveError}: ${message}`;
      setFeedback({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  }

  const previewName = storeName.trim() || DEFAULT_STORE_SETTINGS.store_name;
  const previewAddress = address.trim() || DEFAULT_STORE_SETTINGS.address;
  const previewPhone = phone.trim() || DEFAULT_STORE_SETTINGS.phone;
  const previewFooter = footerNote.trim() || DEFAULT_STORE_SETTINGS.footer_note;

  return (
    <div className="settings-layout">
      {contextError && <div className="alert alert-error">{contextError}</div>}
      {feedback && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </div>
      )}

      <section className="card">
        <div className="section-header">
          <div>
            <h2 style={{ margin: 0 }}>
              <Settings size={18} /> {t.title}
            </h2>
            <p className="muted-text" style={{ margin: '4px 0 0' }}>
              {t.subtitle}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleRefresh}
            disabled={loading || saving}
          >
            <RefreshCw size={14} /> {dict.refresh}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-grid">
            <label>
              {t.storeNameLabel}
              <input
                type="text"
                className="input"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder={t.storeNamePlaceholder}
                disabled={saving}
                required
              />
            </label>

            <label>
              {t.phoneLabel}
              <input
                type="text"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                disabled={saving}
              />
            </label>

            <label className="form-field-full">
              {t.addressLabel}
              <textarea
                className="input"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t.addressPlaceholder}
                disabled={saving}
              />
            </label>

            <label className="form-field-full">
              {t.footerNoteLabel}
              <textarea
                className="input"
                rows={2}
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                placeholder={t.footerNotePlaceholder}
                disabled={saving}
              />
            </label>
          </div>

          <div className="settings-tax-section">
            <h3>{t.taxSectionTitle}</h3>

            <label className="settings-toggle-row">
              <div>
                <strong>{t.taxEnabledLabel}</strong>
                <span className="muted-text" style={{ display: 'block', fontSize: '0.8rem' }}>
                  {t.taxEnabledDesc}
                </span>
              </div>
              <input
                type="checkbox"
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
                disabled={saving}
              />
            </label>

            <label style={{ maxWidth: '240px' }}>
              {t.taxRateLabel}
              <input
                type="number"
                className="input"
                min={0}
                max={100}
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder={t.taxRatePlaceholder}
                disabled={!taxEnabled || saving}
              />
              {!taxEnabled && (
                <span className="muted-text" style={{ fontSize: '0.78rem', fontWeight: 400 }}>
                  {t.taxRateDisabledHint}
                </span>
              )}
            </label>
          </div>

          {/* SPRINT 5: Smart Notification & Audio Sonic Branding Settings */}
          <div className="settings-tax-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={16} /> Smart Notification & Sonic Branding
            </h3>

            <label className="settings-toggle-row">
              <div>
                <strong>Audio Notifikasi Resmi ALPHOS</strong>
                <span className="muted-text" style={{ display: 'block', fontSize: '0.8rem' }}>
                  Putar jingle resmi otomatis saat ada stok menipis atau pengajuan restock kasir.
                </span>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => {
                  setSoundEnabled(e.target.checked);
                  localStorage.setItem('alphos_notification_sound', String(e.target.checked));
                }}
              />
            </label>

            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  const audio = new Audio('/alphos-official-notification.mp3');
                  audio.play().catch(console.error);
                }}
              >
                <Bell size={16} aria-hidden="true" />
                <span>Uji Coba Suara Jingle Resmi</span>
              </button>
            </div>
          </div>

          {/* SPRINT 5: Anti-Fraud Role-Based Discount Control */}
          <div className="settings-tax-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} /> Anti-Fraud: Kontrol Diskon Kasir
            </h3>

            <label className="settings-toggle-row">
              <div>
                <strong>Kunci Input Diskon Bebas Kasir (Owner Only)</strong>
                <span className="muted-text" style={{ display: 'block', fontSize: '0.8rem' }}>
                  Hanya akun Owner / Superadmin yang dapat mengetikkan nominal diskon manual. Kasir hanya dapat memilih diskon resmi yang ditentukan toko.
                </span>
              </div>
              <input
                type="checkbox"
                checked={antiFraudDiscountLocked}
                onChange={(e) => {
                  setAntiFraudDiscountLocked(e.target.checked);
                  localStorage.setItem('alphos_anti_fraud_discount', String(e.target.checked));
                }}
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={15} />
              <span>{saving ? t.savingBtn : t.saveBtn}</span>
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleResetDefaults}
              disabled={saving}
            >
              <RotateCcw size={15} />
              <span>{t.resetDefaultBtn}</span>
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>{t.previewTitle}</h3>
        <div className="receipt-paper">
          <div className="receipt-header">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.35rem' }}>
              <AlphosLogo variant="thermal" width={160} height={34} />
            </div>
            <h3>{previewName}</h3>
            <p>{previewAddress}</p>
            <p>
              {dict.receipt.phonePrefix}: {previewPhone}
            </p>
          </div>
          <div className="receipt-divider" />
          <p className="receipt-footer">{previewFooter}</p>
        </div>
      </section>
    </div>
  );
}
