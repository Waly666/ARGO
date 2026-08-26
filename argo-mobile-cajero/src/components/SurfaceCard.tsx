import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import { radii, shadows } from '../theme/tokens';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
};

export function SurfaceCard({ children, style, elevated = true }: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: highContrast ? c.border : 'transparent',
        },
        elevated && !highContrast && shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 18,
  },
});
