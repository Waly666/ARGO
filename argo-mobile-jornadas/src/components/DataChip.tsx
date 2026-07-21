import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';

type IonName = ComponentProps<typeof Ionicons>['name'];

export type ChipTone =
  | 'primary'
  | 'soft'
  | 'mint'
  | 'deep'
  | 'neutral'
  | 'pink'
  | 'sky'
  | 'peach'
  | 'amber'
  | 'lavender'
  | 'lilac'
  | 'slate';

const TONES: Record<ChipTone, { bg: string; fg: string; border: string }> = {
  primary: { bg: '#ecfdf5', fg: '#0f766e', border: '#99f6e4' },
  soft: { bg: '#f0fdfa', fg: '#0f766e', border: '#ccfbf1' },
  mint: { bg: '#ecfdf5', fg: '#047857', border: '#a7f3d0' },
  deep: { bg: '#0d9488', fg: '#ecfdf5', border: '#14b8a6' },
  neutral: { bg: '#f8fafc', fg: '#64748b', border: '#e2e8f0' },
  pink: { bg: '#f8fafc', fg: '#64748b', border: '#e2e8f0' },
  sky: { bg: '#f0fdfa', fg: '#0f766e', border: '#ccfbf1' },
  peach: { bg: '#f8fafc', fg: '#64748b', border: '#e2e8f0' },
  amber: { bg: '#fffbeb', fg: '#92400e', border: '#fde68a' },
  lavender: { bg: '#f8fafc', fg: '#64748b', border: '#e2e8f0' },
  lilac: { bg: '#f8fafc', fg: '#64748b', border: '#e2e8f0' },
  slate: { bg: '#f1f5f9', fg: '#475569', border: '#cbd5e1' },
};

type Props = {
  label: string;
  icon?: IonName;
  tone?: ChipTone;
  style?: ViewStyle;
};

export function DataChip({ label, icon, tone = 'soft', style }: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const t = highContrast
    ? { bg: c.bgAlt, fg: c.text, border: c.border }
    : TONES[tone];

  return (
    <View style={[styles.chip, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      {icon ? <Ionicons name={icon} size={14} color={t.fg} style={styles.icon} /> : null}
      <ScaledText baseSize={12} style={{ color: t.fg, fontWeight: '700' }} numberOfLines={1}>
        {label}
      </ScaledText>
    </View>
  );
}

export function estadoChipTone(estado?: string): { tone: ChipTone; icon: IonName; label: string } {
  const e = String(estado || '').toUpperCase();
  if (e === 'FINALIZADO') {
    return { tone: 'slate', icon: 'checkmark-circle', label: 'Terminada' };
  }
  if (e === 'EN PROCESO') {
    return { tone: 'soft', icon: 'play-circle', label: 'En curso' };
  }
  if (e === 'INACTIVO') {
    return { tone: 'neutral', icon: 'pause-circle-outline', label: 'Inactiva' };
  }
  return { tone: 'neutral', icon: 'calendar-outline', label: 'Programada' };
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  icon: { marginRight: 5 },
});
