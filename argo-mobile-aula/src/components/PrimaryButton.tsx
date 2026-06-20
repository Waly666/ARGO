import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import { radius, space } from '../theme/spacing';
import { shadow } from '../theme/shadows';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  onPress: () => void;
  icon?: IonName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'light';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'md' | 'lg';
};

export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  fullWidth,
  size = 'md',
}: Props) {
  const c = useTheme();
  const isGhost = variant === 'ghost';
  const isLight = variant === 'light';
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';
  const color = isGhost || isLight ? c.primary : '#fff';
  const py = size === 'lg' ? 16 : 14;

  const content = loading ? (
    <ActivityIndicator color={color} />
  ) : (
    <View style={styles.row}>
      {icon ? <Ionicons name={icon} size={18} color={color} /> : null}
      <ScaledText baseSize={size === 'lg' ? 16 : 15} style={{ color, fontWeight: '700' }}>
        {label}
      </ScaledText>
    </View>
  );

  if (variant === 'primary' && !disabled && !loading) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [fullWidth && styles.full, { opacity: pressed ? 0.9 : 1 }]}
      >
        <View style={[styles.btn, { paddingVertical: py, backgroundColor: c.primary }, shadow.sm]}>
          {content}
        </View>
      </Pressable>
    );
  }

  const bg = isDanger
    ? c.danger
    : isSecondary
      ? c.accentSoft
      : isLight
        ? 'rgba(255,255,255,0.2)'
        : isGhost
          ? 'transparent'
          : c.primary;

  const textColor = isSecondary ? c.primary : isLight ? '#fff' : isGhost ? c.primary : '#fff';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        fullWidth && styles.full,
        shadow.sm,
        {
          paddingVertical: py,
          backgroundColor: bg,
          borderColor: isGhost ? c.primary : isLight ? 'rgba(255,255,255,0.5)' : 'transparent',
          borderWidth: isGhost || isLight ? 1.5 : 0,
          opacity: pressed || disabled || loading ? 0.78 : 1,
        },
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
          <ScaledText baseSize={15} style={{ color: textColor, fontWeight: '700' }}>
            {label}
          </ScaledText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
