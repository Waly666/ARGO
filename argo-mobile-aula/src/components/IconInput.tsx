import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { useTheme } from '../context/ThemeContext';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  icon?: IonName;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
};

export function IconInput({
  value,
  onChangeText,
  placeholder,
  icon = 'person-outline',
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: Props) {
  const c = useTheme();
  return (
    <View style={[styles.wrap, { borderColor: c.border, backgroundColor: c.card }]}>
      <Ionicons name={icon} size={20} color={c.textSoft} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, { color: c.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 16, padding: 0 },
});
