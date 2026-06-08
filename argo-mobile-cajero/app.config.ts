import type { ExpoConfig } from 'expo/config';

/**
 * APK cajero/admin ARGO. En `.env`:
 *   EXPO_PUBLIC_API_BASE_URL=http://72.60.175.120:5002/api
 * En LAN local: http://192.168.x.x:3000/api
 */
const config: ExpoConfig = {
  name: 'ARGO Cajero',
  slug: 'argo-cajero',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'argocajero',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1a237e',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1a237e',
    },
    package: 'co.argo.cajero',
  },
  plugins: [
    'expo-font',
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
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3000/api',
    eas: {
      projectId: 'cff70a8f-b9ea-4d75-ac50-c9b7cd8a99c6',
    },
  },
};

export default config;
