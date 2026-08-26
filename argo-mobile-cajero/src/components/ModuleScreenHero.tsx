import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';

import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { CAJERO_AZUL_REY, CAJERO_NAVY, CAJERO_NAVY_SOFT } from '../config/appBranding';
import { themeColors } from '../theme/colors';
import { radii, shadows } from '../theme/tokens';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  title: string;
  subtitle?: string;
  icon: IonName;
  children?: React.ReactNode;
  compact?: boolean;
};

/** Cabecera estilo wallet: bloque oscuro redondeado con icono circular. */
export function ModuleScreenHero({ title, subtitle, icon, children, compact }: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const colors: [string, string, string] = highContrast
    ? [c.card, c.bgAlt, c.bgAlt]
    : [CAJERO_NAVY, CAJERO_NAVY_SOFT, '#1A2240'];

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, compact && styles.heroCompact, !highContrast && shadows.card]}
    >
      <View style={styles.top}>
        <View style={[styles.iconWrap, highContrast && { backgroundColor: c.bgAlt }]}>
          <Ionicons name={icon} size={compact ? 22 : 24} color={highContrast ? c.primary : '#fff'} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ScaledText
            baseSize={compact ? 18 : 20}
            style={{ color: highContrast ? c.text : '#fff', fontWeight: '800', letterSpacing: -0.3 }}
            numberOfLines={2}
          >
            {title}
          </ScaledText>
          {subtitle ? (
            <ScaledText
              baseSize={13}
              style={{
                color: highContrast ? c.textSoft : 'rgba(255,255,255,0.72)',
                marginTop: 4,
                lineHeight: 18,
              }}
            >
              {subtitle}
            </ScaledText>
          ) : null}
        </View>
      </View>
      {children ? <View style={styles.footer}>{children}</View> : null}
      {!highContrast ? <View style={[styles.glow, { backgroundColor: CAJERO_AZUL_REY }]} /> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.xl,
    padding: 20,
    marginBottom: 4,
    gap: 14,
    overflow: 'hidden',
  },
  heroCompact: {
    padding: 16,
    gap: 10,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.icon,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    gap: 8,
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.12,
    top: -40,
    right: -30,
  },
});
