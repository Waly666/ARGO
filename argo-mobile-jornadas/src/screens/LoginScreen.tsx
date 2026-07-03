import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { PreLoginBrand } from '../bootstrap/splash';
import { PrimaryButton } from '../components/PrimaryButton';
import { IconInput } from '../components/IconInput';
import { SurfaceCard } from '../components/SurfaceCard';
import { ScaledText } from '../components/ScaledText';
import { JORNADAS_VERDE } from '../config/appBranding';
import { useAuth } from '../context/AuthContext';
import { pingHealth } from '../api/client';
import {
  DEFAULT_API_BASE,
  getApiBaseUrl,
  isLegacyDefaultServer,
  SERVIDOR_API_STORAGE_KEY,
  normalizeApiBaseUrl,
} from '../config/apiBase';
import { loadSavedLogin, persistSavedLogin } from '../storage/loginCredentials';
import { storeGet } from '../storage/safeStore';
import { themeColors } from '../theme/colors';
import { useAccessibility } from '../context/AccessibilityContext';

export default function LoginScreen() {
  const { signIn, setServidor } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [servidor, setServidorLocal] = useState('');
  const [remember, setRemember] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [s, saved] = await Promise.all([storeGet(SERVIDOR_API_STORAGE_KEY), loadSavedLogin()]);
      const base =
        s && !isLegacyDefaultServer(s) ? s : getApiBaseUrl() || DEFAULT_API_BASE;
      setServidorLocal(base.replace(/\/api\/?$/i, ''));
      setRemember(saved.remember);
      if (saved.remember) {
        setUser(saved.username);
        setPass(saved.password);
      }
    })();
  }, []);

  async function onLogin() {
    setErr(null);
    setStatus(null);
    const usuario = user.trim();
    if (!usuario) {
      setErr('Escriba el usuario');
      return;
    }
    if (!pass) {
      setErr('Escriba la contraseña');
      return;
    }
    if (!servidor.trim()) {
      setErr('Escriba la dirección del servidor');
      return;
    }

    setLoading(true);
    try {
      setStatus('Conectando…');
      await setServidor(servidor);
      await pingHealth();
      setStatus('Iniciando sesión…');
      await signIn(usuario, pass);
      void persistSavedLogin(remember, usuario, pass);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error de acceso');
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: JORNADAS_VERDE }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <PreLoginBrand />
        <SurfaceCard style={{ marginTop: 24 }}>
          <IconInput
            label="Servidor (IP o dominio)"
            icon="server-outline"
            value={servidor}
            onChangeText={setServidorLocal}
            autoCapitalize="none"
            placeholder="192.168.1.10:3000"
          />
          <View style={{ height: 12 }} />
          <IconInput
            label="Usuario"
            icon="person-outline"
            value={user}
            onChangeText={setUser}
            autoCapitalize="none"
          />
          <View style={{ height: 12 }} />
          <IconInput
            label="Contraseña"
            icon="lock-closed-outline"
            value={pass}
            onChangeText={setPass}
            secureTextEntry
          />
          <Pressable style={styles.remember} onPress={() => setRemember((v) => !v)}>
            <Switch
              value={!!remember}
              onValueChange={setRemember}
              trackColor={{ false: '#cbd5e1', true: c.primary }}
            />
            <ScaledText baseSize={14} style={{ color: c.textSoft, marginLeft: 8 }}>
              Recordar usuario
            </ScaledText>
          </Pressable>
          {err ? (
            <ScaledText baseSize={14} style={{ color: c.danger, marginTop: 8 }}>
              {err}
            </ScaledText>
          ) : null}
          {status ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color={c.primary} size="small" />
              <ScaledText baseSize={13} style={{ color: c.textSoft, marginLeft: 8 }}>
                {status}
              </ScaledText>
            </View>
          ) : null}
          <View style={{ height: 16 }} />
          <PrimaryButton label="Entrar" onPress={onLogin} disabled={loading} fullWidth icon="log-in-outline" />
          <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 14, textAlign: 'center' }}>
            API: {normalizeApiBaseUrl(servidor) || '—'}
          </ScaledText>
        </SurfaceCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20, paddingTop: 48, paddingBottom: 32 },
  remember: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
});
