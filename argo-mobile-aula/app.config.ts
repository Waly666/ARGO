import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  /** Nombre bajo el icono en el teléfono (una sola línea). */
  name: 'Aula Virtual',
  slug: 'finstruvial-aula',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'finstruvialaula',
  splash: {
    image: './assets/branding/logo.png',
    resizeMode: 'contain',
    backgroundColor: '#f8fafc',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'co.finstruvial.aula',
    softwareKeyboardLayoutMode: 'resize',
  },
  plugins: [
    'expo-font',
    'expo-secure-store',
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
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://app.finstruvial.edu.co/api',
    eas: {
      projectId: '572bdf10-65ce-47c7-acfb-33aa5a3b3ea1',
    },
  },
};

export default config;
