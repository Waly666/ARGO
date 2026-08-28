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
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconInput } from '../components/IconInput';
import { PortalBrandHeader } from '../components/PortalBrandHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import { usePortalBranding } from '../hooks/usePortalBranding';
import { useAuth } from '../context/AuthContext';
import { usePortalConfig } from '../context/PortalConfigContext';
import { useTheme } from '../context/ThemeContext';
import { pingHealth } from '../api/client';
import { AULA_AZUL_REY, AULA_NAVY, AULA_NAVY_SOFT } from '../config/appBranding';
import { getApiBaseUrl, SERVIDOR_API_STORAGE_KEY } from '../config/apiBase';
import { loadSavedLogin, persistSavedLogin } from '../storage/loginCredentials';
import { secureGet } from '../storage/safeStore';
import type { RootStackParamList } from '../navigation/types';
import { layout } from '../theme/tokens';

function Chip({ icon, label }: { icon: ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color="#fff" />
      <ScaledText baseSize={12} style={{ color: '#fff', fontWeight: '600' }}>
        {label}
      </ScaledText>
    </View>
  );
}

export default function LoginScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { signIn, setServidor } = useAuth();
  const { config } = usePortalConfig();
  const { tituloApp } = usePortalBranding();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [servidor, setServidorLocal] = useState('');
  const [remember, setRemember] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showServer, setShowServer] = useState(false);
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [s, saved] = await Promise.all([secureGet(SERVIDOR_API_STORAGE_KEY), loadSavedLogin()]);
      if (cancelled) return;
      const base = s || getApiBaseUrl();
      setServidorLocal(base.replace(/\/api\/?$/i, ''));
      setRemember(saved.remember);
      if (saved.remember) {
        setEmail(saved.email);
        setPass(saved.password);
      }
      setBootDone(true);
    })();
    return () => {
      cancelled = true;
    };
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

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: c.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
        <LinearGradient
          colors={[AULA_NAVY, AULA_NAVY_SOFT, '#1A2240']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: Math.max(insets.top, 12) + 40 }]}
        >
          <View style={styles.headerGlow} />
          <Pressable onPress={() => nav.goBack()} style={styles.back} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <PortalBrandHeader lead={`Accede a ${tituloApp}`} />
          <View style={styles.chips}>
            <Chip icon="library-outline" label="Cursos" />
            <Chip icon="ribbon-outline" label="Certificados" />
            <Chip icon="school-outline" label="Aula virtual" />
          </View>
        </LinearGradient>

        <SurfaceCard style={styles.formCard}>
          <ScaledText baseSize={22} style={{ color: c.text, fontWeight: '800', marginBottom: 4 }}>
            Iniciar sesión
          </ScaledText>
          <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 16 }}>
            Accede a tus cursos y certificados
          </ScaledText>

          {bootDone ? (
            <>
              <IconInput
                value={email}
                onChangeText={setEmail}
                placeholder="Correo electrónico"
                icon="mail-outline"
                keyboardType="email-address"
                textContentType="username"
                autoComplete="email"
                returnKeyType="next"
              />
              <IconInput
                value={pass}
                onChangeText={setPass}
                placeholder="Contraseña"
                icon="lock-closed-outline"
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={() => void onLogin()}
              />
            </>
          ) : (
            <ActivityIndicator color={c.primary} style={{ marginVertical: 20 }} />
          )}

          <Pressable onPress={() => setRemember((r) => !r)} style={styles.rememberRow}>
            <Switch
              value={remember}
              onValueChange={setRemember}
              trackColor={{ false: '#cbd5e1', true: '#9fa8da' }}
              thumbColor={remember ? AULA_AZUL_REY : '#f8fafc'}
            />
            <ScaledText baseSize={14} style={{ color: c.text, flex: 1 }}>
              Recordar credenciales
            </ScaledText>
          </Pressable>

          {err ? (
            <View style={[styles.msgBox, { backgroundColor: c.dangerSoft }]}>
              <Ionicons name="alert-circle" size={18} color={c.danger} />
              <ScaledText baseSize={14} style={{ color: c.danger, flex: 1 }}>
                {err}
              </ScaledText>
            </View>
          ) : null}

          {status ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={c.primary} />
              <ScaledText baseSize={13} style={{ color: c.textSoft, marginLeft: 8 }}>
                {status}
              </ScaledText>
            </View>
          ) : null}

          <PrimaryButton
            label="Entrar al aula"
            onPress={onLogin}
            loading={loading}
            fullWidth
            icon="log-in-outline"
            size="lg"
            color={AULA_AZUL_REY}
          />

          <Pressable onPress={() => setShowServer((s) => !s)} style={styles.serverToggle}>
            <Ionicons name="server-outline" size={16} color={c.textSoft} />
            <ScaledText baseSize={13} style={{ color: c.textSoft, marginLeft: 6 }}>
              {showServer ? 'Ocultar servidor' : 'Configurar servidor'}
            </ScaledText>
          </Pressable>
          {showServer ? (
            <IconInput
              value={servidor}
              onChangeText={setServidorLocal}
              placeholder="https://app.finstruvial.edu.co"
              icon="globe-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : null}
        </SurfaceCard>

        <View style={styles.links}>
          {config?.registroAbierto !== false ? (
            <LinkRow label="Crear cuenta nueva" icon="person-add-outline" onPress={() => nav.navigate('Registro')} />
          ) : null}
          <LinkRow label="Explorar cursos" icon="library-outline" onPress={() => nav.navigate('Catalogo')} />
          <LinkRow label="Consultar certificados" icon="ribbon-outline" onPress={() => nav.navigate('ConsultaCertificados')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LinkRow({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.linkRow, { borderColor: c.border, opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.linkIcon, { backgroundColor: c.accentSoft }]}>
        <Ionicons name={icon} size={18} color={c.primary} />
      </View>
      <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '600', flex: 1 }}>
        {label}
      </ScaledText>
      <Ionicons name="chevron-forward" size={16} color={c.textSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 28 },
  hero: {
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: AULA_AZUL_REY,
    opacity: 0.14,
    top: -60,
    right: -50,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  formCard: { marginHorizontal: layout.screen, marginTop: -22 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 4 },
  msgBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 12, padding: 12, borderRadius: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 4 },
  serverToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  links: { marginTop: 24, marginHorizontal: layout.screen, gap: 10 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
});
