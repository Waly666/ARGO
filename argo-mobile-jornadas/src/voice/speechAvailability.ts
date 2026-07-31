import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Expo Go no incluye el módulo nativo; hace falta build de desarrollo / APK. */
export function isSpeechNativeAvailable(): boolean {
  if (Constants.appOwnership === 'expo') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-speech-recognition') as {
      ExpoSpeechRecognitionModule?: { isRecognitionAvailable?: () => boolean };
    };
    return Boolean(mod.ExpoSpeechRecognitionModule?.isRecognitionAvailable?.() ?? true);
  } catch {
    return false;
  }
}

export function speechLang(): string {
  return Platform.OS === 'ios' ? 'es-CO' : 'es-ES';
}

function localeMatchesSpanish(code: string): boolean {
  const n = String(code || '').toLowerCase().replace('_', '-');
  return n === 'es' || n.startsWith('es-');
}

/**
 * Solo usar on-device si el modelo del idioma ya está instalado.
 * Si no → false (red), evita "language supported but not yet downloaded".
 */
export async function shouldUseOnDeviceRecognition(lang: string): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ExpoSpeechRecognitionModule } =
      require('expo-speech-recognition') as typeof import('expo-speech-recognition');

    if (ExpoSpeechRecognitionModule.supportsOnDeviceRecognition?.() !== true) {
      return false;
    }

    if (Platform.OS === 'ios') {
      return true;
    }

    const result = await ExpoSpeechRecognitionModule.getSupportedLocales({
      androidRecognitionServicePackage: 'com.google.android.googlequicksearchbox',
    });
    const installed = (result?.installedLocales || []) as string[];
    const want = lang.toLowerCase().replace('_', '-');
    return installed.some((code) => {
      const c = String(code).toLowerCase().replace('_', '-');
      return c === want || localeMatchesSpanish(c);
    });
  } catch {
    return false;
  }
}

export function isOfflineLanguageError(message?: string, errorCode?: string): boolean {
  const m = `${message || ''} ${errorCode || ''}`.toLowerCase();
  return (
    m.includes('not yet downloaded') ||
    m.includes('language-not-downloaded') ||
    m.includes('language not downloaded') ||
    (m.includes('language') && m.includes('download'))
  );
}
