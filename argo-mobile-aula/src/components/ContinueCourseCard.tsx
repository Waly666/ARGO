import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CursoVirtual } from '../api/types';
import { ProgressBar } from './ProgressBar';
import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import { pctCurso } from '../utils/cursoUtils';
import { resolveUploadUrl } from '../utils/uploadUrl';
import { radius, space } from '../theme/spacing';

type Props = {
  curso: CursoVirtual;
  onPress: () => void;
};

export function ContinueCourseCard({ curso, onPress }: Props) {
  const c = useTheme();
  const img =
    resolveUploadUrl(curso.urlPortadaAbsoluta) || resolveUploadUrl(curso.urlPortadaVirtual);
  const pct = pctCurso(curso);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.96 : 1 },
      ]}
    >
      <View style={styles.row}>
        {img ? (
          <Image source={{ uri: img }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, { backgroundColor: c.bgSoft, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="book-outline" size={24} color={c.textSoft} />
          </View>
        )}
        <View style={styles.body}>
          <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '600' }} numberOfLines={2}>
            {curso.nombreProg}
          </ScaledText>
          <View style={{ marginTop: space.md }}>
            <ProgressBar pct={pct} label="Progreso" />
          </View>
        </View>
        <View style={[styles.play, { backgroundColor: c.accentSoft }]}>
          <Ionicons name="play" size={16} color={c.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: space.md,
    marginBottom: space.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  body: { flex: 1 },
  play: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
