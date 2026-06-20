import type { PortalTemaConfig } from '../api/types';

/** Paleta fija modo claro — la app no usa fondos oscuros. */
const LIGHT = {
  primary: '#1976d2',
  primaryDark: '#1565c0',
  accent: '#0288d1',
  bg: '#f1f5f9',
  card: '#ffffff',
  text: '#1e293b',
  textSoft: '#64748b',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  headerBg: '#ffffff',
  headerBorder: '#e2e8f0',
  ok: '#2e7d32',
  okSoft: '#e8f5e9',
  warn: '#ef6c00',
  warnSoft: '#fff3e0',
  danger: '#c62828',
  dangerSoft: '#ffebee',
  accentSoft: '#e3f2fd',
  inputBg: '#ffffff',
  inputText: '#1e293b',
  inputPlaceholder: '#94a3b8',
  tabBar: '#ffffff',
  overlay: 'rgba(15, 23, 42, 0.35)',
  gold: '#f9a825',
  goldSoft: '#fff8e1',
  violet: '#7e57c2',
  violetSoft: '#f3e5f5',
  foroSoft: '#e0f7fa',
  gradient: ['#e3f2fd', '#f8fafc'] as [string, string],
  gradientHero: ['#dbeafe', '#f8fafc'] as [string, string],
  gradientGold: ['#fff8e1', '#fffde7'] as [string, string],
  gradientViolet: ['#f3e5f5', '#faf5ff'] as [string, string],
  gradientForo: ['#e0f7fa', '#f0fdfa'] as [string, string],
};

/** Siempre devuelve tema claro; solo toma el azul del portal si es razonable. */
export function themeFromPortal(_tema?: PortalTemaConfig) {
  return { ...LIGHT };
}

export type ThemeColors = ReturnType<typeof themeFromPortal>;
