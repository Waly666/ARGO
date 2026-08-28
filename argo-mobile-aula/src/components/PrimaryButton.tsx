import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';
import { shadow } from '../theme/shadows';
import { radius, space } from '../theme/spacing';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  onPress: () => void;
  icon?: IonName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'light' | 'accent';
  /** Fuerza el color de fondo (p. ej. azul ARGO en login). */
  color?: string;
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
  color,
  disabled,
  loading,
  fullWidth,
  size = 'md',
}: Props) {
  const c = useTheme();
  const py = size === 'lg' ? 16 : 14;
  const fs = size === 'lg' ? 16 : 15;
  const primaryBg = color ?? c.primary;

  const isGhost = variant === 'ghost';
  const isLight = variant === 'light';
  const isDanger = variant === 'danger';
  const isSecondary = variant === 'secondary';
  const isAccent = variant === 'accent';

  const textColor =
    isGhost || isSecondary ? primaryBg : isLight ? '#fff' : isAccent ? '#042f2e' : '#fff';

  const content = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <View style={styles.row}>
      {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
      <ScaledText baseSize={fs} style={{ color: textColor, fontWeight: '700' }}>
        {label}
      </ScaledText>
    </View>
  );

  if ((variant === 'primary' || variant === 'accent') && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.btn,
          fullWidth && styles.full,
          {
            paddingVertical: py,
            minHeight: 52,
            backgroundColor: variant === 'accent' ? c.accent : primaryBg,
            opacity: pressed || disabled || loading ? 0.88 : 1,
          },
          !loading && shadow.button,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  const bg = isDanger
    ? c.danger
    : isSecondary
      ? c.accentSoft
      : isLight
        ? 'rgba(255,255,255,0.14)'
        : isGhost
          ? 'transparent'
          : primaryBg;

  const borderColor = isGhost ? primaryBg : isLight ? 'rgba(255,255,255,0.45)' : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        fullWidth && styles.full,
        {
          paddingVertical: py,
          backgroundColor: bg,
          borderColor,
          borderWidth: isGhost || isLight ? 1.5 : 0,
          opacity: pressed || disabled || loading ? 0.82 : 1,
        },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
