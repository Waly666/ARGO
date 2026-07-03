import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  hint?: string;
};

export function EmptyState({ icon = 'calendar-outline', title, hint }: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={48} color={c.primaryLight} />
      <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '700', marginTop: 12, textAlign: 'center' }}>
        {title}
      </ScaledText>
      {hint ? (
        <ScaledText baseSize={14} style={{ color: c.textSoft, marginTop: 6, textAlign: 'center' }}>
          {hint}
        </ScaledText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
});
