import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { CAJERO_AZUL_REY } from '../config/appBranding';
import { themeColors } from '../theme/colors';
import { radii, shadows } from '../theme/tokens';
import type { ModuleMeta } from '../theme/modules';

type Props = {
  module: ModuleMeta;
  onPress: () => void;
};

export function ModuleTile({ module, onPress }: Props) {
  const { buttonMultiplier, highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [g0, g1] = module.gradient;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          minHeight: 148 * buttonMultiplier,
          backgroundColor: c.card,
          borderColor: highContrast ? c.border : 'transparent',
          opacity: pressed ? 0.96 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        !highContrast && (pressed ? shadows.cardPressed : shadows.card),
      ]}
    >
      <LinearGradient
        colors={highContrast ? [c.bgAlt, c.card] : [g0, g1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconCircle}
      >
        <Ionicons name={module.icon} size={28} color={highContrast ? c.primary : '#fff'} />
      </LinearGradient>

      <ScaledText
        baseSize={14}
        style={{
          color: c.text,
          fontWeight: '700',
          marginTop: 14,
          textAlign: 'center',
          lineHeight: 19,
        }}
        numberOfLines={2}
      >
        {module.label}
      </ScaledText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    maxWidth: '48%',
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 22,
    paddingBottom: 18,
    paddingHorizontal: 14,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
