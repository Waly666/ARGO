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
  primary: { bg: '#eef0ff', fg: '#4f5fd6', border: '#a5b0ff' },
  soft: { bg: '#ede9fe', fg: '#6d28d9', border: '#c4b5fd' },
  mint: { bg: '#d1fae5', fg: '#047857', border: '#6ee7b7' },
  deep: { bg: '#4f5fd6', fg: '#eef0ff', border: '#6d7cff' },
  neutral: { bg: '#f1f5f9', fg: '#64748b', border: '#cbd5e1' },
  pink: { bg: '#fce7f3', fg: '#be185d', border: '#f9a8d4' },
  sky: { bg: '#e0f2fe', fg: '#0369a1', border: '#7dd3fc' },
  peach: { bg: '#ffedd5', fg: '#c2410c', border: '#fdba74' },
  amber: { bg: '#fef3c7', fg: '#b45309', border: '#fcd34d' },
  lavender: { bg: '#ede9fe', fg: '#6d28d9', border: '#c4b5fd' },
  lilac: { bg: '#f3e8ff', fg: '#7e22ce', border: '#d8b4fe' },
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
    return { tone: 'sky', icon: 'play-circle', label: 'En curso' };
  }
  if (e === 'INACTIVO') {
    return { tone: 'amber', icon: 'pause-circle-outline', label: 'Inactiva' };
  }
  return { tone: 'lavender', icon: 'calendar-outline', label: 'Programada' };
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
