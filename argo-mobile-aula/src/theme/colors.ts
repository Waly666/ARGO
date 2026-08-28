import type { PortalTemaConfig } from '../api/types';

export type ThemeColors = {
  primary: string;
  primaryDark: string;
  accent: string;
  brand: string;
  bg: string;
  bgSoft: string;
  card: string;
  cardElevated: string;
  text: string;
  textSoft: string;
  border: string;
  borderLight: string;
  headerBg: string;
  headerBorder: string;
  headerTitle: string;
  headerSubtitle: string;
  ok: string;
  okSoft: string;
  warn: string;
  warnSoft: string;
  danger: string;
  dangerSoft: string;
  accentSoft: string;
  inputBg: string;
  inputText: string;
  inputPlaceholder: string;
  tabBar: string;
  tabBarActive: string;
  overlay: string;
  gold: string;
  goldSoft: string;
  violet: string;
  violetSoft: string;
  foroSoft: string;
  gradient: [string, string];
  gradientHero: [string, string] | [string, string, string];
  gradientGold: [string, string];
  gradientViolet: [string, string];
  gradientForo: [string, string];
  gradientPrimary: [string, string];
  gradientAccent: [string, string];
  gradientDashHero: [string, string, string];
  starGlow: string;
};

/** Portal público — paleta ARGO Cajero (fintech / wallet). */
export const FINSTRUVIAL_PUBLIC: ThemeColors = {
  primary: '#3D5CFF',
  primaryDark: '#2B46E0',
  accent: '#22D3EE',
  brand: '#3D5CFF',
  bg: '#F4F6FB',
  bgSoft: '#EEF2FF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  text: '#0F172A',
  textSoft: '#64748B',
  border: '#E8ECF4',
  borderLight: '#F1F5F9',
  headerBg: '#3D5CFF',
  headerBorder: '#2B46E0',
  headerTitle: '#FFFFFF',
  headerSubtitle: 'rgba(255,255,255,0.85)',
  ok: '#2B46E0',
  okSoft: '#EEF2FF',
  warn: '#F59E0B',
  warnSoft: '#FFFBEB',
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  accentSoft: '#EEF2FF',
  inputBg: '#FFFFFF',
  inputText: '#0F172A',
  inputPlaceholder: '#94A3B8',
  tabBar: '#FFFFFF',
  tabBarActive: '#3D5CFF',
  overlay: 'rgba(15, 23, 42, 0.35)',
  gold: '#F59E0B',
  goldSoft: '#FFFBEB',
  violet: '#6366F1',
  violetSoft: '#EEF2FF',
  foroSoft: '#EEF2FF',
  gradient: ['#F4F6FB', '#FFFFFF'],
  gradientHero: ['#0B1026', '#151B33', '#1A2240'],
  gradientGold: ['#FFFBEB', '#FFFFFF'],
  gradientViolet: ['#EEF2FF', '#FFFFFF'],
  gradientForo: ['#EEF2FF', '#FFFFFF'],
  gradientPrimary: ['#3D5CFF', '#6B84FF'],
  gradientAccent: ['#22D3EE', '#3D5CFF'],
  gradientDashHero: ['#0B1026', '#151B33', '#1A2240'],
  starGlow: 'rgba(61, 92, 255, 0.12)',
};

/** Panel del estudiante — misma paleta que el hub Cajero. */
export const FINSTRUVIAL_DASHBOARD: ThemeColors = {
  ...FINSTRUVIAL_PUBLIC,
  bg: '#F4F6FB',
  bgSoft: '#EEF2FF',
};

function mergePortalColors(base: ThemeColors, tema?: PortalTemaConfig): ThemeColors {
  if (!tema) return base;
  // La app móvil usa paleta fija ARGO Cajero (#3D5CFF). El portal web no sobreescribe primary/accent.
  return {
    ...base,
    textSoft: tema.colorTextoSecundario || base.textSoft,
  };
}

export type ThemeVariant = 'public' | 'dashboard';

export function themeForVariant(variant: ThemeVariant, tema?: PortalTemaConfig): ThemeColors {
  const base = variant === 'dashboard' ? FINSTRUVIAL_DASHBOARD : FINSTRUVIAL_PUBLIC;
  return mergePortalColors(base, tema);
}

/** @deprecated use themeForVariant */
export function themeFromPortal(tema?: PortalTemaConfig) {
  return themeForVariant('public', tema);
}
