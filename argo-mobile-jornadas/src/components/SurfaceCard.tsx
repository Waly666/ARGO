import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Fondo gris fuerte + bordes para clase terminada. */
  terminada?: boolean;
};

export function SurfaceCard({ children, style, terminada }: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  return (
    <View
      style={[
        styles.card,
        terminada
          ? {
              backgroundColor: c.terminadaBg,
              borderColor: c.terminadaBorder,
              shadowColor: c.terminadaBorder,
            }
          : {
              backgroundColor: c.card,
              borderColor: c.border,
              shadowColor: c.shadow,
            },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});
