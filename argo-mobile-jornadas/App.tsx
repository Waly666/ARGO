import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AppBootGate } from './src/bootstrap/splash';
import { AccessibilityProvider } from './src/context/AccessibilityContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { DrawerProvider } from './src/context/DrawerContext';
import { AppDrawerMenu, HamburgerHeaderButton } from './src/components/AppDrawerMenu';
import { JORNADAS_VERDE } from './src/config/appBranding';
import type { RootStackParamList } from './src/navigation/types';
import LoginScreen from './src/screens/LoginScreen';
import DeniedScreen from './src/screens/DeniedScreen';
import HomeScreen from './src/screens/HomeScreen';
import JornadasHoyScreen from './src/screens/JornadasHoyScreen';
import ClasesJornadaScreen from './src/screens/ClasesJornadaScreen';
import ClaseDetalleScreen from './src/screens/ClaseDetalleScreen';
import EditarJornadaScreen from './src/screens/EditarJornadaScreen';
import CrearJornadaScreen from './src/screens/CrearJornadaScreen';
import JornadasGestionScreen from './src/screens/JornadasGestionScreen';
import InformesJornadasScreen from './src/screens/InformesJornadasScreen';
import CrearAlumnoJornadaScreen from './src/screens/CrearAlumnoJornadaScreen';
import CertificadosScreen from './src/screens/CertificadosScreen';
import CertificadoHtmlScreen from './src/screens/CertificadoHtmlScreen';
import CambiarPasswordScreen from './src/screens/CambiarPasswordScreen';

const Stack = createStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: JORNADAS_VERDE,
    background: '#f0fdfa',
    card: '#ffffff',
    text: '#134e4a',
    border: '#ccfbf1',
  },
};

const headerOptions = {
  headerTintColor: '#fff',
  headerStyle: { backgroundColor: JORNADAS_VERDE, elevation: 0, shadowOpacity: 0 },
  headerTitleStyle: { fontWeight: '700' as const },
  cardStyle: { backgroundColor: '#f0fdfa' },
  headerRight: () => <HamburgerHeaderButton />,
};

function RootNavigator() {
  const { state } = useAuth();

  if (state.status === 'denied') {
    return (
      <DrawerProvider>
        <Stack.Navigator
          key="nav-denied"
          detachInactiveScreens={false}
          screenOptions={{ ...headerOptions, headerRight: undefined, headerLeft: () => <HamburgerHeaderButton /> }}
        >
          <Stack.Screen name="Denied" component={DeniedScreen} options={{ title: 'Sin acceso' }} />
        </Stack.Navigator>
        <AppDrawerMenu />
      </DrawerProvider>
    );
  }

  if (state.status === 'signedOut') {
    return (
      <Stack.Navigator
        key="nav-auth"
        detachInactiveScreens={false}
        screenOptions={{ ...headerOptions, headerRight: undefined }}
      >
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  }

  return (
    <DrawerProvider>
      <Stack.Navigator
        initialRouteName="Home"
        detachInactiveScreens={false}
        screenOptions={headerOptions}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'ARGO Jornadas',
            headerLeft: () => <HamburgerHeaderButton />,
            headerRight: undefined,
          }}
        />
        <Stack.Screen name="JornadasHoy" component={JornadasHoyScreen} options={{ title: 'Jornadas de hoy' }} />
        <Stack.Screen
          name="JornadasGestion"
          component={JornadasGestionScreen}
          options={{ title: 'Gestionar jornadas' }}
        />
        <Stack.Screen
          name="CrearJornada"
          component={CrearJornadaScreen}
          options={{ title: 'Nueva jornada' }}
        />
        <Stack.Screen
          name="InformesJornadas"
          component={InformesJornadasScreen}
          options={{ title: 'Informes' }}
        />
        <Stack.Screen
          name="ClasesJornada"
          component={ClasesJornadaScreen}
          options={({ route }) => ({ title: route.params.jornadaLabel.slice(0, 28) })}
        />
        <Stack.Screen name="ClaseDetalle" component={ClaseDetalleScreen} options={{ title: 'Operar clase' }} />
        <Stack.Screen
          name="EditarJornada"
          component={EditarJornadaScreen}
          options={{ title: 'Editar jornada' }}
        />
        <Stack.Screen
          name="CrearAlumnoJornada"
          component={CrearAlumnoJornadaScreen}
          options={{ title: 'Nuevo alumno jornada' }}
        />
        <Stack.Screen
          name="Certificados"
          component={CertificadosScreen}
          options={{ title: 'Certificados' }}
        />
        <Stack.Screen
          name="CertificadoHtml"
          component={CertificadoHtmlScreen}
          options={({ route }) => ({ title: route.params.titulo })}
        />
        <Stack.Screen
          name="CambiarPassword"
          component={CambiarPasswordScreen}
          options={{ title: 'Cambiar contraseña' }}
        />
      </Stack.Navigator>
      <AppDrawerMenu />
    </DrawerProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: JORNADAS_VERDE }}>
      <SafeAreaProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <AppBootGate>
              <NavigationContainer theme={navTheme}>
                <RootNavigator />
              </NavigationContainer>
            </AppBootGate>
            <StatusBar style="light" />
          </AuthProvider>
        </AccessibilityProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
