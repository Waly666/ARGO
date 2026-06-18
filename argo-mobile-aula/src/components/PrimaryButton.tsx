import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  onPress: () => void;
  icon?: IonName;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  fullWidth,
}: Props) {
  const c = useTheme();
  const bg =
    variant === 'danger' ? c.danger : variant === 'ghost' ? 'transparent' : c.primary;
  const color = variant === 'ghost' ? c.primary : '#fff';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        fullWidth && styles.full,
        {
          backgroundColor: bg,
          borderColor: variant === 'ghost' ? c.primary : 'transparent',
          borderWidth: variant === 'ghost' ? 2 : 0,
          opacity: pressed || disabled || loading ? 0.75 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={color} /> : null}
          <ScaledText baseSize={15} style={{ color, fontWeight: '700' }}>
            {label}
          </ScaledText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
