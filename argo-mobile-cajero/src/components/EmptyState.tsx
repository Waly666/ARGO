import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import { radii } from '../theme/tokens';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon?: IonName;
  title: string;
  subtitle?: string;
};

export function EmptyState({ icon = 'file-tray-outline', title, subtitle }: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconCircle, { backgroundColor: c.chipBg }]}>
        <Ionicons name={icon} size={32} color={c.primary} />
      </View>
      <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '800', marginTop: 16, textAlign: 'center' }}>
        {title}
      </ScaledText>
      {subtitle ? (
        <ScaledText baseSize={14} style={{ color: c.textSoft, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
          {subtitle}
        </ScaledText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
