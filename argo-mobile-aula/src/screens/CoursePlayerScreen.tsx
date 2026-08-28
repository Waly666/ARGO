import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Speech from 'expo-speech';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { ScaledText } from '../components/ScaledText';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchProgreso } from '../api/aulaApi';
import { getApiBaseUrl } from '../config/apiBase';
import type { RootStackParamList } from '../navigation/types';
import {
  buildCoursePlayerBridgeScript,
  buildCoursePlayerInitScript,
  COURSE_PLAYER_EARLY_BOOT,
  COURSE_PLAYER_MOBILE_HOOKS,
  COURSE_PLAYER_REVEAL_TYPEWRITER,
  COURSE_PLAYER_RN_BRIDGE,
  COURSE_PLAYER_SCROLL_FIX,
} from '../utils/coursePlayerBridge';

type WebMsg =
  | { type: 'ARGO_PROGRESO_ACTUALIZADO' }
  | { type: 'SERVIAL_TTS'; id: number; text: string; lang?: string; rate?: number }
  | { type: 'SERVIAL_TTS_CANCEL' };

/**
 * Scroll nativo del WebView (mismo patrón que DocumentoHtmlScreen).
 * En Android, ScrollView + WebView bloquea los gestos; el WebView a pantalla completa sí scrollea.
 */
export default function CoursePlayerScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'CoursePlayer'>>();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const c = useTheme();
  const webRef = useRef<WebView>(null);
  const readyUrlRef = useRef('');
  const [loading, setLoading] = useState(true);
  const token = state.status === 'signedIn' ? state.token : null;

  const sendInit = useCallback(() => {
    if (!token || !webRef.current) return;
    const payload = {
      type: 'ARGO_INIT',
      apiUrl: `${getApiBaseUrl()}/aula-virtual`,
      token,
      idPrograma: route.params.idPrograma,
      storagePrefix: route.params.storagePrefix,
    };
    const sync = { type: 'ARGO_SYNC_REQUEST' };
    webRef.current.injectJavaScript(buildCoursePlayerInitScript(payload, sync));
  }, [token, route.params.idPrograma, route.params.storagePrefix]);

  const applyMobileFixes = useCallback(() => {
    webRef.current?.injectJavaScript(COURSE_PLAYER_SCROLL_FIX);
    webRef.current?.injectJavaScript(COURSE_PLAYER_MOBILE_HOOKS);
    webRef.current?.injectJavaScript(COURSE_PLAYER_REVEAL_TYPEWRITER);
  }, []);

  const notifyTtsEnd = useCallback((id: number, error = false) => {
    webRef.current?.injectJavaScript(`
      window.dispatchEvent(new MessageEvent('message', { data: { type: 'SERVIAL_TTS_END', id: ${id}, error: ${error ? 'true' : 'false'} } }));
      true;
    `);
  }, []);

  const onPageReady = useCallback(
    (url: string) => {
      if (!url) return;
      setLoading(false);

      if (readyUrlRef.current !== url) {
        readyUrlRef.current = url;
      }

      applyMobileFixes();
      webRef.current?.injectJavaScript(buildCoursePlayerBridgeScript(getApiBaseUrl()));
      webRef.current?.injectJavaScript(COURSE_PLAYER_RN_BRIDGE);
      sendInit();
      setTimeout(() => {
        applyMobileFixes();
        sendInit();
      }, 700);
    },
    [applyMobileFixes, sendInit],
  );

  useEffect(() => {
    const poll = setInterval(() => {
      void fetchProgreso(route.params.idPrograma).catch(() => {});
    }, 30000);
    return () => {
      clearInterval(poll);
      Speech.stop();
    };
  }, [route.params.idPrograma]);

  function onMessage(ev: WebViewMessageEvent) {
    let data: WebMsg;
    try {
      data = JSON.parse(ev.nativeEvent.data) as WebMsg;
    } catch {
      return;
    }

    if (data.type === 'ARGO_PROGRESO_ACTUALIZADO') {
      void fetchProgreso(route.params.idPrograma).catch(() => {});
      return;
    }

    if (data.type === 'SERVIAL_TTS_CANCEL') {
      Speech.stop();
      return;
    }

    if (data.type === 'SERVIAL_TTS' && data.text?.trim()) {
      Speech.stop();
      const rate = Math.min(1.15, Math.max(0.75, (data.rate || 1) * 0.92));
      Speech.speak(data.text, {
        language: data.lang || 'es-CO',
        rate,
        onDone: () => notifyTtsEnd(data.id, false),
        onStopped: () => notifyTtsEnd(data.id, false),
        onError: () => notifyTtsEnd(data.id, true),
      });
    }
  }

  const onClose = useCallback(() => {
    Speech.stop();
    sendInit();
    setTimeout(() => nav.goBack(), 400);
  }, [nav, sendInit]);

  useLayoutEffect(() => {
    nav.setOptions({
      title: route.params.titulo,
      gestureEnabled: false,
      headerRight: () => (
        <ScaledText
          baseSize={14}
          onPress={onClose}
          style={{ color: '#fff', marginRight: 16, fontWeight: '700' }}
        >
          Cerrar
        </ScaledText>
      ),
    });
  }, [nav, route.params.titulo, onClose]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]} collapsable={false}>
      {loading ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : null}
      <WebView
        ref={webRef}
        source={{ uri: route.params.playerUrl }}
        onLoadEnd={(e) => onPageReady(e.nativeEvent.url)}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        nestedScrollEnabled
        scrollEnabled
        setSupportMultipleWindows={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        textZoom={100}
        scalesPageToFit={false}
        injectedJavaScriptBeforeContentLoaded={COURSE_PLAYER_EARLY_BOOT}
        injectedJavaScript={COURSE_PLAYER_SCROLL_FIX}
        onShouldStartLoadWithRequest={() => true}
        onError={(e) =>
          Alert.alert('Curso', e.nativeEvent.description || 'No se pudo cargar el contenido')
        }
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 400) {
            Alert.alert('Curso', `No se pudo abrir el curso (HTTP ${e.nativeEvent.statusCode}).`);
          }
        }}
        style={[styles.webview, { backgroundColor: c.bg }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  webview: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
