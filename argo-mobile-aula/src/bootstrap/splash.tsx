import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { WelcomeBrandHeader } from '../components/WelcomeBrandHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { space } from '../theme/spacing';

SplashScreen.preventAutoHideAsync().catch(() => {});

function BrandedSplashOverlay() {
  const c = useTheme();

  return (
    <View style={[StyleSheet.absoluteFill, styles.boot, { backgroundColor: c.bg }]} pointerEvents="auto">
      <WelcomeBrandHeader />
      <ActivityIndicator size="large" color={c.primary} style={{ marginTop: space.xl }} />
    </View>
  );
}

function SplashGate({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const booting = state.status === 'loading';

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <>
      {children}
      {booting ? <BrandedSplashOverlay /> : null}
    </>
  );
}

function BootstrapScreen() {
  const c = useTheme();

  return (
    <View style={[styles.boot, { backgroundColor: c.bg }]}>
      <WelcomeBrandHeader />
      <ActivityIndicator size="large" color={c.primary} style={{ marginTop: space.xl }} />
    </View>
  );
}

export { SplashGate, BootstrapScreen };

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
});
