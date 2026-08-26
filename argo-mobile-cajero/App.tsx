import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { NotificationBridge } from './src/components/NotificationBridge';
import { navigationRef } from './src/navigation/navigationRef';

import { AlertPrefsProvider } from './src/context/AlertPrefsContext';
import { AccessibilityProvider } from './src/context/AccessibilityContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BrandingProvider } from './src/context/BrandingContext';
import { AppBootGate } from './src/bootstrap/splash';
import { CAJERO_AZUL_REY } from './src/config/appBranding';
import type { RootStackParamList } from './src/navigation/types';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AjustesScreen from './src/screens/AjustesScreen';
import CajaScreen from './src/screens/caja/CajaScreen';
import CajaCobrosScreen from './src/screens/caja/CajaCobrosScreen';
import CajaMovimientosScreen from './src/screens/caja/CajaMovimientosScreen';
import AlumnosScreen from './src/screens/alumnos/AlumnosScreen';
import AlumnoCrearScreen from './src/screens/alumnos/AlumnoCrearScreen';
import AlumnoEditarScreen from './src/screens/alumnos/AlumnoEditarScreen';
import AlumnoDetalleScreen from './src/screens/alumnos/AlumnoDetalleScreen';
import CertificadosScreen from './src/screens/certificados/CertificadosScreen';
import FacturacionScreen from './src/screens/facturacion/FacturacionScreen';
import ProgramasScreen from './src/screens/programas/ProgramasScreen';
import ServiciosScreen from './src/screens/servicios/ServiciosScreen';
import DocumentoViewerScreen from './src/screens/shared/DocumentoViewerScreen';
import AprobacionConsignacionScreen from './src/screens/admin/AprobacionConsignacionScreen';
import AutorizacionesScreen from './src/screens/admin/AutorizacionesScreen';

const Stack = createStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: CAJERO_AZUL_REY,
    background: '#F4F6FB',
    card: '#ffffff',
    text: '#0F172A',
    border: '#E8ECF4',
  },
};

const headerOptions = {
  headerTintColor: '#fff',
  headerStyle: { backgroundColor: CAJERO_AZUL_REY, elevation: 0, shadowOpacity: 0 },
  headerTitleStyle: { fontWeight: '700' as const },
  cardStyle: { backgroundColor: '#F4F6FB' },
};

function RootNavigator() {
  const { state } = useAuth();

  if (state.status === 'signedOut') {
    return (
      <Stack.Navigator key="nav-auth" screenOptions={headerOptions}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator key="nav-app" initialRouteName="Home" detachInactiveScreens={false} screenOptions={headerOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Caja" component={CajaScreen} options={{ title: 'Caja' }} />
      <Stack.Screen name="CajaCobros" component={CajaCobrosScreen} options={{ title: 'Cobros pendientes' }} />
      <Stack.Screen name="CajaMovimientos" component={CajaMovimientosScreen} options={{ title: 'Movimientos' }} />
      <Stack.Screen name="Alumnos" component={AlumnosScreen} options={{ title: 'Alumnos' }} />
      <Stack.Screen name="AlumnoCrear" component={AlumnoCrearScreen} options={{ title: 'Nuevo alumno' }} />
      <Stack.Screen
        name="AlumnoEditar"
        component={AlumnoEditarScreen}
        options={({ route }) => ({ title: route.params.nombre ? `Editar · ${route.params.nombre}` : 'Editar alumno' })}
      />
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
      <Stack.Screen
        name="AprobacionConsignacion"
        component={AprobacionConsignacionScreen}
        options={{ title: 'Consignaciones portal' }}
      />
      <Stack.Screen name="Autorizaciones" component={AutorizacionesScreen} options={{ title: 'Autorizaciones' }} />
      <Stack.Screen name="Ajustes" component={AjustesScreen} options={{ title: 'Lectura y alertas' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: CAJERO_AZUL_REY }}>
      <SafeAreaProvider>
        <AlertPrefsProvider>
          <AccessibilityProvider>
            <AuthProvider>
              <BrandingProvider>
              <AppBootGate>
                <NavigationContainer ref={navigationRef} theme={navTheme}>
                  <NotificationBridge />
                  <RootNavigator />
                </NavigationContainer>
              </AppBootGate>
              </BrandingProvider>
              <StatusBar style="light" />
            </AuthProvider>
          </AccessibilityProvider>
        </AlertPrefsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
