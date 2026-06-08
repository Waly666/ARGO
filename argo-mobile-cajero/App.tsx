import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AlertPrefsProvider } from './src/context/AlertPrefsContext';
import { AccessibilityProvider } from './src/context/AccessibilityContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AjustesScreen from './src/screens/AjustesScreen';
import CajaScreen from './src/screens/caja/CajaScreen';
import CajaCobrosScreen from './src/screens/caja/CajaCobrosScreen';
import CajaMovimientosScreen from './src/screens/caja/CajaMovimientosScreen';
import AlumnosScreen from './src/screens/alumnos/AlumnosScreen';
import AlumnoDetalleScreen from './src/screens/alumnos/AlumnoDetalleScreen';
import CertificadosScreen from './src/screens/certificados/CertificadosScreen';
import FacturacionScreen from './src/screens/facturacion/FacturacionScreen';
import ProgramasScreen from './src/screens/programas/ProgramasScreen';
import ServiciosScreen from './src/screens/servicios/ServiciosScreen';
import DocumentoViewerScreen from './src/screens/shared/DocumentoViewerScreen';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4f46e5',
    background: '#eef2ff',
    card: '#ffffff',
    text: '#1e1b4b',
    border: '#e2e8f0',
  },
};

const headerOptions = {
  headerTintColor: '#fff',
  headerStyle: { backgroundColor: '#4f46e5', elevation: 0, shadowOpacity: 0 },
  headerTitleStyle: { fontWeight: '700' as const },
  cardStyle: { backgroundColor: '#eef2ff' },
};

function BootstrapScreen() {
  return (
    <LinearGradient colors={['#4f46e5', '#06b6d4']} style={styles.boot}>
      <View style={styles.bootLogoRing}>
        <Image source={require('./assets/icon.png')} style={styles.bootLogo} />
      </View>
      <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
      <Text style={styles.bootText}>Iniciando ARGO…</Text>
    </LinearGradient>
  );
}

function RootNavigator() {
  const { state } = useAuth();

  if (state.status === 'loading') {
    return (
      <Stack.Navigator key="nav-loading" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Bootstrap" component={BootstrapScreen} />
      </Stack.Navigator>
    );
  }

  if (state.status === 'signedOut') {
    return (
      <Stack.Navigator key="nav-auth" screenOptions={headerOptions}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator key="nav-app" initialRouteName="Home" detachInactiveScreens={false} screenOptions={headerOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'ARGO' }} />
      <Stack.Screen name="Caja" component={CajaScreen} options={{ title: 'Caja' }} />
      <Stack.Screen name="CajaCobros" component={CajaCobrosScreen} options={{ title: 'Cobros pendientes' }} />
      <Stack.Screen name="CajaMovimientos" component={CajaMovimientosScreen} options={{ title: 'Movimientos' }} />
      <Stack.Screen name="Alumnos" component={AlumnosScreen} options={{ title: 'Alumnos' }} />
      <Stack.Screen
        name="AlumnoDetalle"
        component={AlumnoDetalleScreen}
        options={({ route }) => ({ title: route.params.nombre || 'Alumno' })}
      />
      <Stack.Screen
        name="DocumentoViewer"
        component={DocumentoViewerScreen}
        options={({ route }) => ({ title: route.params.title || 'Documento' })}
      />
      <Stack.Screen name="Certificados" component={CertificadosScreen} options={{ title: 'Certificados' }} />
      <Stack.Screen name="Facturacion" component={FacturacionScreen} options={{ title: 'Facturación' }} />
      <Stack.Screen name="Programas" component={ProgramasScreen} options={{ title: 'Programas' }} />
      <Stack.Screen name="Servicios" component={ServiciosScreen} options={{ title: 'Servicios' }} />
      <Stack.Screen name="Ajustes" component={AjustesScreen} options={{ title: 'Lectura y alertas' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AlertPrefsProvider>
          <AccessibilityProvider>
            <AuthProvider>
              <NavigationContainer theme={navTheme}>
                <RootNavigator />
              </NavigationContainer>
              <StatusBar style="light" />
            </AuthProvider>
          </AccessibilityProvider>
        </AlertPrefsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  bootLogoRing: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 24,
  },
  bootLogo: { width: 80, height: 80, borderRadius: 18 },
  bootText: {
    marginTop: 16,
    fontSize: 17,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
