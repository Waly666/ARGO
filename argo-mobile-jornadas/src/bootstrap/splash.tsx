import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { ScaledText } from '../components/ScaledText';
import { APP_BRANDING, JORNADAS_VERDE } from '../config/appBranding';

export function PreLoginBrand() {
  return (
    <View style={styles.brand}>
      <Image source={APP_BRANDING.logo} style={styles.logo} resizeMode="contain" />
      <ScaledText baseSize={24} style={styles.titulo}>
        {APP_BRANDING.tituloApp}
      </ScaledText>
      <ScaledText baseSize={14} style={styles.sub}>
        Capacitación en campo
      </ScaledText>
    </View>
  );
}

/** Solo oculta el splash nativo; no bloquea la UI con overlay. */
export function AppBootGate({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: JORNADAS_VERDE },
  brand: { alignItems: 'center', width: '100%' },
  logo: { width: 200, height: 100 },
  titulo: { color: '#fff', fontWeight: '800', marginTop: 16, textAlign: 'center' },
  sub: { color: 'rgba(255,255,255,0.85)', marginTop: 6, textAlign: 'center' },
});
