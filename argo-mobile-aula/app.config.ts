import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  /** Nombre bajo el icono en el teléfono (una sola línea). */
  name: 'Aula Virtual Servial',
  slug: 'finstruvial-aula',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'servialaula',
  splash: {
    image: './assets/branding/logo.png',
    resizeMode: 'contain',
    backgroundColor: '#f8fafc',
  },
  android: {
    versionCode: 10,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#f8fafc',
    },
    package: 'co.servial.aula',
    softwareKeyboardLayoutMode: 'resize',
  },
  plugins: [
    'expo-font',
    'expo-secure-store',
    [
      'expo-camera',
      {
        cameraPermission:
          'La app usa la cámara para escanear el código PDF417 del reverso de la cédula al registrarse.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'La app necesita acceder a sus fotos para adjuntar el comprobante de pago por consignación.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#f8fafc',
        image: './assets/branding/logo.png',
        imageWidth: 220,
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
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://app.servial.edu.co/api',
    eas: {
      projectId: '572bdf10-65ce-47c7-acfb-33aa5a3b3ea1',
    },
  },
};

export default config;
