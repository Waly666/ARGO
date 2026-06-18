import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { ScaledText } from './ScaledText';
import { useTheme } from '../context/ThemeContext';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = { title: string; subtitle?: string; icon?: IonName };

export function EmptyState({ title, subtitle, icon = 'folder-open-outline' }: Props) {
  const c = useTheme();
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={44} color={c.textSoft} />
      <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '700', marginTop: 12, textAlign: 'center' }}>
        {title}
      </ScaledText>
      {subtitle ? (
        <ScaledText baseSize={14} style={{ color: c.textSoft, marginTop: 6, textAlign: 'center' }}>
          {subtitle}
        </ScaledText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 32 },
});
