import type { PortalTemaConfig } from '../api/types';

export function themeFromPortal(tema: PortalTemaConfig) {
  const primary = tema.colorPrimario || '#1565c0';
  const primaryDark = tema.colorPrimarioOscuro || '#0d47a1';
  const accent = tema.colorAcento || '#00acc1';
  return {
    primary,
    primaryDark,
    accent,
    bg: tema.colorFondo || '#f0f4f8',
    card: tema.colorSuperficie || '#ffffff',
    text: tema.colorTexto || '#1a237e',
    textSoft: tema.colorTextoSecundario || '#5c6bc0',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    ok: '#2e7d32',
    okSoft: '#e8f5e9',
    warn: '#f57c00',
    warnSoft: '#fff3e0',
    danger: '#c62828',
    dangerSoft: '#ffebee',
    accentSoft: '#e3f2fd',
    inputBg: '#ffffff',
    inputText: '#1e293b',
    inputPlaceholder: '#64748b',
    tabBar: '#ffffff',
    overlay: 'rgba(15, 23, 42, 0.45)',
    gold: '#f9a825',
    goldSoft: '#fff8e1',
    violet: '#7e57c2',
    violetSoft: '#f3e5f5',
    foroSoft: '#e0f7fa',
    gradient: [primaryDark, primary, accent] as [string, string, string],
    gradientHero: [primaryDark, primary] as [string, string],
    gradientGold: ['#f57f17', '#ffb300'] as [string, string],
    gradientViolet: ['#5e35b1', '#7e57c2'] as [string, string],
    gradientForo: [primary, accent] as [string, string],
  };
}

export type ThemeColors = ReturnType<typeof themeFromPortal>;
