import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScaledText } from '../components/ScaledText';
import { AlertBannerStack } from '../components/AlertBannerStack';
import { ModuleTile } from '../components/ModuleTile';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { APP_BRANDING, CAJERO_AZUL_REY, CAJERO_AZUL_REY_CLARO } from '../config/appBranding';
import { themeColors } from '../theme/colors';
import { APP_MODULES } from '../theme/modules';
import { tienePermiso } from '../utils/permisos';
import type { RootStackParamList } from '../navigation/types';

function nombreCompletoUsuario(user: {
  nombres?: string;
  apellidos?: string;
  username?: string;
} | null): string {
  if (!user) return 'usuario';
  const full = [user.nombres, user.apellidos].map((s) => String(s || '').trim()).filter(Boolean).join(' ');
  return full || user.username || 'usuario';
}

export default function HomeScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { state, signOut } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const user = state.status === 'signedIn' ? state.user : null;

  const visible = APP_MODULES.filter((t) => !t.permiso || tienePermiso(user?.permisos, t.permiso));
  const displayName = useMemo(() => nombreCompletoUsuario(user), [user]);
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const rolLabel = user?.rolNombre || user?.rol || 'Sin rol';

  const headerColors = highContrast
    ? [c.card, c.bgAlt]
    : [CAJERO_AZUL_REY, '#2563D4', CAJERO_AZUL_REY_CLARO];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <AlertBannerStack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={headerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.welcome, { paddingTop: Math.max(insets.top, 12) + 4 }]}
        >
          <View style={styles.brandBlock}>
            <Image source={APP_BRANDING.logo} style={styles.logo} resizeMode="contain" />
            <ScaledText baseSize={11} style={styles.brandApp} numberOfLines={1}>
              {APP_BRANDING.tituloApp}
            </ScaledText>
            <ScaledText baseSize={15} style={styles.brandEmpresa} numberOfLines={2}>
              {APP_BRANDING.nombreEmpresa}
            </ScaledText>
          </View>

          <View style={styles.userCapsule}>
            <View style={styles.avatar}>
              <ScaledText baseSize={15} style={styles.avatarText}>
                {initials || '?'}
              </ScaledText>
            </View>
            <View style={styles.userMeta}>
              <ScaledText baseSize={11} style={styles.userGreeting} numberOfLines={1}>
                Bienvenido
              </ScaledText>
              <ScaledText baseSize={16} style={styles.userName} numberOfLines={1}>
                {displayName}
              </ScaledText>
              <View style={styles.roleRow}>
                <Ionicons name="shield-checkmark" size={12} color="rgba(255,255,255,0.9)" />
                <ScaledText baseSize={12} style={styles.roleText} numberOfLines={1}>
                  {rolLabel}
                </ScaledText>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScaledText
          baseSize={16}
          style={{
            color: c.text,
            fontWeight: '800',
            marginBottom: 12,
            marginTop: 4,
            paddingHorizontal: 16,
          }}
        >
          Módulos
        </ScaledText>

        <View style={styles.grid}>
          {visible.map((t) => (
            <ModuleTile
              key={t.key}
              module={t}
              onPress={() =>
                nav.navigate(
                  t.key as
                    | 'Caja'
                    | 'Alumnos'
                    | 'Certificados'
                    | 'Facturacion'
                    | 'Programas'
                    | 'Servicios'
                    | 'Ajustes',
                )
              }
            />
          ))}
        </View>

        <Pressable
          onPress={() => void signOut()}
          style={({ pressed }) => [
            styles.logout,
            {
              borderColor: c.danger,
              backgroundColor: pressed ? c.dangerBg : c.card,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={20} color={c.danger} />
          <ScaledText baseSize={16} style={{ color: c.danger, fontWeight: '700' }}>
            Cerrar sesión
          </ScaledText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 36 },
  welcome: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 22,
    marginBottom: 20,
    alignItems: 'center',
  },
  brandBlock: {
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 96,
    height: 78,
    backgroundColor: 'transparent',
  },
  brandApp: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '700',
    letterSpacing: 1.4,
    textAlign: 'center',
    marginTop: 8,
  },
  brandEmpresa: {
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 12,
  },
  userCapsule: {
    marginTop: 18,
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
  },
  userMeta: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  userGreeting: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  userName: {
    color: '#fff',
    fontWeight: '800',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  roleText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    flexShrink: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  logout: {
    marginTop: 28,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
});
