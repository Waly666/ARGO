import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import { radius, space } from '../theme/spacing';

type Props = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

export function FilterChip({ label, active, onPress }: Props) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        shadowIf(active),
        {
          backgroundColor: active ? c.foroSoft : c.card,
          borderColor: active ? c.primary : c.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <ScaledText
        baseSize={13}
        style={{ color: active ? c.primary : c.text, fontWeight: active ? '600' : '500' }}
      >
        {label}
      </ScaledText>
    </Pressable>
  );
}

function shadowIf(active?: boolean) {
  return {};
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + 2,
    marginRight: space.sm,
  },
});
