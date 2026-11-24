'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  Activity,
  Barcode,
  Clock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Store,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { readCachedStoreName } from '../contexts/useStoreSettings';
import { useThemeLang } from '../contexts/useThemeLang';
import type { FeedbackMessage } from '../types/pos';
import { APP_VERSION, STORE_INFO } from '../utils/format';
import ThemeLangToggles from './ThemeLangToggles';

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,30}$/;

type LoginMode = 'login' | 'signup' | 'claim_owner';

export default function LoginPage() {
  const { hasOwner, authError, signIn, signUp, signInWithGoogle, claimFirstOwner } = useAuth();
  const { dict } = useThemeLang();
  const t = dict.login;

  const [mode, setMode] = useState<LoginMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [storeName, setStoreName] = useState<string>(STORE_INFO.name);

  useEffect(() => {
    const id = setTimeout(() => {
      const cached = readCachedStoreName();
      if (cached) {
        setStoreName(cached);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const isDevEnv = process.env.NEXT_PUBLIC_APP_ENV !== 'production';

  const activeMode: LoginMode =
    !hasOwner && mode === 'claim_owner'
      ? 'claim_owner'
      : mode === 'signup'
        ? 'signup'
        : 'login';

  function switchMode(nextMode: LoginMode) {
    setMode(nextMode);
    setFeedback(null);
    setPassword('');
    setConfirmPassword('');
  }

  async function handleGoogleSignIn() {
    setFeedback(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : t.googleFailed;
      setFeedback({
        type: 'error',
        text: message || t.googleFailed,
      });
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);

    if (activeMode === 'login') {
      if (!identifier.trim() || !password) {
        setFeedback({ type: 'error', text: t.errRequiredSignIn });
        return;
      }
      setSubmitting(true);
      try {
        await signIn(identifier, password);
      } catch (err) {
        const message = err instanceof Error ? err.message : t.authFailed;
        setFeedback({
          type: 'error',
          text: message || t.authFailed,
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (activeMode === 'signup') {
      if (!email.trim() || !username.trim() || !fullName.trim() || !password) {
        setFeedback({ type: 'error', text: t.errRequiredSignUp });
        return;
      }
      if (!USERNAME_REGEX.test(username.trim())) {
        setFeedback({ type: 'error', text: t.errUsernameFormat });
        return;
      }
      if (password.length < 6) {
        setFeedback({ type: 'error', text: t.errPasswordLength });
        return;
      }
      if (password !== confirmPassword) {
        setFeedback({ type: 'error', text: t.errPasswordMismatch });
        return;
      }

      setSubmitting(true);
      try {
        const result = await signUp(email, password, fullName, username);
        if (!result?.session) {
          switchMode('login');
          setFeedback({ type: 'success', text: t.signUpSuccessVerify });
        } else {
          setFeedback({ type: 'success', text: t.signUpSuccessReady });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t.authFailed;
        setFeedback({
          type: 'error',
          text: message || t.authFailed,
        });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // claim_owner
    if (!fullName.trim()) {
      setFeedback({ type: 'error', text: t.errOwnerNameRequired });
      return;
    }
    if (!email.trim() || !password) {
      setFeedback({ type: 'error', text: t.errRequiredSignIn });
      return;
    }
    if (password.length < 6) {
      setFeedback({ type: 'error', text: t.errPasswordLength });
      return;
    }

    setSubmitting(true);
    try {
      const result = await claimFirstOwner(email, password, fullName, username);
      if (result?.needsEmailConfirmation) {
        switchMode('login');
        setFeedback({ type: 'success', text: t.ownerCreatedVerify });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t.authFailed;
      setFeedback({
        type: 'error',
        text: message || t.authFailed,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-corner-toggles">
        <ThemeLangToggles />
      </div>

      <div className="login-split-shell">
        <aside className="login-hero">
          <div className="login-hero-top">
            <div className="login-brand">
              <div className="brand-logo brand-logo-lg">
                <Store size={26} />
              </div>
              <div>
                <h1>
                  {storeName}{' '}
                  {isDevEnv && <span className="env-badge">DEV</span>}
                </h1>
                <span className="login-version-pill">
                  POS Retail • <code>v{APP_VERSION}</code>
                </span>
              </div>
            </div>

            <h2 className="login-hero-title">{t.heroTitle}</h2>
            <p className="login-hero-desc">{t.heroDesc}</p>
          </div>

          <div className="login-features">
            <div className="login-feature-item">
              <span className="login-feature-icon">
                <Barcode size={18} />
              </span>
              <div>
                <strong>{t.feature1Title}</strong>
                <p>{t.feature1Desc}</p>
              </div>
            </div>
            <div className="login-feature-item">
              <span className="login-feature-icon">
                <Clock size={18} />
              </span>
              <div>
                <strong>{t.feature2Title}</strong>
                <p>{t.feature2Desc}</p>
              </div>
            </div>
            <div className="login-feature-item">
              <span className="login-feature-icon">
                <Activity size={18} />
              </span>
              <div>
                <strong>{t.feature3Title}</strong>
                <p>{t.feature3Desc}</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="login-card card">
          <div className="login-mobile-brand">
            <div className="brand-logo">
              <Store size={22} />
            </div>
            <div>
              <strong>{storeName}</strong>
              <span className="muted-text" style={{ display: 'block', fontSize: '0.78rem' }}>
                POS Retail • <code>v{APP_VERSION}</code>
              </span>
            </div>
          </div>

          <div className="login-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'login'}
              className={`login-tab-btn ${activeMode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              <LogIn size={15} />
              <span>{t.signInTab}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'signup'}
              className={`login-tab-btn ${activeMode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              <UserPlus size={15} />
              <span>{t.signUpTab}</span>
            </button>
            {!hasOwner && (
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === 'claim_owner'}
                className={`login-tab-btn ${activeMode === 'claim_owner' ? 'active' : ''}`}
                onClick={() => switchMode('claim_owner')}
              >
                <ShieldCheck size={15} />
                <span>{t.claimOwnerTab}</span>
              </button>
            )}
          </div>

          {(authError || feedback) && (
            <div
              className={`alert ${
                feedback?.type === 'success' ? 'alert-success' : 'alert-error'
              }`}
            >
              {feedback?.text || authError}
            </div>
          )}

          {activeMode === 'signup' && (
            <>
              <button
                type="button"
                className="btn btn-google btn-lg"
                onClick={handleGoogleSignIn}
                disabled={submitting}
              >
                <GoogleLogo />
                <span>{t.continueWithGoogle}</span>
              </button>

              <div className="login-divider">
                <span>{t.orDivider}</span>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {activeMode === 'login' && (
              <label>
                {t.identifierLabel}
                <input
                  type="text"
                  className="input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t.identifierPlaceholder}
                  autoComplete="username"
                  required
                />
              </label>
            )}

            {activeMode !== 'login' && (
              <>
                <label>
                  {t.emailLabel}
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    autoComplete="email"
                    required
                  />
                </label>

                <div className="login-form-row">
                  <label>
                    {t.usernameLabel}
                    <input
                      type="text"
                      className="input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t.usernamePlaceholder}
                      autoComplete="username"
                      required={activeMode === 'signup'}
                    />
                  </label>
                  <label>
                    {t.fullNameLabel}
                    <input
                      type="text"
                      className="input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.fullNamePlaceholder}
                      autoComplete="name"
                      required
                    />
                  </label>
                </div>
              </>
            )}

            <label>
              {t.passwordLabel}
              <div className="input-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={activeMode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {activeMode === 'signup' && (
              <label>
                {t.confirmPasswordLabel}
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </label>
            )}

            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {activeMode === 'claim_owner' ? (
                <>
                  <ShieldCheck size={18} />
                  <span>{submitting ? t.claimingOwnerBtn : t.claimOwnerBtn}</span>
                </>
              ) : activeMode === 'signup' ? (
                <>
                  <UserPlus size={18} />
                  <span>{submitting ? t.signingUpBtn : t.signUpBtn}</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>{submitting ? t.signingInBtn : t.signInBtn}</span>
                </>
              )}
            </button>
          </form>

          <p className="muted-text login-hint">
            {activeMode === 'claim_owner' ? t.ownerSetupHint : t.cashierNote}
          </p>
        </section>
      </div>
    </div>
  );
}
