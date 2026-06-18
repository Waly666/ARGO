import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';

import { WelcomeBrandHeader } from '../components/WelcomeBrandHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { space } from '../theme/spacing';

SplashScreen.preventAutoHideAsync().catch(() => {});

function BrandedSplashOverlay() {
  const c = useTheme();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      <LinearGradient colors={c.gradient} style={styles.boot} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <WelcomeBrandHeader />
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: space.xl }} />
      </LinearGradient>
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
    <LinearGradient colors={c.gradient} style={styles.boot} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <WelcomeBrandHeader />
      <ActivityIndicator size="large" color="#fff" style={{ marginTop: space.xl }} />
    </LinearGradient>
  );
}

export { SplashGate, BootstrapScreen };

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl },
});
