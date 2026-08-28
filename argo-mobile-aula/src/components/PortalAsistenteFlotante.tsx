import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as Speech from 'expo-speech';

import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import type { PortalAsistenteViewConfig } from '../api/types';
import { resolveAsistenteVideoUrl } from '../utils/asistenteVideoUrl';
import { shadow } from '../theme/shadows';
import { space } from '../theme/spacing';

type Props = {
  config: PortalAsistenteViewConfig;
  /** Espacio extra sobre el borde inferior (p. ej. barra de pestañas). */
  extraBottom?: number;
};

const SIZE = 96;
const MARGIN = 16;

export function PortalAsistenteFlotante({ config, extraBottom = 0 }: Props) {
  const c = useTheme();
  const texto = config.asistenteTexto?.trim() || '';
  const videoUrl = resolveAsistenteVideoUrl(config);
  const [bubble, setBubble] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragMoved = useRef(false);

  const { width: screenW, height: screenH } = Dimensions.get('window');
  const pan = useRef(
    new Animated.ValueXY({
      x: screenW - SIZE - MARGIN,
      y: screenH - SIZE - MARGIN - extraBottom - 80,
    }),
  ).current;

  const showBubble = useCallback((msg: string, ms = 6000) => {
    setBubble(msg);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(''), ms);
  }, []);

  useEffect(() => {
    showBubble('Hola, soy tu guía. Arrástrame y toca para escuchar el mensaje.', 5000);
    return () => {
      Speech.stop();
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    };
  }, [showBubble]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          dragMoved.current = false;
          pan.setOffset({
            x: (pan.x as Animated.Value & { _value: number })._value,
            y: (pan.y as Animated.Value & { _value: number })._value,
          });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: (_, g) => {
          if (Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6) dragMoved.current = true;
          pan.setValue({ x: g.dx, y: g.dy });
        },
        onPanResponderRelease: () => {
          pan.flattenOffset();
          const x = (pan.x as Animated.Value & { _value: number })._value;
          const y = (pan.y as Animated.Value & { _value: number })._value;
          const maxX = screenW - SIZE - MARGIN;
          const maxY = screenH - SIZE - MARGIN - extraBottom;
          const clampedX = Math.min(Math.max(MARGIN, x), maxX);
          const clampedY = Math.min(Math.max(MARGIN + 40, y), maxY);
          Animated.spring(pan, {
            toValue: { x: clampedX, y: clampedY },
            useNativeDriver: false,
            friction: 7,
          }).start();
        },
      }),
    [extraBottom, pan, screenH, screenW],
  );

  function onMascotPress() {
    if (dragMoved.current) return;
    if (!texto) {
      showBubble('No hay mensaje configurado para el asistente.');
      return;
    }
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    showBubble(texto, 12000);
    Speech.speak(texto, {
      language: 'es-CO',
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  if (!texto) return null;

  return (
    <Animated.View
      style={[styles.root, { transform: pan.getTranslateTransform() }]}
      {...panResponder.panHandlers}
      pointerEvents="box-none"
    >
      {bubble ? (
        <View style={[styles.bubble, { backgroundColor: c.card, borderColor: c.border }, shadow.md]}>
          <ScaledText baseSize={12} style={{ color: c.text, lineHeight: 18 }}>
            {bubble}
          </ScaledText>
        </View>
      ) : null}

      <Pressable
        onPress={onMascotPress}
        accessibilityRole="button"
        accessibilityLabel="Asistente virtual. Arrástralo y toca para escuchar."
        style={({ pressed }) => [
          styles.mascot,
          speaking && styles.mascotSpeaking,
          { opacity: pressed ? 0.92 : 1 },
        ]}
      >
        {videoUrl ? (
          <Video
            source={{ uri: videoUrl }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            isMuted
            shouldPlay
          />
        ) : (
          <View style={[styles.fallback, { backgroundColor: c.foroSoft }]} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SIZE,
    height: SIZE + 80,
    zIndex: 900,
  },
  bubble: {
    position: 'absolute',
    bottom: SIZE + 8,
    right: 0,
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    padding: space.sm,
  },
  mascot: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotSpeaking: {
    transform: [{ scale: 1.04 }],
  },
  video: {
    width: SIZE,
    height: SIZE,
  },
  fallback: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
});
