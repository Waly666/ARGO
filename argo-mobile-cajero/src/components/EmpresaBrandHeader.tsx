import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { CAJERO_AZUL_REY } from '../config/appBranding';
import { useBranding } from '../context/BrandingContext';
import { ScaledText } from './ScaledText';

type Props = {
  logoWidth?: number;
  logoHeight?: number;
  /** Texto claro sobre fondo azul rey. */
  onDark?: boolean;
  showSubtitle?: boolean;
};

/** Logo y nombre de la empresa (desde el servidor) + título ARGO Cajero. */
export function EmpresaBrandHeader({
  logoWidth = 168,
  logoHeight = 86,
  onDark = true,
  showSubtitle = true,
}: Props) {
  const { tituloApp, nombreEmpresa, logoSource } = useBranding();
  const titleColor = onDark ? '#ffffff' : CAJERO_AZUL_REY;
  const subColor = onDark ? 'rgba(255,255,255,0.92)' : '#334155';
  const empresaColor = onDark ? 'rgba(255,255,255,0.88)' : '#475569';

  return (
    <View style={styles.wrap}>
      <Image
        source={logoSource}
        style={{ width: logoWidth, height: logoHeight }}
        resizeMode="contain"
      />
      <ScaledText baseSize={22} style={[styles.titulo, { color: titleColor }]}>
        {tituloApp}
      </ScaledText>
      {showSubtitle && nombreEmpresa ? (
        <>
          <ScaledText baseSize={16} style={[styles.empresa, { color: empresaColor }]}>
            {nombreEmpresa}
          </ScaledText>
          <ScaledText baseSize={14} style={[styles.lead, { color: subColor }]}>
            Caja, alumnos y facturación
          </ScaledText>
        </>
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
