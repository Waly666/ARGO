import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  cleanDictationText,
  matchVoiceCommand,
  type VoiceCommandDef,
} from './commands';
import {
  canShowVoiceMic,
  isExpoGoClient,
  isNativeAppBuild,
  isOfflineLanguageError,
  isSpeechNativeAvailable,
  resolveAndroidSpeechService,
  shouldUseOnDeviceRecognition,
  speechLang,
  speechStartOptions,
  tryLoadSpeechModule,
  voiceUnavailableMessage,
} from './speechAvailability';

export type VoiceFieldHandlers = {
  focus: () => void;
  getValue: () => string;
  setValue: (text: string) => void;
};

export type VoiceScreenRegistration = {
  screenId: string;
  getFieldOrder: () => string[];
  getCommands: () => VoiceCommandDef[];
  runCommand: (commandId: string) => void | Promise<void>;
};

type PendingConfirm = {
  commandId: string;
  title: string;
  message: string;
};

type VoiceContextValue = {
  recognizing: boolean;
  lastHeard: string;
  focusedFieldId: string | null;
  setFocusedFieldId: (id: string | null) => void;
  registerField: (id: string, handlers: VoiceFieldHandlers) => () => void;
  registerScreen: (reg: VoiceScreenRegistration) => () => void;
  focusNextField: () => void;
  focusPrevField: () => void;
  clearFocusedField: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  pendingConfirm: PendingConfirm | null;
  confirmPending: () => void;
  cancelPending: () => void;
  nativeAvailable: boolean;
  voiceMicVisible: boolean;
  activeScreenId: string | null;
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function useVoice(): VoiceContextValue {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice debe usarse dentro de VoiceProvider');
  return ctx;
}

export function useVoiceOptional(): VoiceContextValue | null {
  return useContext(VoiceContext);
}

type Props = { children: React.ReactNode };

export function VoiceProvider({ children }: Props) {
  const [speechReady, setSpeechReady] = useState(false);
  const voiceMicVisible = speechReady && canShowVoiceMic();
  const nativeAvailable = speechReady && isSpeechNativeAvailable();
  const [recognizing, setRecognizing] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const fieldsRef = useRef(new Map<string, VoiceFieldHandlers>());
  const screenRef = useRef<VoiceScreenRegistration | null>(null);
  const listeningRef = useRef(false);
  /** Si true, forzar reconocimiento por red (tras fallo de modelo offline). */
  const forceNetworkRef = useRef(false);

  const registerField = useCallback((id: string, handlers: VoiceFieldHandlers) => {
    fieldsRef.current.set(id, handlers);
    return () => {
      fieldsRef.current.delete(id);
    };
  }, []);

  const registerScreen = useCallback((reg: VoiceScreenRegistration) => {
    screenRef.current = reg;
    setActiveScreenId(reg.screenId);
    return () => {
      if (screenRef.current?.screenId === reg.screenId) {
        screenRef.current = null;
        setActiveScreenId(null);
      }
    };
  }, []);

  const focusNextField = useCallback(() => {
    const order = screenRef.current?.getFieldOrder() || [];
    if (!order.length) return;
    const cur = focusedFieldId;
    const idx = cur ? order.indexOf(cur) : -1;
    const nextId = order[(idx + 1) % order.length];
    setFocusedFieldId(nextId);
    fieldsRef.current.get(nextId)?.focus();
  }, [focusedFieldId]);

  const focusPrevField = useCallback(() => {
    const order = screenRef.current?.getFieldOrder() || [];
    if (!order.length) return;
    const cur = focusedFieldId;
    const idx = cur ? order.indexOf(cur) : 0;
    const prevId = order[(idx - 1 + order.length) % order.length];
    setFocusedFieldId(prevId);
    fieldsRef.current.get(prevId)?.focus();
  }, [focusedFieldId]);

  const clearFocusedField = useCallback(() => {
    const id = focusedFieldId;
    if (!id) return;
    fieldsRef.current.get(id)?.setValue('');
  }, [focusedFieldId]);

  const applyDictation = useCallback(
    (transcript: string) => {
      const text = cleanDictationText(transcript);
      if (!text) return;

      const screen = screenRef.current;
      const order = screen?.getFieldOrder() || [];
      let targetId = focusedFieldId;
      if (!targetId && order.length === 1) targetId = order[0];
      if (!targetId) {
        Alert.alert(
          'Dictado',
          'Toque un campo de texto y vuelva a usar el micrófono para dictar.',
        );
        return;
      }

      const field = fieldsRef.current.get(targetId);
      if (!field) {
        Alert.alert('Dictado', 'El campo activo ya no está disponible.');
        return;
      }
      field.setValue(text);
      setFocusedFieldId(targetId);
    },
    [focusedFieldId],
  );

  const executeCommand = useCallback(
    async (commandId: string) => {
      if (commandId === 'siguiente') {
        focusNextField();
        return;
      }
      if (commandId === 'anterior') {
        focusPrevField();
        return;
      }
      if (commandId === 'limpiar') {
        clearFocusedField();
        return;
      }
      const run = screenRef.current?.runCommand;
      if (run) await run(commandId);
    },
    [clearFocusedField, focusNextField, focusPrevField],
  );

  const handleFinalTranscript = useCallback(
    (transcript: string) => {
      setLastHeard(transcript);
      const screen = screenRef.current;
      const commands = screen?.getCommands() || [];
      const matched = matchVoiceCommand(transcript, commands);
      if (matched) {
        if (matched.requireConfirm) {
          setPendingConfirm({
            commandId: matched.id,
            title: matched.confirmTitle || 'Confirmar',
            message: matched.confirmMessage || `¿Ejecutar «${matched.id}»?`,
          });
          return;
        }
        void executeCommand(matched.id);
        return;
      }
      applyDictation(transcript);
    },
    [applyDictation, executeCommand],
  );

  const handleFinalTranscriptRef = useRef(handleFinalTranscript);
  handleFinalTranscriptRef.current = handleFinalTranscript;

  useEffect(() => {
    if (!isNativeAppBuild()) return;
    setSpeechReady(true);
  }, []);

  useEffect(() => {
    if (!isNativeAppBuild()) return;

    const mod = tryLoadSpeechModule();
    if (!mod) return;

    const { ExpoSpeechRecognitionModule } = mod;
    let subs: ReturnType<typeof ExpoSpeechRecognitionModule.addListener>[] = [];

    try {
      subs = [
        ExpoSpeechRecognitionModule.addListener('start', () => {
          setRecognizing(true);
          listeningRef.current = true;
        }),
        ExpoSpeechRecognitionModule.addListener('end', () => {
          setRecognizing(false);
          listeningRef.current = false;
        }),
        ExpoSpeechRecognitionModule.addListener('result', (event) => {
          if (!event.isFinal) return;
          const t = event.results?.[0]?.transcript;
          if (t) handleFinalTranscriptRef.current(t);
        }),
        ExpoSpeechRecognitionModule.addListener('error', (event) => {
          setRecognizing(false);
          listeningRef.current = false;
          if (event.error === 'aborted' || event.error === 'no-speech') return;

          if (isOfflineLanguageError(event.message, event.error) && !forceNetworkRef.current) {
            forceNetworkRef.current = true;
            void (async () => {
              try {
                const androidPkg = await resolveAndroidSpeechService();
                ExpoSpeechRecognitionModule.start(
                  speechStartOptions(speechLang(), false, androidPkg),
                );
              } catch {
                Alert.alert(
                  'Voz',
                  'El español offline no está descargado. Conéctese a internet o descargue el idioma en Ajustes → Google → Reconocimiento de voz offline.',
                );
              }
            })();
            return;
          }

          Alert.alert(
            'Voz',
            event.message || `Error de reconocimiento (${event.error || 'desconocido'}).`,
          );
        }),
      ];
    } catch {
      return;
    }

    return () => {
      subs.forEach((s) => s.remove());
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    if (isExpoGoClient()) {
      Alert.alert('Voz no disponible', voiceUnavailableMessage());
      return;
    }

    const mod = tryLoadSpeechModule();
    if (!mod) {
      Alert.alert('Voz no disponible', voiceUnavailableMessage());
      return;
    }

    const { ExpoSpeechRecognitionModule } = mod;

    if (ExpoSpeechRecognitionModule.isRecognitionAvailable?.() === false) {
      Alert.alert('Voz no disponible', voiceUnavailableMessage());
      return;
    }

    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso', 'Necesita permitir micrófono y reconocimiento de voz.');
      return;
    }

    if (listeningRef.current) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    const lang = speechLang();
    const onDevice =
      !forceNetworkRef.current && (await shouldUseOnDeviceRecognition(lang));
    const androidPkg = await resolveAndroidSpeechService();

    ExpoSpeechRecognitionModule.start(speechStartOptions(lang, onDevice, androidPkg));
  }, []);

  const stopListening = useCallback(() => {
    const mod = tryLoadSpeechModule();
    if (!mod) return;
    try {
      mod.ExpoSpeechRecognitionModule.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const confirmPending = useCallback(() => {
    const p = pendingConfirm;
    setPendingConfirm(null);
    if (p) void executeCommand(p.commandId);
  }, [executeCommand, pendingConfirm]);

  const cancelPending = useCallback(() => {
    setPendingConfirm(null);
  }, []);

  const value = useMemo<VoiceContextValue>(
    () => ({
      recognizing,
      lastHeard,
      focusedFieldId,
      setFocusedFieldId,
      registerField,
      registerScreen,
      focusNextField,
      focusPrevField,
      clearFocusedField,
      startListening,
      stopListening,
      pendingConfirm,
      confirmPending,
      cancelPending,
      nativeAvailable,
      voiceMicVisible,
      activeScreenId,
    }),
    [
      recognizing,
      lastHeard,
      focusedFieldId,
      registerField,
      registerScreen,
      focusNextField,
      focusPrevField,
      clearFocusedField,
      startListening,
      stopListening,
      pendingConfirm,
      confirmPending,
      cancelPending,
      nativeAvailable,
      voiceMicVisible,
      activeScreenId,
    ],
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

/**
 * Registra comandos y orden de campos de la pantalla activa.
 * Los campos individuales se registran con `voiceFieldId` en IconInput o `useVoiceField`.
 */
export function useVoiceScreen(
  reg: {
    screenId: string;
    fieldOrder: string[];
    commands: VoiceCommandDef[];
    runCommand: (commandId: string) => void | Promise<void>;
    enabled?: boolean;
  },
) {
  const voice = useVoice();
  const runRef = useRef(reg.runCommand);
  runRef.current = reg.runCommand;
  const fieldOrderRef = useRef(reg.fieldOrder);
  fieldOrderRef.current = reg.fieldOrder;
  const commandsRef = useRef(reg.commands);
  commandsRef.current = reg.commands;
  const enabled = reg.enabled !== false;
  const screenId = reg.screenId;

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      return voice.registerScreen({
        screenId,
        getFieldOrder: () => fieldOrderRef.current,
        getCommands: () => commandsRef.current,
        runCommand: (id) => runRef.current(id),
      });
    }, [voice, screenId, enabled]),
  );
}

/** Registra un campo de texto para dictado / foco por voz. */
export function useVoiceField(
  fieldId: string | undefined,
  handlers: VoiceFieldHandlers,
  opts?: { enabled?: boolean },
) {
  const voice = useVoiceOptional();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!voice || !fieldId || opts?.enabled === false) return;
    return voice.registerField(fieldId, {
      focus: () => handlersRef.current.focus(),
      getValue: () => handlersRef.current.getValue(),
      setValue: (t) => handlersRef.current.setValue(t),
    });
  }, [voice, fieldId, opts?.enabled]);
}
