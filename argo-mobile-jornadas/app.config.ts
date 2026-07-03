import type { ExpoConfig } from 'expo/config';

/**
 * App móvil instructores — jornadas de capacitación (carpa).
 * `.env`: EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:3000/api
 */
const VERDE = '#0d9488';
const LOGO = './assets/branding/logo.png';
const ICON = './assets/branding/icon-app.png';
const SPLASH_IOS = './assets/branding/splash-full.png';

const splashPlugin = {
  backgroundColor: VERDE,
  image: LOGO,
  imageWidth: 240,
  resizeMode: 'contain' as const,
  android: {
    backgroundColor: VERDE,
    image: LOGO,
    imageWidth: 240,
    resizeMode: 'contain' as const,
  },
  ios: {
    backgroundColor: VERDE,
    image: SPLASH_IOS,
    resizeMode: 'cover' as const,
    enableFullScreenImage_legacy: true,
  },
};

const config: ExpoConfig = {
  name: 'ARGO Jornadas',
  slug: 'argo-jornadas',
  version: '0.1.0',
  orientation: 'portrait',
  icon: ICON,
  backgroundColor: VERDE,
  primaryColor: VERDE,
  userInterfaceStyle: 'light',
  scheme: 'argojornadas',
  splash: {
    image: LOGO,
    resizeMode: 'contain',
    backgroundColor: VERDE,
  },
  android: {
    icon: ICON,
    splash: {
      image: LOGO,
      resizeMode: 'contain',
      backgroundColor: VERDE,
    },
    adaptiveIcon: {
      foregroundImage: ICON,
      backgroundColor: VERDE,
    },
    package: 'co.argo.jornadas',
  },
  androidNavigationBar: {
    backgroundColor: VERDE,
  },
  ios: {
    icon: ICON,
    splash: {
      image: SPLASH_IOS,
      resizeMode: 'cover',
      backgroundColor: VERDE,
    },
  },
  plugins: [
    'expo-font',
    ['expo-splash-screen', splashPlugin],
    [
      'expo-image-picker',
      {
        photosPermission: 'ARGO Jornadas necesita acceso a fotos para la evidencia de la clase.',
        cameraPermission: 'ARGO Jornadas usa la cámara para tomar la foto de evidencia en carpa.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'ARGO Jornadas usa la cámara para escanear el QR de la etiqueta del alumno y para evidencia.',
      },
    ],
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
          enableMinifyInReleaseBuilds: false,
          enableShrinkResourcesInReleaseBuilds: false,
        },
      },
    ],
  ],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://app.finstruvial.edu.co/api',
  },
};

export default config;
