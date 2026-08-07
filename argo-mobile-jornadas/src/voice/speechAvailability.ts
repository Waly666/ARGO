import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type SpeechModule = typeof import('expo-speech-recognition');

/** Solo APK / dev build nativo. En Expo Go nunca cargar el módulo de voz. */
export function isNativeAppBuild(): boolean {
  const env = Constants.executionEnvironment;
  if (env === ExecutionEnvironment.Standalone || env === ExecutionEnvironment.Bare) {
    return true;
  }
  if (env === ExecutionEnvironment.StoreClient) return false;
  return Constants.appOwnership === 'standalone';
}

export function isExpoGoClient(): boolean {
  return !isNativeAppBuild();
}

function loadSpeechModuleUnsafe(): SpeechModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-speech-recognition') as SpeechModule;
}

/**
 * Carga el módulo solo en build nativo. Retorna null en Expo Go o si falta el nativo.
 */
export function tryLoadSpeechModule(): SpeechModule | null {
  if (Platform.OS === 'web') return null;
  if (!isNativeAppBuild()) return null;
  try {
    const mod = loadSpeechModuleUnsafe();
    if (!mod?.ExpoSpeechRecognitionModule) return null;
    return mod;
  } catch {
    return null;
  }
}

export function isSpeechModulePresent(): boolean {
  return tryLoadSpeechModule() != null;
}

/** Micrófono habilitado (APK con módulo compilado). */
export function canShowVoiceMic(): boolean {
  return isSpeechModulePresent();
}

/** Reconocimiento usable al pulsar el micrófono. */
export function isSpeechNativeAvailable(): boolean {
  const mod = tryLoadSpeechModule();
  if (!mod) return false;
  try {
    return mod.ExpoSpeechRecognitionModule.isRecognitionAvailable?.() !== false;
  } catch {
    return false;
  }
}

export function voiceUnavailableMessage(): string {
  if (isExpoGoClient()) {
    return 'El reconocimiento de voz requiere la APK de ARGO Jornadas (no funciona en Expo Go).';
  }
  if (!isSpeechModulePresent()) {
    return 'Esta versión de la app no incluye el módulo de voz. Instale la APK actualizada de ARGO Jornadas.';
  }
  return 'El dispositivo no tiene servicio de reconocimiento de voz. Instale/actualice la app de Google o active el reconocimiento en Ajustes del teléfono.';
}

export function speechLang(): string {
  return Platform.OS === 'ios' ? 'es-CO' : 'es-ES';
}

function localeMatchesSpanish(code: string): boolean {
  const n = String(code || '').toLowerCase().replace('_', '-');
  return n === 'es' || n.startsWith('es-');
}

const ANDROID_SPEECH_PACKAGES = [
  'com.google.android.tts',
  'com.google.android.googlequicksearchbox',
  'com.google.android.as',
];

/** Resuelve el servicio de reconocimiento en Android (crítico para APK vs Expo Go). */
export async function resolveAndroidSpeechService(): Promise<string | undefined> {
  if (Platform.OS !== 'android') return undefined;
  try {
    const mod = tryLoadSpeechModule();
    if (!mod) return 'com.google.android.tts';
    const { ExpoSpeechRecognitionModule } = mod;
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

export async function shouldUseOnDeviceRecognition(lang: string): Promise<boolean> {
  try {
    const mod = tryLoadSpeechModule();
    if (!mod) return false;
    const { ExpoSpeechRecognitionModule } = mod;

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
