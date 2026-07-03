import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { ScaledText } from '../components/ScaledText';
import { APP_BRANDING, JORNADAS_VERDE, SPLASH_MIN_MS } from '../config/appBranding';
import { useAuth } from '../context/AuthContext';

const splashFull = require('../../assets/branding/splash-full.png');

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

export function AppBootGate({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const authLoading = state.status === 'loading';
  const [minTimeDone, setMinTimeDone] = React.useState(false);

  React.useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => setMinTimeDone(true), SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  const showSplash = authLoading || !minTimeDone;

  return (
    <View style={styles.root}>
      {children}
      {showSplash ? (
        <View style={styles.overlay} pointerEvents="auto">
          <Image source={splashFull} style={styles.overlayImage} resizeMode="cover" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: JORNADAS_VERDE },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: JORNADAS_VERDE, zIndex: 9999 },
  overlayImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  brand: { alignItems: 'center', width: '100%' },
  logo: { width: 200, height: 100 },
  titulo: { color: '#fff', fontWeight: '800', marginTop: 16, textAlign: 'center' },
  sub: { color: 'rgba(255,255,255,0.85)', marginTop: 6, textAlign: 'center' },
});
