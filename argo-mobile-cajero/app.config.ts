import type { ExpoConfig } from 'expo/config';

/**
 * APK cajero/admin ARGO. En `.env`:
 *   EXPO_PUBLIC_API_BASE_URL=http://72.60.175.120:5002/api
 * En LAN local: http://192.168.x.x:3000/api
 *
 * Splash: Android 12+ solo admite color de fondo + logo centrado (no imagen full-screen).
 * Expo Go ignora el splash y muestra el icono en blanco — usar APK o `pnpm android`.
 */
const SPLASH_BG = '#FFFFFF';
/** Azul cabeceras/login (independiente del splash). */
const AZUL = '#3578F0';
const LOGO = './assets/branding/logo.png';
const ICON = './assets/branding/icon-app.png';
const SPLASH_IOS = './assets/branding/splash-full.png';

const splashPlugin = {
  backgroundColor: SPLASH_BG,
  image: LOGO,
  imageWidth: 240,
  resizeMode: 'contain' as const,
  android: {
    backgroundColor: SPLASH_BG,
    image: LOGO,
    imageWidth: 240,
    resizeMode: 'contain' as const,
  },
  ios: {
    backgroundColor: SPLASH_BG,
    image: SPLASH_IOS,
    resizeMode: 'cover' as const,
    enableFullScreenImage_legacy: true,
  },
};

const config: ExpoConfig = {
  name: 'ARGO Cajero',
  slug: 'argo-cajero',
  version: '0.1.3',
  orientation: 'portrait',
  icon: ICON,
  backgroundColor: AZUL,
  primaryColor: AZUL,
  userInterfaceStyle: 'light',
  scheme: 'argocajero',
  splash: {
    image: LOGO,
    resizeMode: 'contain',
    backgroundColor: SPLASH_BG,
  },
  android: {
    icon: ICON,
    splash: {
      image: LOGO,
      resizeMode: 'contain',
      backgroundColor: SPLASH_BG,
    },
    adaptiveIcon: {
      foregroundImage: ICON,
      backgroundColor: SPLASH_BG,
    },
    package: 'co.argo.cajero',
  },
  androidNavigationBar: {
    backgroundColor: AZUL,
  },
  ios: {
    icon: ICON,
    splash: {
      image: SPLASH_IOS,
      resizeMode: 'cover',
      backgroundColor: SPLASH_BG,
    },
  },
  plugins: [
    'expo-font',
    ['expo-splash-screen', splashPlugin],
    [
      'expo-image-picker',
      {
        photosPermission:
          'ARGO Cajero necesita acceso a fotos para adjuntar documentos y escanear cédulas.',
        cameraPermission:
          'ARGO Cajero usa la cámara para fotografiar la cédula (frente arriba, respaldo abajo).',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'ARGO Cajero usa la cámara con marco guía para escanear la cédula del alumno.',
      },
    ],
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: ICON,
        color: AZUL,
      },
    ],
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
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3000/api',
    eas: {
      projectId: 'cff70a8f-b9ea-4d75-ac50-c9b7cd8a99c6',
    },
  },
};

export default config;
