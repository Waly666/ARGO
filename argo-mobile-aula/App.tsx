import React, { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PortalConfigProvider } from './src/context/PortalConfigContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { BootstrapScreen, SplashGate } from './src/bootstrap/splash';
import { useAndroidImmersiveNav } from './src/hooks/useAndroidImmersiveNav';
import { AULA_AZUL_REY } from './src/config/appBranding';
import LoginScreen from './src/screens/LoginScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import CatalogoScreen from './src/screens/CatalogoScreen';
import CursoDetalleScreen from './src/screens/CursoDetalleScreen';
import RegistroScreen from './src/screens/RegistroScreen';
import ConsultaCertificadosScreen from './src/screens/ConsultaCertificadosScreen';
import AulaHubScreen from './src/screens/AulaHubScreen';
import CoursePlayerScreen from './src/screens/CoursePlayerScreen';
import DocumentoHtmlScreen from './src/screens/DocumentoHtmlScreen';
import PagoCheckoutScreen from './src/screens/PagoCheckoutScreen';
import EvaluacionCohorteScreen from './src/screens/EvaluacionCohorteScreen';
import CursosPanel from './src/screens/aula/CursosPanel';
import MisCursosPanel from './src/screens/aula/MisCursosPanel';
import PresencialesPanel from './src/screens/aula/PresencialesPanel';
import PuntajesPanel from './src/screens/aula/PuntajesPanel';
import CertificadosPanel from './src/screens/aula/CertificadosPanel';
import ForoPanel from './src/screens/aula/ForoPanel';
import PerfilPanel from './src/screens/aula/PerfilPanel';
import type { RootStackParamList } from './src/navigation/types';
import type { ThemeVariant } from './src/theme/colors';

const Stack = createStackNavigator<RootStackParamList>();

const MODULE_HEADER = {
  headerTintColor: '#fff',
  headerStyle: {
    backgroundColor: AULA_AZUL_REY,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitleStyle: { fontWeight: '700' as const, color: '#fff' },
};

function ThemedNavigator() {
  const { state } = useAuth();
  const c = useTheme();
  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: c.primary,
        background: c.bg,
        card: c.headerBg,
        text: c.text,
        border: c.border,
      },
    }),
    [c.primary, c.bg, c.headerBg, c.text, c.border],
  );

  const headerOptions = useMemo(
    () => ({
      ...MODULE_HEADER,
      cardStyle: { backgroundColor: c.bg },
    }),
    [c.bg],
  );

  if (state.status === 'loading') {
    return (
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Bootstrap" component={BootstrapScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={headerOptions}>
        {state.status === 'signedIn' ? (
          <>
            <Stack.Screen name="AulaHub" component={AulaHubScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AulaCursos" component={CursosPanel} options={{ title: 'Catálogo' }} />
            <Stack.Screen name="AulaMisCursos" component={MisCursosPanel} options={{ title: 'Mis cursos' }} />
            <Stack.Screen name="AulaPresenciales" component={PresencialesPanel} options={{ title: 'Clases presenciales' }} />
            <Stack.Screen name="AulaPuntajes" component={PuntajesPanel} options={{ title: 'Mis puntajes' }} />
            <Stack.Screen name="AulaCertificados" component={CertificadosPanel} options={{ title: 'Certificados' }} />
            <Stack.Screen name="AulaForo" component={ForoPanel} options={{ title: 'Foro', headerShown: false }} />
            <Stack.Screen name="AulaPerfil" component={PerfilPanel} options={{ title: 'Mi perfil' }} />
            <Stack.Screen
              name="CoursePlayer"
              component={CoursePlayerScreen}
              options={({ route }) => ({
                title: route.params.titulo,
                gestureEnabled: false,
                animation: 'fade',
              })}
            />
            <Stack.Screen
              name="DocumentoHtml"
              component={DocumentoHtmlScreen}
              options={({ route }) => ({ title: route.params.title })}
            />
            <Stack.Screen
              name="EvaluacionCohorte"
              component={EvaluacionCohorteScreen}
              options={({ route }) => ({ title: route.params.titulo })}
            />
            <Stack.Screen name="Catalogo" component={CatalogoScreen} options={{ title: 'Cursos' }} />
            <Stack.Screen name="CursoDetalle" component={CursoDetalleScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="PagoCheckout"
              component={PagoCheckoutScreen}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
              name="ConsultaCertificados"
              component={ConsultaCertificadosScreen}
              options={{ title: 'Consultar certificados' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Registro" component={RegistroScreen} options={{ title: 'Registro' }} />
            <Stack.Screen name="Catalogo" component={CatalogoScreen} options={{ title: 'Cursos' }} />
            <Stack.Screen name="CursoDetalle" component={CursoDetalleScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="PagoCheckout"
              component={PagoCheckoutScreen}
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen
              name="ConsultaCertificados"
              component={ConsultaCertificadosScreen}
              options={{ title: 'Consultar certificados' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppShell() {
  const { state } = useAuth();
  const variant: ThemeVariant = state.status === 'signedIn' ? 'dashboard' : 'public';
  useAndroidImmersiveNav(state.status !== 'loading');

  return (
    <ThemeProvider variant={variant}>
      <SplashGate>
        <ThemedNavigator />
      </SplashGate>
      <StatusBar style={state.status === 'signedIn' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PortalConfigProvider>
            <AppShell />
          </PortalConfigProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
