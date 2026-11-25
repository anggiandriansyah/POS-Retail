export type ThemeMode = 'dark' | 'light';

export interface ThemePalette {
  bg: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  muted: string;
  border: string;
  primary: string;
  primaryText: string;
  accent: string;
  danger: string;
  dangerSoft: string;
}

export const PALETTES: Record<ThemeMode, ThemePalette> = {
  dark: {
    bg: '#090e1a',
    surface: '#0b1120',
    surfaceElevated: '#151e31',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    muted: '#94a3b8',
    border: '#263248',
    primary: '#047857',
    primaryText: '#ffffff',
    accent: '#10b981',
    danger: '#ef4444',
    dangerSoft: 'rgba(239, 68, 68, 0.16)',
  },
  light: {
    bg: '#f1f5f9',
    surface: '#ffffff',
    surfaceElevated: '#f8fafc',
    text: '#0f172a',
    textSecondary: '#334155',
    muted: '#475569',
    border: '#cbd5e1',
    primary: '#047857',
    primaryText: '#ffffff',
    accent: '#059669',
    danger: '#dc2626',
    dangerSoft: '#fef2f2',
  },
};
