import type { ImageSourcePropType } from 'react-native';

/** Azul institucional fintech (login, cabeceras, iconos). */
export const CAJERO_AZUL_REY = '#3D5CFF';
export const CAJERO_AZUL_REY_CLARO = '#6B84FF';
export const CAJERO_NAVY = '#0B1026';
export const CAJERO_NAVY_SOFT = '#151B33';
/** Fondo del splash nativo y de arranque (logo Servial con margen blanco). */
export const SPLASH_BG = '#FFFFFF';
/** Tiempo mínimo del splash de arranque antes del login (ms). */
export const SPLASH_MIN_MS = 2200;
/**
 * Valores por defecto si el servidor aún no responde (sin conexión o primer arranque).
 * Logo y nombre reales se cargan desde GET /auth/config (Config → Empresa en el ERP).
 */
export const APP_BRANDING = {
  tituloApp: 'ARGO CAJERO',
  /** Texto genérico hasta cargar la marca del servidor. */
  nombreEmpresaFallback: 'CEA SERVIAL COLOMBIA',
  logo: require('../../assets/branding/logo.png') as ImageSourcePropType,
} as const;
