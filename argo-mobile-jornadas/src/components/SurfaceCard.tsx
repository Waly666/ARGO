import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import { radii, shadows } from '../theme/tokens';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  terminada?: boolean;
};

export function SurfaceCard({ children, style, elevated = true, terminada }: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);

  if (terminada) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: c.terminadaBg,
            borderColor: c.terminadaBorder,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

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
