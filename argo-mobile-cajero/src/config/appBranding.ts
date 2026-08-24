import type { ImageSourcePropType } from 'react-native';

/** Azul institucional (splash, login y cabeceras). */
export const CAJERO_AZUL_REY = '#3578F0';
export const CAJERO_AZUL_REY_CLARO = '#6B9AF5';
/** Tiempo mínimo del splash de arranque antes del login (ms). */
export const SPLASH_MIN_MS = 2200;
/**
 * Valores por defecto si el servidor aún no responde (sin conexión o primer arranque).
 * Logo y nombre reales se cargan desde GET /auth/config (Config → Empresa en el ERP).
 */
export const APP_BRANDING = {
  tituloApp: 'ARGO CAJERO',
  /** Texto genérico hasta cargar la marca del servidor. */
  nombreEmpresaFallback: 'Centro de formación',
  logo: require('../../assets/branding/logo.png') as ImageSourcePropType,
} as const;
