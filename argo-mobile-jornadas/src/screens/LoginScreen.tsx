import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { EmpresaBrandHeader } from '../components/EmpresaBrandHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { IconInput } from '../components/IconInput';
import { SurfaceCard } from '../components/SurfaceCard';
import { ScaledText } from '../components/ScaledText';
import { ARGO_AZUL_REY } from '../config/appBranding';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { mfaRecovery, mfaSetupConfirm, mfaVerify, pingHealth } from '../api/client';
import {
  DEFAULT_API_BASE,
  getApiBaseUrl,
  isLegacyDefaultServer,
  SERVIDOR_API_STORAGE_KEY,
  normalizeApiBaseUrl,
} from '../config/apiBase';
import { loadSavedLogin, persistSavedLogin } from '../storage/loginCredentials';
import { storeGet } from '../storage/safeStore';
import type { StaffLoginResponse } from '../api/types';
import { themeColors } from '../theme/colors';
import { useAccessibility } from '../context/AccessibilityContext';

type LoginUiStep = 'credentials' | 'mfa_verify' | 'mfa_setup' | 'mfa_recovery' | 'recovery_codes';

export default function LoginScreen() {
  const { signIn, finalizeSignIn, setServidor } = useAuth();
  const { refreshBranding } = useBranding();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);

  const [uiStep, setUiStep] = useState<LoginUiStep>('credentials');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [servidor, setServidorLocal] = useState('');
  const [remember, setRemember] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [mfaCode, setMfaCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [manualSecret, setManualSecret] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      const [s, saved] = await Promise.all([storeGet(SERVIDOR_API_STORAGE_KEY), loadSavedLogin()]);
      const base = s && !isLegacyDefaultServer(s) ? s : getApiBaseUrl() || DEFAULT_API_BASE;
      setServidorLocal(base.replace(/\/api\/?$/i, ''));
      setRemember(saved.remember);
      if (saved.remember) {
        setUser(saved.username);
        setPass(saved.password);
      }
    })();
  }, []);

  async function prepareServer(): Promise<void> {
    if (!servidor.trim()) {
      throw new Error('Escriba la dirección del servidor');
    }
    setStatus('Guardando servidor…');
    await setServidor(servidor);
    setStatus('Cargando marca institucional…');
    await refreshBranding();
    setStatus(`Probando ${getApiBaseUrl()}…`);
    await pingHealth();
  }

  async function handleCompleteLogin(res: StaffLoginResponse, savedUser?: string, savedPass?: string) {
    if (res.step !== 'complete' || !res.token || !res.user) {
      throw new Error('Respuesta de autenticación incompleta');
    }
    await finalizeSignIn(res.token, res.user);
    if (savedUser != null && savedPass != null) {
      void persistSavedLogin(remember, savedUser, savedPass);
    }
    if (res.recoveryCodes?.length) {
      setRecoveryCodes(res.recoveryCodes);
      setUiStep('recovery_codes');
      setStatus(null);
      return;
    }
    setStatus(null);
  }

  function handleLoginStep(res: StaffLoginResponse, savedUser?: string, savedPass?: string) {
    if (res.step === 'complete' && res.token && res.user) {
      void handleCompleteLogin(res, savedUser, savedPass).catch((e) => {
        setErr(e instanceof Error ? e.message : 'Error al iniciar sesión');
        setStatus(null);
      });
      return;
    }
    if (res.step === 'mfa_verify' && res.mfaToken) {
      setMfaToken(res.mfaToken);
      setDisplayName(res.username || '');
      setUiStep('mfa_verify');
      setMfaCode('');
      setStatus(null);
      return;
    }
    if (res.step === 'mfa_setup' && res.setupToken) {
      setSetupToken(res.setupToken);
      setDisplayName(res.username || '');
      setQrDataUrl(res.qrDataUrl || '');
      setManualSecret(res.manualSecret || '');
      setUiStep('mfa_setup');
      setMfaCode('');
      setStatus(null);
      return;
    }
    setErr(res.message || 'Respuesta de autenticación no reconocida');
    setStatus(null);
  }

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
    setLoading(true);
    try {
      await prepareServer();
      setStatus('Iniciando sesión…');
      const res = await signIn(usuario, pass);
      handleLoginStep(res, usuario, pass);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error de acceso');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  async function onMfaVerify() {
    const code = mfaCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setErr('Ingrese el código de 6 dígitos');
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await mfaVerify(mfaToken, code);
      handleLoginStep(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  }

  async function onMfaSetup() {
    const code = mfaCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setErr('Ingrese el código de 6 dígitos de su app');
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await mfaSetupConfirm(setupToken, code);
      handleLoginStep(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo activar 2FA');
    } finally {
      setLoading(false);
    }
  }

  async function onRecovery() {
    const code = recoveryCode.trim();
    if (!code) {
      setErr('Ingrese un código de recuperación');
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await mfaRecovery(mfaToken, code);
      handleLoginStep(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Código de recuperación inválido');
    } finally {
      setLoading(false);
    }
  }

  function onPrimaryAction() {
    if (uiStep === 'credentials') void onLogin();
    else if (uiStep === 'mfa_verify') void onMfaVerify();
    else if (uiStep === 'mfa_setup') void onMfaSetup();
    else if (uiStep === 'mfa_recovery') void onRecovery();
    else setUiStep('credentials');
  }

  const primaryLabel =
    uiStep === 'credentials'
      ? 'Entrar'
      : uiStep === 'mfa_setup'
        ? 'Activar y entrar'
        : uiStep === 'recovery_codes'
          ? 'Continuar'
          : 'Continuar';

  const primaryIcon =
    uiStep === 'credentials'
      ? 'log-in-outline'
      : uiStep === 'recovery_codes'
        ? 'checkmark-circle-outline'
        : 'shield-checkmark-outline';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.hero}>
          <EmpresaBrandHeader logoWidth={152} logoHeight={78} onDark />
          {uiStep === 'credentials' ? (
            <View style={styles.chips}>
              <Chip icon="school-outline" label="Capacitación" />
              <Chip icon="people-outline" label="Clases" />
              <Chip icon="location-outline" label="Campo" />
            </View>
          ) : (
            <ScaledText baseSize={14} style={styles.heroHint}>
              Verificación de seguridad
            </ScaledText>
          )}
        </View>

        <SurfaceCard style={styles.formCard}>
          {uiStep === 'credentials' ? (
            <>
              <IconInput
                label="Servidor (IP o dominio)"
                icon="server-outline"
                iconColor={c.accent}
                value={servidor}
                onChangeText={setServidorLocal}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="http://192.168.1.10:3000"
              />
              <ScaledText baseSize={12} style={{ color: c.textSoft, marginBottom: 12 }}>
                API: {normalizeApiBaseUrl(servidor) || '—'}
              </ScaledText>
              <IconInput
                label="Usuario"
                icon="person-outline"
                value={user}
                onChangeText={setUser}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <IconInput
                label="Contraseña"
                icon="lock-closed-outline"
                value={pass}
                onChangeText={setPass}
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={() => void onLogin()}
              />
              <Pressable
                onPress={() => setRemember((v) => !v)}
                style={styles.rememberRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: remember }}
              >
                <Switch
                  value={!!remember}
                  onValueChange={setRemember}
                  trackColor={{ false: '#cbd5e1', true: '#9fa8da' }}
                  thumbColor={remember ? ARGO_AZUL_REY : '#f8fafc'}
                />
                <ScaledText baseSize={14} style={{ color: c.text, flex: 1 }}>
                  Recordar usuario y contraseña
                </ScaledText>
              </Pressable>
            </>
          ) : null}

          {uiStep === 'mfa_verify' ? (
            <>
              <ScaledText baseSize={18} style={[styles.stepTitle, { color: c.text }]}>
                Verificación 2FA
              </ScaledText>
              <ScaledText baseSize={14} style={{ color: c.textSoft, lineHeight: 20, marginBottom: 16 }}>
                Hola {displayName || 'usuario'}. Abra Google Authenticator (o similar) e ingrese el código de 6
                dígitos.
              </ScaledText>
              <IconInput
                label="Código de autenticación"
                icon="keypad-outline"
                value={mfaCode}
                onChangeText={(t) => setMfaCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
                placeholder="000000"
              />
              <Pressable
                onPress={() => {
                  setUiStep('mfa_recovery');
                  setErr(null);
                  setRecoveryCode('');
                }}
              >
                <ScaledText baseSize={14} style={{ color: c.primary, fontWeight: '600', marginTop: 8 }}>
                  Usar código de recuperación
                </ScaledText>
              </Pressable>
            </>
          ) : null}

          {uiStep === 'mfa_setup' ? (
            <>
              <ScaledText baseSize={18} style={[styles.stepTitle, { color: c.text }]}>
                Activar 2FA (obligatorio)
              </ScaledText>
              <ScaledText baseSize={14} style={{ color: c.textSoft, lineHeight: 20, marginBottom: 12 }}>
                Escanee el QR con Google Authenticator o Microsoft Authenticator. Luego ingrese el código de 6 dígitos.
              </ScaledText>
              {qrDataUrl ? (
                <Image source={{ uri: qrDataUrl }} style={styles.qr} resizeMode="contain" />
              ) : null}
              {manualSecret ? (
                <View style={[styles.secretBox, { backgroundColor: c.bgAlt, borderColor: c.border }]}>
                  <ScaledText baseSize={12} style={{ color: c.textSoft, marginBottom: 4 }}>
                    Clave manual (si no puede escanear)
                  </ScaledText>
                  <ScaledText baseSize={13} style={{ color: c.text, fontWeight: '700', letterSpacing: 1 }}>
                    {manualSecret}
                  </ScaledText>
                </View>
              ) : null}
              <IconInput
                label="Código de la app"
                icon="keypad-outline"
                value={mfaCode}
                onChangeText={(t) => setMfaCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
                placeholder="000000"
              />
            </>
          ) : null}

          {uiStep === 'mfa_recovery' ? (
            <>
              <ScaledText baseSize={18} style={[styles.stepTitle, { color: c.text }]}>
                Código de recuperación
              </ScaledText>
              <ScaledText baseSize={14} style={{ color: c.textSoft, lineHeight: 20, marginBottom: 16 }}>
                Use uno de los códigos de un solo uso que guardó al activar 2FA.
              </ScaledText>
              <IconInput
                label="Código de recuperación"
                icon="document-text-outline"
                value={recoveryCode}
                onChangeText={setRecoveryCode}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="XXXXXXXXXX"
              />
              <Pressable
                onPress={() => {
                  setUiStep('mfa_verify');
                  setErr(null);
                  setMfaCode('');
                }}
              >
                <ScaledText baseSize={14} style={{ color: c.primary, fontWeight: '600', marginTop: 8 }}>
                  Volver al código de la app
                </ScaledText>
              </Pressable>
            </>
          ) : null}

          {uiStep === 'recovery_codes' ? (
            <>
              <ScaledText baseSize={18} style={[styles.stepTitle, { color: c.text }]}>
                Guarde sus códigos de recuperación
              </ScaledText>
              <ScaledText baseSize={14} style={{ color: c.danger, lineHeight: 20, marginBottom: 12, fontWeight: '600' }}>
                Guárdelos en un lugar seguro. Cada código solo sirve una vez si pierde el acceso a su app
                Authenticator.
              </ScaledText>
              <View style={[styles.codesBox, { backgroundColor: c.bgAlt, borderColor: c.border }]}>
                {recoveryCodes.map((code) => (
                  <ScaledText key={code} baseSize={15} style={{ color: c.text, fontWeight: '700', letterSpacing: 1.2 }}>
                    {code}
                  </ScaledText>
                ))}
              </View>
            </>
          ) : null}

          {status ? (
            <View style={[styles.msgBox, { backgroundColor: c.accentSoft }]}>
              <Ionicons name="sync-outline" size={18} color={c.primary} />
              <ScaledText baseSize={14} style={{ color: c.primary, fontWeight: '600', flex: 1 }}>
                {status}
              </ScaledText>
            </View>
          ) : null}

          {err ? (
            <View style={[styles.msgBox, { backgroundColor: c.dangerBg }]}>
              <Ionicons name="alert-circle-outline" size={18} color={c.danger} />
              <ScaledText baseSize={14} style={{ color: c.danger, flex: 1, lineHeight: 20 }}>
                {err}
              </ScaledText>
            </View>
          ) : null}

          <View style={{ marginTop: 18 }}>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={c.primary} size="large" />
                <ScaledText baseSize={14} style={{ color: c.textSoft }}>
                  Espere…
                </ScaledText>
              </View>
            ) : (
              <PrimaryButton
                label={primaryLabel}
                onPress={onPrimaryAction}
                fullWidth
                icon={primaryIcon}
              />
            )}
          </View>
        </SurfaceCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Chip({ icon, label }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color="#fff" />
      <ScaledText baseSize={12} style={{ color: '#fff', fontWeight: '600' }}>
        {label}
      </ScaledText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  hero: {
    paddingTop: 52,
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: ARGO_AZUL_REY,
  },
  heroHint: { color: 'rgba(255,255,255,0.9)', marginTop: 12, fontWeight: '600' },
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
  formCard: {
    marginHorizontal: 20,
    marginTop: -22,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  msgBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  stepTitle: { fontWeight: '800', marginBottom: 8 },
  qr: { width: 220, height: 220, alignSelf: 'center', marginBottom: 12 },
  secretBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  codesBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
});
