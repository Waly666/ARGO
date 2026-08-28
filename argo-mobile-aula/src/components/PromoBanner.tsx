import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import { radius, space } from '../theme/spacing';
import { shadow } from '../theme/shadows';

type Props = {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onPress?: () => void;
};

/** Banner promocional suave — fondo claro con acento de marca, sin bloques oscuros. */
export function PromoBanner({ title, subtitle, ctaLabel = 'Ver cursos', onPress }: Props) {
  const c = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadow.sm,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: c.primary }]} />
      <View style={styles.body}>
        <ScaledText baseSize={11} style={{ color: c.primary, fontWeight: '600', letterSpacing: 0.6, marginBottom: 6 }}>
          DESTACADO
        </ScaledText>
        <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '700', lineHeight: 26 }}>
          {title}
        </ScaledText>
        {subtitle ? (
          <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 6, lineHeight: 20 }}>
            {subtitle}
          </ScaledText>
        ) : null}
        <View style={styles.ctaRow}>
          <ScaledText baseSize={13} style={{ color: c.primary, fontWeight: '600' }}>
            {ctaLabel}
          </ScaledText>
          <Ionicons name="arrow-forward" size={15} color={c.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: space.lg,
    overflow: 'hidden',
    minHeight: 120,
  },
  accentBar: { width: 4 },
  body: { flex: 1, padding: space.lg },
  ctaRow: {
    marginTop: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
