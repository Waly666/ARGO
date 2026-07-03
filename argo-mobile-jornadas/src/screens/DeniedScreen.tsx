import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { useAuth } from '../context/AuthContext';
import { themeColors } from '../theme/colors';
import { useAccessibility } from '../context/AccessibilityContext';

export default function DeniedScreen() {
  const { state, signOut } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const user = state.status === 'denied' ? state.user : null;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScaledText baseSize={22} style={{ color: c.text, fontWeight: '800', marginBottom: 12 }}>
        Sin permiso
      </ScaledText>
      <ScaledText baseSize={15} style={{ color: c.textSoft, lineHeight: 22, marginBottom: 20 }}>
        {user?.username || 'Usuario'} no tiene permiso «jornadas.operar». Pida acceso al administrador o use la web
        ARGO para planificación.
      </ScaledText>
      <PrimaryButton label="Cerrar sesión" onPress={() => void signOut()} variant="ghost" fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, justifyContent: 'center' },
});
