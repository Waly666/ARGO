import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import { radii, shadows } from '../theme/tokens';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function SearchField({ value, onChangeText, placeholder = 'Buscar…', autoFocus }: Props) {
  const { textMultiplier, highContrast } = useAccessibility();
  const c = themeColors(highContrast);

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: c.card,
          borderColor: highContrast ? c.border : 'transparent',
        },
        !highContrast && shadows.cardPressed,
      ]}
    >
      <View style={[styles.iconBubble, { backgroundColor: highContrast ? c.bgAlt : c.chipBg }]}>
        <Ionicons name="search" size={18} color={c.primary} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={[styles.input, { color: c.text, fontSize: 16 * textMultiplier }]}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Limpiar búsqueda">
          <Ionicons name="close-circle" size={20} color={c.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 52,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { flex: 1, paddingVertical: 6 },
});
