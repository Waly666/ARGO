import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import { radius, space } from '../theme/spacing';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  value: string | number;
  icon: IonName;
  color?: string;
  softColor?: string;
};

export function StatTile({ label, value, icon, color, softColor }: Props) {
  const c = useTheme();
  const main = color ?? c.primary;
  const soft = softColor ?? c.foroSoft;

  return (
    <View style={[styles.tile, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={[styles.icon, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={18} color={main} />
      </View>
      <ScaledText baseSize={22} style={{ color: c.text, fontWeight: '700', marginTop: space.sm }}>
        {value}
      </ScaledText>
      <ScaledText baseSize={11} style={{ color: c.textSoft, marginTop: 2, fontWeight: '500' }}>
        {label}
      </ScaledText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '47%',
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: space.lg,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
