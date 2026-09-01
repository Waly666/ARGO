import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AppBootGate } from './src/bootstrap/splash';
import { AccessibilityProvider } from './src/context/AccessibilityContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { BrandingProvider } from './src/context/BrandingContext';
import { DrawerProvider } from './src/context/DrawerContext';
import { AppDrawerMenu, HamburgerHeaderButton } from './src/components/AppDrawerMenu';
import { ARGO_AZUL_REY } from './src/config/appBranding';
import { ScreenPermisoGate } from './src/components/ScreenPermisoGate';
import type { RootStackParamList } from './src/navigation/types';
import type { JornadasAppPantalla } from './src/utils/permisos';
import { VoiceProvider } from './src/voice/VoiceContext';
import { VoiceMicOverlay } from './src/voice/VoiceMicOverlay';
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

function conPermisoPantalla<P extends object>(
  pantalla: JornadasAppPantalla,
  Screen: React.ComponentType<P>,
): React.ComponentType<P> {
  const Wrapped = (props: P) => (
    <ScreenPermisoGate pantalla={pantalla}>
      <Screen {...props} />
    </ScreenPermisoGate>
  );
  Wrapped.displayName = `ConPermiso(${Screen.displayName || Screen.name || pantalla})`;
  return Wrapped;
}

const JornadasHoyGate = conPermisoPantalla('hoy', JornadasHoyScreen);
const JornadasGestionGate = conPermisoPantalla('gestionar', JornadasGestionScreen);
const CrearJornadaGate = conPermisoPantalla('crear', CrearJornadaScreen);
const InformesJornadasGate = conPermisoPantalla('informes', InformesJornadasScreen);
const ClasesJornadaGate = conPermisoPantalla('operar_clase', ClasesJornadaScreen);
const ClaseDetalleGate = conPermisoPantalla('operar_clase', ClaseDetalleScreen);
const EditarJornadaGate = conPermisoPantalla('editar', EditarJornadaScreen);
const CrearAlumnoJornadaGate = conPermisoPantalla('registrar_alumno', CrearAlumnoJornadaScreen);
const CertificadosGate = conPermisoPantalla('certificados', CertificadosScreen);
const CertificadoHtmlGate = conPermisoPantalla('certificados', CertificadoHtmlScreen);

const Stack = createStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: ARGO_AZUL_REY,
    background: '#F4F6FB',
    card: '#ffffff',
    text: '#0F172A',
    border: '#E8ECF4',
  },
};

const headerOptions = {
  headerTintColor: '#fff',
  headerStyle: { backgroundColor: ARGO_AZUL_REY, elevation: 0, shadowOpacity: 0 },
  headerTitleStyle: { fontWeight: '700' as const },
  cardStyle: { backgroundColor: '#F4F6FB' },
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
        <Stack.Screen name="JornadasHoy" component={JornadasHoyGate} options={{ title: 'Jornadas de hoy' }} />
        <Stack.Screen
          name="JornadasGestion"
          component={JornadasGestionGate}
          options={{ title: 'Gestionar jornadas' }}
        />
        <Stack.Screen
          name="CrearJornada"
          component={CrearJornadaGate}
          options={{ title: 'Nueva jornada' }}
        />
        <Stack.Screen
          name="InformesJornadas"
          component={InformesJornadasGate}
          options={{ title: 'Informes' }}
        />
        <Stack.Screen
          name="ClasesJornada"
          component={ClasesJornadaGate}
          options={({ route }) => ({ title: route.params.jornadaLabel.slice(0, 28) })}
        />
        <Stack.Screen name="ClaseDetalle" component={ClaseDetalleGate} options={{ title: 'Operar clase' }} />
        <Stack.Screen
          name="EditarJornada"
          component={EditarJornadaGate}
          options={{ title: 'Editar jornada' }}
        />
        <Stack.Screen
          name="CrearAlumnoJornada"
          component={CrearAlumnoJornadaGate}
          options={{ title: 'Nuevo alumno jornada' }}
        />
        <Stack.Screen
          name="Certificados"
          component={CertificadosGate}
          options={{ title: 'Certificados' }}
        />
        <Stack.Screen
          name="CertificadoHtml"
          component={CertificadoHtmlGate}
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F4F6FB' }}>
      <SafeAreaProvider>
        <AccessibilityProvider>
          <BrandingProvider>
            <AuthProvider>
              <VoiceProvider>
                <AppBootGate>
                  <NavigationContainer theme={navTheme}>
                    <RootNavigator />
                  </NavigationContainer>
                </AppBootGate>
                <VoiceMicOverlay />
                <StatusBar style="light" />
              </VoiceProvider>
            </AuthProvider>
          </BrandingProvider>
        </AccessibilityProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
