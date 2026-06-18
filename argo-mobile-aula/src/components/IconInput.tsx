import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { useTheme } from '../context/ThemeContext';
import { radius, space } from '../theme/spacing';

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
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: focused ? c.primary : c.border,
          backgroundColor: c.inputBg,
        },
        focused && styles.focused,
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: focused ? c.accentSoft : '#f1f5f9' }]}>
        <Ionicons name={icon} size={18} color={focused ? c.primary : '#64748b'} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.inputPlaceholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, { color: c.inputText }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.md,
  },
  focused: {
    shadowColor: '#1565c0',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { flex: 1, fontSize: 16, padding: 0 },
});
