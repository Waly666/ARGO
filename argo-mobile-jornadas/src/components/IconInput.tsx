import React, { useEffect, useRef } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import { useVoiceOptional } from '../voice/VoiceContext';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = TextInputProps & {
  label: string;
  icon: IonName;
  /** Si se define, el micrófono puede dictar a este campo y usarlo en «siguiente». */
  voiceFieldId?: string;
};

export function IconInput({ label, icon, style, voiceFieldId, onFocus, onBlur, value, onChangeText, ...rest }: Props) {
  const { textMultiplier, buttonMultiplier, highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const voice = useVoiceOptional();
  const inputRef = useRef<TextInput>(null);
  const valueRef = useRef(String(value ?? ''));
  valueRef.current = String(value ?? '');
  const onChangeRef = useRef(onChangeText);
  onChangeRef.current = onChangeText;

  useEffect(() => {
    if (!voice || !voiceFieldId) return;
    return voice.registerField(voiceFieldId, {
      focus: () => inputRef.current?.focus(),
      getValue: () => valueRef.current,
      setValue: (t) => onChangeRef.current?.(t),
    });
  }, [voice, voiceFieldId]);

  return (
    <View style={styles.wrap}>
      <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 6, fontWeight: '600' }}>
        {label}
      </ScaledText>
      <View style={[styles.field, { height: 52 * buttonMultiplier, borderColor: c.border, backgroundColor: c.card }]}>
        <View style={[styles.iconWrap, { backgroundColor: highContrast ? c.bgAlt : '#ecfdf5' }]}>
          <Ionicons name={icon} size={20} color={c.primary} />
        </View>
        <TextInput
          ref={inputRef}
          placeholderTextColor="#94a3b8"
          style={[{ flex: 1, paddingHorizontal: 12, fontSize: 16 * textMultiplier, color: c.text }, style]}
          value={value}
          onChangeText={onChangeText}
          onFocus={(e) => {
            if (voiceFieldId) voice?.setFocusedFieldId(voiceFieldId);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  iconWrap: { width: 48, height: '100%', alignItems: 'center', justifyContent: 'center' },
});
