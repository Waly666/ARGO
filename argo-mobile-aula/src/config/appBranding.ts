import type { ImageSourcePropType } from 'react-native';

/**
 * Marca embebida en la app (APK). No depende de red ni del servidor.
 * Para otra empresa: cambie tituloApp / nombreEmpresa, reemplace assets/branding/logo.png
 * y vuelva a generar el APK.
 */
export const APP_BRANDING = {
  /** Título principal (debajo del logo). */
  tituloApp: 'AULA VIRTUAL',
  /** Nombre legal o comercial de la empresa. */
  nombreEmpresa: 'FUNDACION FINSTRUVIAL',
  logo: require('../../assets/branding/logo.png') as ImageSourcePropType,
} as const;
