import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import type { CursoVirtual } from '../api/types';
import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import { resolveUploadUrl } from '../utils/uploadUrl';

type Props = {
  curso: CursoVirtual;
  onPress: () => void;
  pct?: number;
};

export function CursoCard({ curso, onPress, pct }: Props) {
  const c = useTheme();
  const img =
    resolveUploadUrl(curso.urlPortadaAbsoluta) ||
    resolveUploadUrl(curso.urlPortadaVirtual) ||
    null;
  const progreso = pct ?? curso.progreso?.pctCompletitud ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.92 : 1 },
      ]}
    >
      {img ? (
        <Image source={{ uri: img }} style={styles.img} resizeMode="cover" />
      ) : (
        <View style={[styles.img, styles.imgPh, { backgroundColor: c.accentSoft }]} />
      )}
      <View style={styles.body}>
        <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '700' }} numberOfLines={2}>
          {curso.nombreProg}
        </ScaledText>
        {curso.categoriaNombre ? (
          <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 4 }}>
            {curso.categoriaNombre}
          </ScaledText>
        ) : null}
        {progreso > 0 ? (
          <View style={styles.barWrap}>
            <View style={[styles.barBg, { backgroundColor: c.border }]}>
              <View style={[styles.barFill, { width: `${Math.min(100, progreso)}%`, backgroundColor: c.primary }]} />
            </View>
            <ScaledText baseSize={11} style={{ color: c.textSoft, marginTop: 4 }}>
              {Math.round(progreso)}% completado
            </ScaledText>
          </View>
        ) : curso.tarifaVirtual > 0 ? (
          <ScaledText baseSize={13} style={{ color: c.primary, marginTop: 6, fontWeight: '600' }}>
            ${curso.tarifaVirtual.toLocaleString('es-CO')}
          </ScaledText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  img: { width: '100%', height: 140 },
  imgPh: {},
  body: { padding: 12 },
  barWrap: { marginTop: 8 },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
});
