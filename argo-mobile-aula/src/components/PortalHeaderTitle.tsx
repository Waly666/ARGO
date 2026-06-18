import React from 'react';
import { StyleSheet, View } from 'react-native';

import { usePortalBranding } from '../hooks/usePortalBranding';
import { PortalLogo } from './PortalLogo';
import { ScaledText } from './ScaledText';
import { space } from '../theme/spacing';

type Props = {
  subtitle?: string;
};

/** Título de navegación con logo transparente e identidad de la empresa. */
export function PortalHeaderTitle({ subtitle }: Props) {
  const { nombreEmpresa } = usePortalBranding();

  return (
    <View style={styles.row}>
      <PortalLogo width={44} height={40} hideLetterFallback style={styles.logo} />
      <View style={styles.copy}>
        <ScaledText baseSize={16} style={styles.title} numberOfLines={1}>
          {nombreEmpresa}
        </ScaledText>
        <ScaledText baseSize={11} style={styles.sub} numberOfLines={1}>
          {subtitle ?? 'Mi aula virtual'}
        </ScaledText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', maxWidth: 260 },
  logo: { marginRight: space.sm, alignItems: 'flex-start' },
  copy: { flexShrink: 1 },
  title: { color: '#fff', fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.88)', marginTop: 1 },
});
