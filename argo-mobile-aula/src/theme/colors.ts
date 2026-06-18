import type { PortalTemaConfig } from '../api/types';

export function themeFromPortal(tema: PortalTemaConfig) {
  return {
    primary: tema.colorPrimario || '#1565c0',
    primaryDark: tema.colorPrimarioOscuro || '#0d47a1',
    accent: tema.colorAcento || '#00acc1',
    bg: tema.colorFondo || '#f5f7fa',
    card: tema.colorSuperficie || '#ffffff',
    text: tema.colorTexto || '#1a237e',
    textSoft: tema.colorTextoSecundario || '#5c6bc0',
    border: '#e2e8f0',
    ok: '#2e7d32',
    warn: '#f57c00',
    danger: '#c62828',
    accentSoft: '#e3f2fd',
  };
}

export type ThemeColors = ReturnType<typeof themeFromPortal>;
