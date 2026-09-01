import React, { useEffect, useRef } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import { radii, shadows } from '../theme/tokens';
import { useVoiceOptional } from '../voice/VoiceContext';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = TextInputProps & {
  label: string;
  icon: IonName;
  iconColor?: string;
  voiceFieldId?: string;
};

export function IconInput({ label, icon, iconColor, style, voiceFieldId, onFocus, onBlur, value, onChangeText, autoCapitalize, ...rest }: Props) {
  const { textMultiplier, buttonMultiplier, highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const voice = useVoiceOptional();
  const inputRef = useRef<TextInput>(null);
  const valueRef = useRef(String(value ?? ''));
  valueRef.current = String(value ?? '');
  const onChangeRef = useRef(onChangeText);
  onChangeRef.current = onChangeText;

  const inputH = 52 * buttonMultiplier;
  const cap = autoCapitalize ?? 'none';
  const fuerzaMayus = cap === 'characters';

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
      <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 8, fontWeight: '600' }}>
        {label}
      </ScaledText>
      <View
        style={[
          styles.field,
          {
            height: inputH,
            borderColor: highContrast ? c.border : 'transparent',
            backgroundColor: c.card,
          },
          !highContrast && shadows.cardPressed,
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: highContrast ? c.bgAlt : c.chipBg }]}>
          <Ionicons name={icon} size={20} color={iconColor ?? c.primary} />
        </View>
        <TextInput
          ref={inputRef}
          placeholderTextColor={c.textMuted}
          autoCapitalize={cap}
          style={[
            styles.input,
            {
              fontSize: 16 * textMultiplier,
              color: c.text,
              ...(fuerzaMayus ? { textTransform: 'uppercase' as const } : null),
            },
            style,
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={(e) => {
            if (voiceFieldId) voice?.setFocusedFieldId(voiceFieldId);
            onFocus?.(e);
          }}
          onBlur={onBlur}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.pill,
    overflow: 'hidden',
    paddingRight: 6,
  },
  iconWrap: {
    width: 44,
    height: 44,
    marginLeft: 4,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
});
