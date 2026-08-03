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

/** Paquetes Android habituales (Android 13+ usa com.google.android.tts). */
const ANDROID_SPEECH_PACKAGES = [
  'com.google.android.tts',
  'com.google.android.googlequicksearchbox',
  'com.google.android.as',
];

function loadSpeechModule() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-speech-recognition') as typeof import('expo-speech-recognition');
}

/** Resuelve el servicio de reconocimiento en Android (crítico para APK vs Expo Go). */
export async function resolveAndroidSpeechService(): Promise<string | undefined> {
  if (Platform.OS !== 'android') return undefined;
  try {
    const { ExpoSpeechRecognitionModule } = loadSpeechModule();
    const def = ExpoSpeechRecognitionModule.getDefaultRecognitionService?.();
    if (def?.packageName) return def.packageName;

    const services = ExpoSpeechRecognitionModule.getSpeechRecognitionServices?.() || [];
    for (const pkg of ANDROID_SPEECH_PACKAGES) {
      if (services.includes(pkg)) return pkg;
    }
    return services[0];
  } catch {
    return 'com.google.android.tts';
  }
}

/**
 * Solo usar on-device si el modelo del idioma ya está instalado.
 * Si no → false (red), evita "language supported but not yet downloaded".
 */
export async function shouldUseOnDeviceRecognition(lang: string): Promise<boolean> {
  try {
    const { ExpoSpeechRecognitionModule } = loadSpeechModule();

    if (ExpoSpeechRecognitionModule.supportsOnDeviceRecognition?.() !== true) {
      return false;
    }

    if (Platform.OS === 'ios') {
      return true;
    }

    const androidPkg = await resolveAndroidSpeechService();
    const result = await ExpoSpeechRecognitionModule.getSupportedLocales({
      androidRecognitionServicePackage: androidPkg,
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

export function speechStartOptions(
  lang: string,
  onDevice: boolean,
  androidRecognitionServicePackage?: string,
) {
  return {
    lang,
    interimResults: false as const,
    continuous: false as const,
    requiresOnDeviceRecognition: onDevice,
    ...(Platform.OS === 'android' && androidRecognitionServicePackage
      ? { androidRecognitionServicePackage }
      : {}),
    contextualStrings: [
      'siguiente',
      'anterior',
      'iniciar',
      'finalizar',
      'inscribir',
      'matricular',
      'guardar',
      'limpiar',
    ],
  };
}
