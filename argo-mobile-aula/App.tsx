import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PortalConfigProvider } from './src/context/PortalConfigContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import CatalogoScreen from './src/screens/CatalogoScreen';
import CursoDetalleScreen from './src/screens/CursoDetalleScreen';
import RegistroScreen from './src/screens/RegistroScreen';
import ConsultaCertificadosScreen from './src/screens/ConsultaCertificadosScreen';
import AulaHubScreen from './src/screens/AulaHubScreen';
import CoursePlayerScreen from './src/screens/CoursePlayerScreen';
import DocumentoHtmlScreen from './src/screens/DocumentoHtmlScreen';
import EvaluacionCohorteScreen from './src/screens/EvaluacionCohorteScreen';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createStackNavigator<RootStackParamList>();

function BootstrapScreen() {
  const c = useTheme();
  return (
    <LinearGradient colors={[c.primaryDark, c.primary, c.accent]} style={styles.boot}>
      <View style={styles.bootLogoRing}>
        <Image source={require('./assets/icon.png')} style={styles.bootLogo} />
      </View>
      <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
      <Text style={styles.bootText}>ARGO Aula</Text>
    </LinearGradient>
  );
}

function ThemedNavigator() {
  const { state } = useAuth();
  const c = useTheme();
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: c.primary,
      background: c.bg,
      card: c.card,
      text: c.text,
      border: c.border,
    },
  };

  const headerOptions = {
    headerTintColor: '#fff',
    headerStyle: { backgroundColor: c.primaryDark, elevation: 0, shadowOpacity: 0 },
    headerTitleStyle: { fontWeight: '700' as const },
    cardStyle: { backgroundColor: c.bg },
  };

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
            <Stack.Screen
              name="CoursePlayer"
              component={CoursePlayerScreen}
              options={({ route }) => ({ title: route.params.titulo })}
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
            <Stack.Screen name="Catalogo" component={CatalogoScreen} options={{ title: 'Catálogo' }} />
            <Stack.Screen
              name="CursoDetalle"
              component={CursoDetalleScreen}
              options={({ route }) => ({ title: route.params.titulo ?? 'Curso' })}
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
            <Stack.Screen name="Catalogo" component={CatalogoScreen} options={{ title: 'Catálogo' }} />
            <Stack.Screen
              name="CursoDetalle"
              component={CursoDetalleScreen}
              options={({ route }) => ({ title: route.params.titulo ?? 'Curso' })}
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

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PortalConfigProvider>
          <ThemeProvider>
            <AuthProvider>
              <ThemedNavigator />
              <StatusBar style="light" />
            </AuthProvider>
          </ThemeProvider>
        </PortalConfigProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bootLogoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootLogo: { width: 64, height: 64, borderRadius: 12 },
  bootText: { color: '#fff', marginTop: 16, fontSize: 18, fontWeight: '700' },
});
