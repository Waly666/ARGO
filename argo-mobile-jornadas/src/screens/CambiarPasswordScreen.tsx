import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { IconInput } from '../components/IconInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import { cambiarPassword } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { loadSavedLogin, persistSavedLogin } from '../storage/loginCredentials';
import { themeColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

export default function CambiarPasswordScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const user = state.status === 'signedIn' ? state.user : null;

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirma, setConfirma] = useState('');
  const [busy, setBusy] = useState(false);

  async function onGuardar() {
    if (!actual) {
      Alert.alert('Contraseña', 'Escriba la contraseña actual.');
      return;
    }
    if (nueva.length < 4) {
      Alert.alert('Contraseña', 'La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (nueva !== confirma) {
      Alert.alert('Contraseña', 'La confirmación no coincide con la nueva contraseña.');
      return;
    }
    if (nueva === actual) {
      Alert.alert('Contraseña', 'La nueva debe ser distinta a la actual.');
      return;
    }

    setBusy(true);
    try {
      await cambiarPassword(actual, nueva);
      const saved = await loadSavedLogin();
      if (saved.remember && user?.username) {
        await persistSavedLogin(true, user.username, nueva);
      }
      Alert.alert('Listo', 'Contraseña actualizada.', [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
      setActual('');
      setNueva('');
      setConfirma('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cambiar la contraseña');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SurfaceCard>
          <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800' }}>
            Cambiar contraseña
          </ScaledText>
          <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 6, lineHeight: 18 }}>
            Solo afecta a la cuenta con la que inició sesión
            {user?.username ? ` (${user.username})` : ''}.
          </ScaledText>
        </SurfaceCard>

        <SurfaceCard style={{ marginTop: 12 }}>
          <IconInput
            label="Contraseña actual *"
            icon="lock-closed-outline"
            value={actual}
            onChangeText={setActual}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
          />
          <View style={{ height: 10 }} />
          <IconInput
            label="Nueva contraseña *"
            icon="key-outline"
            value={nueva}
            onChangeText={setNueva}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            placeholder="Mínimo 4 caracteres"
          />
          <View style={{ height: 10 }} />
          <IconInput
            label="Confirmar nueva *"
            icon="checkmark-circle-outline"
            value={confirma}
            onChangeText={setConfirma}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
          />
        </SurfaceCard>

        <View style={{ height: 16 }} />
        <PrimaryButton
          label={busy ? 'Guardando…' : 'Guardar contraseña'}
          icon="save-outline"
          fullWidth
          disabled={busy}
          onPress={() => void onGuardar()}
        />
        <View style={{ height: 8 }} />
        <PrimaryButton
          label="Cancelar"
          variant="ghost"
          fullWidth
          disabled={busy}
          onPress={() => nav.goBack()}
        />
        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
});
