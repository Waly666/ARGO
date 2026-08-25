import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { ScaledText } from '../components/ScaledText';
import { APP_BRANDING, SPLASH_BG, SPLASH_MIN_MS } from '../config/appBranding';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';

const SPLASH_TITLE_COLOR = '#0A0A0A';

/** Logo embebido (Servial). El splash no usa URL remota para evitar parpadeo. */
const SPLASH_LOGO = APP_BRANDING.logo;

/** Logo + título (pantallas internas). */
export function PreLoginBrand() {
  const { tituloApp, logoSource } = useBranding();
  return (
    <View style={styles.brand}>
      <Image source={logoSource} style={styles.logo} resizeMode="contain" />
      <ScaledText baseSize={24} style={styles.titulo}>
        {tituloApp}
      </ScaledText>
    </View>
  );
}

function BootSplash() {
  const onLayout = useCallback(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <View style={styles.boot} onLayout={onLayout}>
      <View style={styles.splashBrand}>
        <Image source={SPLASH_LOGO} style={styles.splashLogo} resizeMode="contain" />
        <ScaledText baseSize={22} style={styles.splashTitulo}>
          {APP_BRANDING.tituloApp}
        </ScaledText>
      </View>
    </View>
  );
}

/**
 * Splash de arranque: logo Servial embebido hasta que termina auth + tiempo mínimo.
 * No renderiza la app debajo para evitar flash del icono nativo viejo (Expo Go / APK).
 */
export function AppBootGate({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const authLoading = state.status === 'loading';
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeDone(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  const showSplash = authLoading || !minTimeDone;

  if (showSplash) {
    return <BootSplash />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashBrand: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  splashLogo: {
    width: 280,
    height: 220,
  },
  splashTitulo: {
    color: SPLASH_TITLE_COLOR,
    fontWeight: '800',
    marginTop: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  brand: { alignItems: 'center', width: '100%' },
  logo: { width: 220, height: 110 },
  titulo: {
    color: '#ffffff',
    fontWeight: '800',
    marginTop: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
