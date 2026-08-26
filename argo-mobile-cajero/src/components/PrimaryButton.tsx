import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import { radii, shadows } from '../theme/tokens';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: IonName;
  fullWidth?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  icon,
  fullWidth,
}: Props) {
  const { buttonMultiplier, highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const minH = 52 * buttonMultiplier;
  const padH = 22 * buttonMultiplier;
  const bg =
    variant === 'danger' ? c.danger : variant === 'ghost' ? c.chipBg : c.primary;
  const color = variant === 'ghost' ? c.primary : '#fff';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: minH,
          paddingHorizontal: padH,
          backgroundColor: bg,
          opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
          borderWidth: variant === 'ghost' ? 0 : 0,
          alignSelf: fullWidth ? 'stretch' : 'center',
        },
        variant === 'primary' && !highContrast && !disabled && shadows.button,
        style,
      ]}
      accessibilityRole="button"
    >
      <View style={styles.inner}>
        {icon ? <Ionicons name={icon} size={20} color={color} style={{ marginRight: 8 }} /> : null}
        <ScaledText baseSize={16} style={{ color, textAlign: 'center', fontWeight: '700' }}>
          {label}
        </ScaledText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
