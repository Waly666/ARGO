import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { radius, space } from '../theme/spacing';
import { shadow } from '../theme/shadows';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
};

export function SearchField({ value, onChangeText, placeholder = 'Buscar…', onFilterPress }: Props) {
  const c = useTheme();
  return (
    <View style={[styles.wrap, shadow.sm, { borderColor: c.borderLight, backgroundColor: c.inputBg }]}>
      <Ionicons name="search" size={20} color={c.textSoft} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.inputPlaceholder}
        autoCapitalize="none"
        style={[styles.input, { color: c.text }]}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={c.textSoft} />
        </Pressable>
      ) : onFilterPress ? (
        <Pressable onPress={onFilterPress} hitSlop={8} style={[styles.filterBtn, { backgroundColor: c.card }]}>
          <Ionicons name="options-outline" size={18} color={c.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: space.lg,
    paddingVertical: space.md + 2,
    marginBottom: space.md,
  },
  input: { flex: 1, fontSize: 16, padding: 0 },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
