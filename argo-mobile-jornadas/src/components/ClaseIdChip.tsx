import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';

/** ID corto legible (últimos 6 del ObjectId). */
export function formatoIdClaseCorto(id?: string | null): string {
  const s = String(id || '').trim();
  if (!s) return '—';
  return s.slice(-6).toUpperCase();
}

type Props = {
  id?: string | null;
  /** Muestra el ObjectId completo debajo del corto. */
  completo?: boolean;
};

export function ClaseIdChip({ id, completo }: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const corto = formatoIdClaseCorto(id);
  const full = String(id || '').trim();

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: highContrast ? c.bgAlt : c.pastelSky,
          borderColor: highContrast ? c.border : c.pastelSkyBorder,
        },
      ]}
    >
      <Ionicons name="key-outline" size={13} color={c.pastelSkyFg} style={{ marginRight: 4 }} />
      <View style={{ flexShrink: 1 }}>
        <ScaledText
          baseSize={11}
          style={{ color: c.pastelSkyFg, fontWeight: '800', letterSpacing: 0.6 }}
        >
          ID {corto}
        </ScaledText>
        {completo && full ? (
          <ScaledText
            baseSize={10}
            style={{ color: c.textSoft, marginTop: 2, fontVariant: ['tabular-nums'] }}
            numberOfLines={1}
          >
            {full}
          </ScaledText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
});
