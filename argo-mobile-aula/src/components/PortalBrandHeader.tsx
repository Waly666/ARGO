import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { APP_BRANDING, AULA_AZUL_REY } from '../config/appBranding';
import { usePortalBranding } from '../hooks/usePortalBranding';
import { ScaledText } from './ScaledText';

type Props = {
  logoWidth?: number;
  logoHeight?: number;
  onDark?: boolean;
  lead?: string;
};

export function PortalBrandHeader({
  logoWidth = 152,
  logoHeight = 78,
  onDark = true,
  lead = 'Formación virtual certificada',
}: Props) {
  const { tituloApp, nombreEmpresa, logoSource } = usePortalBranding();
  const titleColor = onDark ? '#ffffff' : AULA_AZUL_REY;
  const empresaColor = onDark ? 'rgba(255,255,255,0.88)' : '#475569';
  const leadColor = onDark ? 'rgba(255,255,255,0.9)' : '#64748B';

  return (
    <View style={styles.wrap}>
      <Image source={logoSource ?? APP_BRANDING.logo} style={{ width: logoWidth, height: logoHeight }} resizeMode="contain" />
      <ScaledText baseSize={22} style={[styles.titulo, { color: titleColor }]}>
        {tituloApp}
      </ScaledText>
      {nombreEmpresa ? (
        <ScaledText baseSize={16} style={[styles.empresa, { color: empresaColor }]}>
          {nombreEmpresa}
        </ScaledText>
      ) : null}
      {lead ? (
        <ScaledText baseSize={14} style={[styles.lead, { color: leadColor }]}>
          {lead}
        </ScaledText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: '100%' },
  titulo: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: 12,
  },
  empresa: {
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  lead: {
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
