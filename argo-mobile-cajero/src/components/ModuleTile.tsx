import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { CAJERO_AZUL_REY } from '../config/appBranding';
import { themeColors } from '../theme/colors';
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
          minHeight: 140 * buttonMultiplier,
          backgroundColor: highContrast ? c.card : '#ffffff',
          borderColor: highContrast ? c.border : 'rgba(53, 120, 240, 0.14)',
          opacity: pressed ? 0.94 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        !highContrast && styles.elevated,
      ]}
    >
      <LinearGradient
        colors={highContrast ? [c.bgAlt, c.card] : [g0, g1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconWrap}
      >
        <Ionicons
          name={module.icon}
          size={30}
          color={highContrast ? c.primary : '#fff'}
        />
      </LinearGradient>

      <ScaledText
        baseSize={14}
        style={{
          color: highContrast ? c.text : '#1e3a8a',
          fontWeight: '800',
          marginTop: 12,
          textAlign: 'center',
          letterSpacing: 0.2,
        }}
        numberOfLines={2}
      >
        {module.label}
      </ScaledText>

      <View
        style={[
          styles.accentBar,
          { backgroundColor: highContrast ? c.primary : CAJERO_AZUL_REY },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    maxWidth: '48%',
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    opacity: 0.85,
  },
  elevated: {
    shadowColor: CAJERO_AZUL_REY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
});
