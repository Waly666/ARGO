import type { ImageSourcePropType } from 'react-native';

/** Azul institucional (splash, login y cabeceras). */
export const CAJERO_AZUL_REY = '#3578F0';
export const CAJERO_AZUL_REY_CLARO = '#6B9AF5';
/** Tiempo mínimo del splash de arranque antes del login (ms). */
export const SPLASH_MIN_MS = 2200;
/**
 * Marca embebida en la app (APK). Mismo logo que el aula virtual.
 * Para otra empresa: reemplace assets/branding/logo.png y regenere el APK.
 */
export const APP_BRANDING = {
  tituloApp: 'ARGO CAJERO',
  nombreEmpresa: 'FUNDACION FINSTRUVIAL',
  logo: require('../../assets/branding/logo.png') as ImageSourcePropType,
} as const;
