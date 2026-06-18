import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { IconInput } from '../components/IconInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import { useAuth } from '../context/AuthContext';
import { usePortalConfig } from '../context/PortalConfigContext';
import { useTheme } from '../context/ThemeContext';
import { pingHealth } from '../api/client';
import { getApiBaseUrl, SERVIDOR_API_STORAGE_KEY } from '../config/apiBase';
import { loadSavedLogin, persistSavedLogin } from '../storage/loginCredentials';
import { secureGet } from '../storage/safeStore';
import { resolveUploadUrl } from '../utils/uploadUrl';
import type { RootStackParamList } from '../navigation/types';

export default function LoginScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { signIn, setServidor } = useAuth();
  const { config } = usePortalConfig();
  const c = useTheme();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [servidor, setServidorLocal] = useState('');
  const [remember, setRemember] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showServer, setShowServer] = useState(false);

  useEffect(() => {
    void (async () => {
      const [s, saved] = await Promise.all([secureGet(SERVIDOR_API_STORAGE_KEY), loadSavedLogin()]);
      const base = s || getApiBaseUrl();
      setServidorLocal(base.replace(/\/api\/?$/i, ''));
      setRemember(saved.remember);
      if (saved.remember) {
        setEmail(saved.email);
        setPass(saved.password);
      }
    })();
  }, []);

  async function onLogin() {
    setErr(null);
    setStatus(null);
    if (!email.trim()) {
      setErr('Escriba su correo');
      return;
    }
    if (!pass) {
      setErr('Escriba la contraseña');
      return;
    }
    setLoading(true);
    try {
      if (servidor.trim()) {
        setStatus('Guardando servidor…');
        await setServidor(servidor);
      }
      setStatus('Conectando…');
      const ok = await pingHealth();
      if (!ok) throw new Error(`Sin conexión con ${getApiBaseUrl()}`);
      setStatus('Iniciando sesión…');
      await signIn(email, pass);
      void persistSavedLogin(remember, email, pass);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error de acceso');
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  const logo = resolveUploadUrl(config?.urlLogoAbsoluta) || resolveUploadUrl(config?.urlLogo);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[c.primaryDark, c.primary, c.accent]} style={styles.hero}>
        {logo ? (
          <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" />
        ) : (
          <ScaledText baseSize={28} style={styles.heroTitle}>
            {config?.nombreCea ?? 'ARGO Aula'}
          </ScaledText>
        )}
        <ScaledText baseSize={15} style={styles.heroSub}>
          Portal del alumno
        </ScaledText>
      </LinearGradient>
      <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.form}>
        <SurfaceCard>
          <ScaledText baseSize={20} style={{ color: c.text, fontWeight: '800', marginBottom: 16 }}>
            Iniciar sesión
          </ScaledText>
          <IconInput
            value={email}
            onChangeText={setEmail}
            placeholder="Correo electrónico"
            icon="mail-outline"
            keyboardType="email-address"
          />
          <IconInput
            value={pass}
            onChangeText={setPass}
            placeholder="Contraseña"
            icon="lock-closed-outline"
            secureTextEntry
          />
          <Pressable onPress={() => setRemember((r) => !r)} style={styles.remember}>
            <ScaledText baseSize={14} style={{ color: c.textSoft }}>
              {remember ? '☑' : '☐'} Recordar credenciales
            </ScaledText>
          </Pressable>
          {err ? (
            <ScaledText baseSize={14} style={{ color: c.danger, marginBottom: 8 }}>
              {err}
            </ScaledText>
          ) : null}
          {status ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={c.primary} />
              <ScaledText baseSize={13} style={{ color: c.textSoft, marginLeft: 8 }}>
                {status}
              </ScaledText>
            </View>
          ) : null}
          <PrimaryButton label="Entrar" onPress={onLogin} loading={loading} fullWidth icon="log-in-outline" />
          <Pressable onPress={() => setShowServer((s) => !s)} style={{ marginTop: 12 }}>
            <ScaledText baseSize={13} style={{ color: c.textSoft, textAlign: 'center' }}>
              {showServer ? 'Ocultar servidor' : 'Configurar servidor'}
            </ScaledText>
          </Pressable>
          {showServer ? (
            <IconInput
              value={servidor}
              onChangeText={setServidorLocal}
              placeholder="https://su-servidor.com"
              icon="server-outline"
            />
          ) : null}
        </SurfaceCard>
        <View style={styles.links}>
          {config?.registroAbierto !== false ? (
            <Pressable onPress={() => nav.navigate('Registro')}>
              <ScaledText baseSize={14} style={{ color: c.primary, fontWeight: '600' }}>
                Crear cuenta
              </ScaledText>
            </Pressable>
          ) : null}
          <Pressable onPress={() => nav.navigate('Catalogo')}>
            <ScaledText baseSize={14} style={{ color: c.primary, fontWeight: '600' }}>
              Ver catálogo de cursos
            </ScaledText>
          </Pressable>
          <Pressable onPress={() => nav.navigate('ConsultaCertificados')}>
            <ScaledText baseSize={14} style={{ color: c.primary, fontWeight: '600' }}>
              Consultar certificados
            </ScaledText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 56, paddingBottom: 32, paddingHorizontal: 24, alignItems: 'center' },
  logo: { width: 120, height: 80 },
  heroTitle: { color: '#fff', fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.9)', marginTop: 8 },
  form: { padding: 16, paddingBottom: 40 },
  remember: { marginBottom: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  links: { marginTop: 20, gap: 14, alignItems: 'center' },
});
