'use client';

import { Moon, Sun } from 'lucide-react';
import { useThemeLang } from '../contexts/useThemeLang';

function FlagIndonesia() {
  return (
    <svg
      className="flag-svg"
      viewBox="0 0 24 16"
      width="18"
      height="12"
      aria-hidden="true"
    >
      <rect width="24" height="8" fill="#E11D48" rx="1.5" />
      <rect y="8" width="24" height="8" fill="#FFFFFF" rx="1.5" />
      <rect width="24" height="8" fill="#E11D48" />
      <rect y="8" width="24" height="8" fill="#F8FAFC" />
    </svg>
  );
}

function FlagUK() {
  return (
    <svg
      className="flag-svg"
      viewBox="0 0 24 16"
      width="18"
      height="12"
      aria-hidden="true"
    >
      <rect width="24" height="16" fill="#1E3A8A" />
      <path d="M0 0L24 16M24 0L0 16" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M0 0L24 16M24 0L0 16" stroke="#DC2626" strokeWidth="1.4" />
      <path d="M12 0V16M0 8H24" stroke="#FFFFFF" strokeWidth="5" />
      <path d="M12 0V16M0 8H24" stroke="#DC2626" strokeWidth="3" />
    </svg>
  );
}

export interface ThemeLangTogglesProps {
  compact?: boolean;
}

export default function ThemeLangToggles({ compact = false }: ThemeLangTogglesProps) {
  const { theme, lang, toggleTheme, toggleLang, dict } = useThemeLang();
  const isEn = lang === 'en';
  const isDark = theme === 'dark';

  return (
    <div className={`toggles-group ${compact ? 'toggles-compact' : ''}`}>
      <button
        type="button"
        role="switch"
        aria-checked={isEn}
        aria-label={isEn ? dict.toggles.switchToId : dict.toggles.switchToEn}
        title={isEn ? dict.toggles.switchToId : dict.toggles.switchToEn}
        className={`swipe-switch swipe-lang ${isEn ? 'is-right' : 'is-left'}`}
        onClick={toggleLang}
      >
        <span className="swipe-track">
          <span className="swipe-option swipe-option-left">
            <FlagIndonesia />
            <span>ID</span>
          </span>
          <span className="swipe-option swipe-option-right">
            <FlagUK />
            <span>EN</span>
          </span>
        </span>
        <span className="swipe-thumb" aria-hidden="true">
          {isEn ? <FlagUK /> : <FlagIndonesia />}
          <span>{isEn ? 'EN' : 'ID'}</span>
        </span>
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? dict.toggles.switchToLight : dict.toggles.switchToDark}
        title={isDark ? dict.toggles.switchToLight : dict.toggles.switchToDark}
        className={`swipe-switch swipe-theme ${isDark ? 'is-right' : 'is-left'}`}
        onClick={toggleTheme}
      >
        <span className="swipe-track">
          <span className="swipe-option swipe-option-left">
            <Sun size={13} />
          </span>
          <span className="swipe-option swipe-option-right">
            <Moon size={13} />
          </span>
        </span>
        <span className="swipe-thumb swipe-thumb-icon" aria-hidden="true">
          {isDark ? <Moon size={14} /> : <Sun size={14} />}
        </span>
      </button>
    </div>
  );
}
