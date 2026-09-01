import type { ImageSourcePropType } from 'react-native';

/** Azul institucional fintech (login, cabeceras, iconos). */
export const ARGO_AZUL_REY = '#3D5CFF';
export const ARGO_AZUL_REY_CLARO = '#6B84FF';
export const ARGO_NAVY = '#0B1026';
export const ARGO_NAVY_SOFT = '#151B33';
/** Fondo del splash nativo y de arranque. */
export const SPLASH_BG = '#FFFFFF';
export const SPLASH_MIN_MS = 2200;

/** Alias histórico — ahora apunta al azul institucional. */
export const JORNADAS_VERDE = ARGO_AZUL_REY;
export const JORNADAS_VERDE_CLARO = ARGO_AZUL_REY_CLARO;

export const APP_BRANDING = {
  tituloApp: 'ARGO Jornadas',
  nombreEmpresaFallback: 'FINSTRUVIAL',
  logo: require('../../assets/branding/logo.png') as ImageSourcePropType,
} as const;

export const UBICACIONES_CLASE = [
  'Carpa',
  'Domo',
  'Empresa',
  'Colegio',
  'Auditorio',
  'Coliseo',
  'Estadio',
  'Otro',
] as const;
