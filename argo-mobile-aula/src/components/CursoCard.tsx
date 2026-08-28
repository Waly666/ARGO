import React from 'react';
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CursoVirtual } from '../api/types';
import { CircularProgress } from './CircularProgress';
import { ProgressBar } from './ProgressBar';
import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import type { ThemeColors } from '../theme/colors';
import { etiquetaPrecioCatalogo, fmtPrecioColombia } from '../utils/cursoPrecio';
import { resolveUploadUrl } from '../utils/uploadUrl';
import { radius, space } from '../theme/spacing';

type Props = {
  curso: CursoVirtual;
  onPress: () => void;
  pct?: number;
  layout?: 'vertical' | 'horizontal' | 'catalog' | 'enrolled';
  showBookmark?: boolean;
};

function PortadaPlaceholder({ style, c, size = 24 }: { style: StyleProp<ViewStyle>; c: ThemeColors; size?: number }) {
  return (
    <View style={[style, { backgroundColor: c.bgSoft, alignItems: 'center', justifyContent: 'center' }]}>
      <Ionicons name="school-outline" size={size} color={c.textSoft} />
    </View>
  );
}

export function CursoCard({
  curso,
  onPress,
  pct,
  layout = 'vertical',
  showBookmark = true,
}: Props) {
  const c = useTheme();
  const img =
    resolveUploadUrl(curso.urlPortadaAbsoluta) ||
    resolveUploadUrl(curso.urlPortadaVirtual) ||
    null;
  const progreso = pct ?? curso.progreso?.pctCompletitud ?? 0;
  const precio = etiquetaPrecioCatalogo(curso);

  if (layout === 'enrolled') {
    const horas = curso.horas ? `${curso.horas} h` : 'En línea';
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.enrolledCard,
          { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.96 : 1 },
        ]}
      >
        {img ? (
          <Image source={{ uri: img }} style={styles.enrolledImg} resizeMode="cover" />
        ) : (
          <PortadaPlaceholder style={styles.enrolledImg} c={c} size={22} />
        )}
        <View style={styles.enrolledBody}>
          <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '600' }} numberOfLines={2}>
            {curso.nombreProg}
          </ScaledText>
          <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 4 }}>
            {horas}
          </ScaledText>
          <View style={{ marginTop: space.sm }}>
            <ProgressBar pct={progreso} showPct />
          </View>
        </View>
        <CircularProgress pct={progreso} />
      </Pressable>
    );
  }

  if (layout === 'catalog') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.catalogCard,
          { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.96 : 1 },
        ]}
      >
        {img ? (
          <Image source={{ uri: img }} style={styles.catalogImg} resizeMode="cover" />
        ) : (
          <PortadaPlaceholder style={styles.catalogImg} c={c} />
        )}
        <View style={styles.catalogBody}>
          {curso.categoriaNombre ? (
            <ScaledText baseSize={11} style={{ color: c.textSoft, fontWeight: '500', marginBottom: 2 }}>
              {curso.categoriaNombre}
            </ScaledText>
          ) : null}
          <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '600', lineHeight: 21 }} numberOfLines={2}>
            {curso.nombreProg}
          </ScaledText>
          <ScaledText baseSize={14} style={{ color: c.primary, fontWeight: '600', marginTop: space.sm }}>
            {precio.badgeTone === 'price' ? fmtPrecioColombia(curso.tarifaVirtual) : precio.badge}
          </ScaledText>
        </View>
        {showBookmark ? (
          <Ionicons name="bookmark-outline" size={18} color={c.textSoft} style={styles.bookmark} />
        ) : null}
      </Pressable>
    );
  }

  if (layout === 'horizontal') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.hCard,
          { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.96 : 1 },
        ]}
      >
        {img ? (
          <Image source={{ uri: img }} style={styles.hImg} resizeMode="cover" />
        ) : (
          <PortadaPlaceholder style={styles.hImg} c={c} size={20} />
        )}
        <View style={styles.hBody}>
          <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '600' }} numberOfLines={2}>
            {curso.nombreProg}
          </ScaledText>
          {curso.categoriaNombre ? (
            <ScaledText baseSize={11} style={{ color: c.textSoft, marginTop: 4 }}>
              {curso.categoriaNombre}
            </ScaledText>
          ) : null}
          {progreso > 0 ? (
            <View style={{ marginTop: space.sm }}>
              <ProgressBar pct={progreso} showPct />
            </View>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={c.textSoft} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.96 : 1 },
      ]}
    >
      <View style={styles.imgWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.img} resizeMode="cover" />
        ) : (
          <PortadaPlaceholder style={[styles.img, styles.imgPh]} c={c} size={32} />
        )}
        {curso.categoriaNombre ? (
          <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
            <ScaledText baseSize={10} style={{ color: c.textSoft, fontWeight: '600' }}>
              {curso.categoriaNombre}
            </ScaledText>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '600', lineHeight: 22 }} numberOfLines={2}>
          {curso.nombreProg}
        </ScaledText>
        {progreso > 0 ? (
          <View style={styles.barWrap}>
            <ProgressBar pct={progreso} label="Tu avance" />
          </View>
        ) : (
          <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: space.md, fontWeight: '500' }}>
            {precio.badge}
          </ScaledText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.xl, overflow: 'hidden', marginBottom: space.lg },
  imgWrap: { position: 'relative' },
  img: { width: '100%', height: 160 },
  imgPh: {},
  badge: {
    position: 'absolute',
    left: space.md,
    bottom: space.md,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  body: { padding: space.lg },
  barWrap: { marginTop: space.md },
  hCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: space.md,
    marginBottom: space.md,
    gap: space.md,
  },
  hImg: { width: 72, height: 72, borderRadius: radius.lg, overflow: 'hidden' },
  hBody: { flex: 1 },
  catalogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: space.md,
    marginBottom: space.md,
    gap: space.md,
  },
  catalogImg: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  catalogBody: { flex: 1, paddingRight: space.sm },
  bookmark: { alignSelf: 'flex-start', marginTop: 4 },
  enrolledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: space.md,
    marginBottom: space.md,
    gap: space.md,
  },
  enrolledImg: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  enrolledBody: { flex: 1 },
});
