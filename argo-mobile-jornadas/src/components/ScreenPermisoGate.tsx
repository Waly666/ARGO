import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { PrimaryButton } from './PrimaryButton';
import { ScaledText } from './ScaledText';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import type { RootStackParamList } from '../navigation/types';
import { themeColors } from '../theme/colors';
import { etiquetaPermisoPantalla } from '../theme/modules';
import {
  JORNADAS_APP_PERMISO,
  type JornadasAppPantalla,
  puedePantallaJornadas,
} from '../utils/permisos';

type Props = {
  pantalla: JornadasAppPantalla;
  titulo?: string;
  children: React.ReactNode;
};

/** Bloquea la pantalla si el rol no tiene el permiso móvil configurado en el ERP. */
export function ScreenPermisoGate({ pantalla, titulo, children }: Props) {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const permisos = state.status === 'signedIn' ? state.user?.permisos : undefined;
  const ok = puedePantallaJornadas(permisos, pantalla);

  useEffect(() => {
    if (!ok && nav.canGoBack()) {
      const t = setTimeout(() => nav.goBack(), 120);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [ok, nav]);

  if (ok) return <>{children}</>;

  const permiso = JORNADAS_APP_PERMISO[pantalla];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScaledText baseSize={20} style={{ color: c.text, fontWeight: '800', marginBottom: 10 }}>
        {titulo || 'Sin permiso'}
      </ScaledText>
      <ScaledText baseSize={14} style={{ color: c.textSoft, lineHeight: 21, marginBottom: 20 }}>
        Su rol no incluye el permiso «{etiquetaPermisoPantalla(pantalla)}» ({permiso}). Pida acceso en
        Configuración → Roles y permisos del ERP.
      </ScaledText>
      <PrimaryButton
        label="Volver al inicio"
        icon="home-outline"
        onPress={() => nav.navigate('Home')}
        fullWidth
      />
      <View style={{ height: 12 }} />
      {nav.canGoBack() ? (
        <PrimaryButton label="Atrás" onPress={() => nav.goBack()} variant="ghost" fullWidth />
      ) : (
        <ActivityIndicator color={c.primary} style={{ marginTop: 8 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, justifyContent: 'center' },
});
