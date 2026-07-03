import type { ImageSourcePropType } from 'react-native';

export const JORNADAS_VERDE = '#0d9488';
export const JORNADAS_VERDE_CLARO = '#14b8a6';
export const SPLASH_MIN_MS = 1800;

export const APP_BRANDING = {
  tituloApp: 'ARGO Jornadas',
  nombreEmpresa: 'Capacitación en campo',
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
