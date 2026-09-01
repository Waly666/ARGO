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
  primary: { bg: '#eef2ff', fg: '#3D5CFF', border: '#c7d2fe' },
  soft: { bg: '#f0f4ff', fg: '#2B46E0', border: '#dbe4ff' },
  mint: { bg: '#ecfdf5', fg: '#047857', border: '#a7f3d0' },
  deep: { bg: '#3D5CFF', fg: '#eef2ff', border: '#6B84FF' },
  neutral: { bg: '#f8fafc', fg: '#64748b', border: '#e2e8f0' },
  pink: { bg: '#f8fafc', fg: '#64748b', border: '#e2e8f0' },
  sky: { bg: '#e0f2fe', fg: '#0369a1', border: '#7dd3fc' },
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
  if (e === 'PROGRAMADA' || e === 'INACTIVO') {
    return { tone: 'neutral', icon: 'calendar-outline', label: 'Programada' };
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
