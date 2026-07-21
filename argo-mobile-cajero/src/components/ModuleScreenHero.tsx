import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';

import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { CAJERO_AZUL_REY, CAJERO_AZUL_REY_CLARO } from '../config/appBranding';
import { themeColors } from '../theme/colors';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  title: string;
  subtitle?: string;
  icon: IonName;
  children?: React.ReactNode;
  /** Variante compacta (formularios). */
  compact?: boolean;
};

/** Cabecera azul compartida en listados y altas (alumnos, caja, servicios…). */
export function ModuleScreenHero({ title, subtitle, icon, children, compact }: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const colors: [string, string] = highContrast
    ? [c.card, c.bgAlt]
    : [CAJERO_AZUL_REY, CAJERO_AZUL_REY_CLARO];

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, compact && styles.heroCompact]}
    >
      <View style={styles.top}>
        <View style={[styles.iconWrap, highContrast && { backgroundColor: c.bgAlt }]}>
          <Ionicons name={icon} size={compact ? 24 : 26} color={highContrast ? c.primary : '#fff'} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ScaledText
            baseSize={compact ? 18 : 20}
            style={{ color: highContrast ? c.text : '#fff', fontWeight: '800' }}
            numberOfLines={2}
          >
            {title}
          </ScaledText>
          {subtitle ? (
            <ScaledText
              baseSize={13}
              style={{
                color: highContrast ? c.textSoft : 'rgba(255,255,255,0.88)',
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 4,
    gap: 14,
  },
  heroCompact: {
    padding: 14,
    gap: 10,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    gap: 8,
  },
});
