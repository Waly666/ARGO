import type { ImageSourcePropType } from 'react-native';

/** Paleta institucional (misma familia que ARGO Mobile Cajero). */
export const AULA_AZUL_REY = '#3D5CFF';
export const AULA_AZUL_REY_CLARO = '#6B84FF';
export const AULA_NAVY = '#0B1026';
export const AULA_NAVY_SOFT = '#151B33';
export const SPLASH_BG = '#FFFFFF';

/**
 * Respaldo embebido (sin red o primer arranque).
 * Logo y nombre reales se cargan desde GET /aula-virtual/config y /auth/config.
 */
export const APP_BRANDING = {
  tituloApp: 'AULA VIRTUAL',
  nombreEmpresaFallback: 'CEA SERVIAL COLOMBIA',
  logo: require('../../assets/branding/logo.png') as ImageSourcePropType,
} as const;
