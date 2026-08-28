import React from 'react';
import { StyleSheet, View } from 'react-native';

import { usePortalBranding } from '../hooks/usePortalBranding';
import { useTheme } from '../context/ThemeContext';
import { PortalLogo } from './PortalLogo';
import { ScaledText } from './ScaledText';
import { space } from '../theme/spacing';
import { type } from '../theme/typography';

type Props = {
  logoWidth?: number;
  logoHeight?: number;
};

export function WelcomeBrandHeader({ logoWidth = 168, logoHeight = 86 }: Props) {
  const c = useTheme();
  const { tituloApp, nombreEmpresa } = usePortalBranding();

  return (
    <View style={styles.wrap}>
      <PortalLogo width={logoWidth} height={logoHeight} logoFrame="transparent" />
      <ScaledText baseSize={type.hero.fontSize} style={[styles.aulaVirtual, { color: c.primary }]}>
        {tituloApp}
      </ScaledText>
      <ScaledText baseSize={17} style={[styles.empresaNombre, { color: c.text }]}>
        {nombreEmpresa}
      </ScaledText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%' },
  aulaVirtual: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: space.sm,
  },
  empresaNombre: {
    fontWeight: '500',
    textAlign: 'center',
    marginTop: space.xs,
    paddingHorizontal: space.md,
    lineHeight: 24,
  },
});
