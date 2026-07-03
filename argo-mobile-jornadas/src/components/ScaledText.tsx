import React from 'react';
import { Text, TextProps } from 'react-native';
import { useAccessibility } from '../context/AccessibilityContext';

type Props = TextProps & { baseSize?: number };

export function ScaledText({ style, baseSize = 16, ...rest }: Props) {
  const { textMultiplier, boldText } = useAccessibility();
  return (
    <Text
      {...rest}
      style={[
        {
          fontSize: baseSize * textMultiplier,
          fontWeight: boldText ? '700' : '400',
        },
        style,
      ]}
    />
  );
}
