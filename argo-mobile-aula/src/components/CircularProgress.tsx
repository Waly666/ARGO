import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';

type Props = {
  pct: number;
  size?: number;
};

/** Indicador circular de progreso (estilo mockup, sin dependencias extra). */
export function CircularProgress({ pct, size = 54 }: Props) {
  const c = useTheme();
  const clamped = Math.round(Math.max(0, Math.min(100, pct)));
  const done = clamped >= 100;

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: c.primary,
          backgroundColor: done ? c.accentSoft : `${c.primary}12`,
        },
      ]}
    >
      <ScaledText baseSize={11} style={{ color: c.primary, fontWeight: '800' }}>
        {clamped}%
      </ScaledText>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
