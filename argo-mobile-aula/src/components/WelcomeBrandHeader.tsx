import React from 'react';
import { StyleSheet, View } from 'react-native';

import { APP_BRANDING } from '../config/appBranding';
import { PortalLogo } from './PortalLogo';
import { ScaledText } from './ScaledText';
import { space } from '../theme/spacing';
import { type } from '../theme/typography';

type Props = {
  logoWidth?: number;
  logoHeight?: number;
};

/** Logo embebido + AULA VIRTUAL + nombre empresa (sin depender del servidor). */
export function WelcomeBrandHeader({ logoWidth = 168, logoHeight = 86 }: Props) {
  return (
    <View style={styles.wrap}>
      <PortalLogo width={logoWidth} height={logoHeight} logoFrame="transparent" />
      <ScaledText baseSize={type.hero.fontSize} style={styles.aulaVirtual}>
        {APP_BRANDING.tituloApp}
      </ScaledText>
      <ScaledText baseSize={17} style={styles.empresaNombre}>
        {APP_BRANDING.nombreEmpresa}
      </ScaledText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%' },
  aulaVirtual: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: space.sm,
  },
  empresaNombre: {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: space.xs,
    paddingHorizontal: space.md,
  },
});
