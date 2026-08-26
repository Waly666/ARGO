import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GestorCreditoDiarioCard } from '../components/GestorCreditoDiarioCard';
import { ScaledText } from '../components/ScaledText';
import { AlertBannerStack } from '../components/AlertBannerStack';
import { ModuleTile } from '../components/ModuleTile';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { CAJERO_AZUL_REY, CAJERO_NAVY, CAJERO_NAVY_SOFT } from '../config/appBranding';
import { themeColors } from '../theme/colors';
import { radii, shadows, spacing } from '../theme/tokens';
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
  const { tituloApp, nombreEmpresa, logoSource } = useBranding();
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

  const headerColors: [string, string, string] = highContrast
    ? [c.card, c.bgAlt, c.bg]
    : [CAJERO_NAVY, CAJERO_NAVY_SOFT, '#1A2240'];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <AlertBannerStack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={headerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.walletHeader, { paddingTop: Math.max(insets.top, 12) + 8 }]}
        >
          <View style={styles.headerGlow} />
          <View style={styles.brandRow}>
            <Image source={logoSource} style={styles.logo} resizeMode="contain" />
            <View style={styles.brandText}>
              <ScaledText baseSize={11} style={styles.brandKicker} numberOfLines={1}>
                {tituloApp}
              </ScaledText>
              <ScaledText baseSize={14} style={styles.brandEmpresa} numberOfLines={2}>
                {nombreEmpresa}
              </ScaledText>
            </View>
          </View>

          <View style={styles.balanceCard}>
            <ScaledText baseSize={12} style={styles.welcomeLabel}>
              Bienvenido de nuevo
            </ScaledText>
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <ScaledText baseSize={16} style={styles.avatarText}>
                  {initials || '?'}
                </ScaledText>
              </View>
              <View style={styles.userMeta}>
                <ScaledText baseSize={18} style={styles.userName} numberOfLines={1}>
                  {displayName}
                </ScaledText>
                <View style={styles.rolePill}>
                  <Ionicons name="shield-checkmark" size={12} color={CAJERO_AZUL_REY} />
                  <ScaledText baseSize={12} style={styles.roleText} numberOfLines={1}>
                    {rolLabel}
                  </ScaledText>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.screen, marginTop: -18, marginBottom: 8 }}>
          <GestorCreditoDiarioCard rol={user?.rol} />
        </View>

        <View style={styles.sectionHead}>
          <View>
            <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '800', letterSpacing: -0.3 }}>
              Módulos
            </ScaledText>
            <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 2 }}>
              Accesos rápidos a operaciones del día
            </ScaledText>
          </View>
          <View style={[styles.countBadge, { backgroundColor: c.chipBg }]}>
            <ScaledText baseSize={12} style={{ color: c.primary, fontWeight: '700' }}>
              {visible.length}
            </ScaledText>
          </View>
        </View>

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
                    | 'AprobacionConsignacion'
                    | 'Autorizaciones'
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
              borderColor: highContrast ? c.danger : 'transparent',
              backgroundColor: pressed ? c.dangerBg : c.card,
              opacity: pressed ? 0.92 : 1,
            },
            !highContrast && shadows.card,
          ]}
        >
          <View style={[styles.logoutIcon, { backgroundColor: c.dangerBg }]}>
            <Ionicons name="log-out-outline" size={20} color={c.danger} />
          </View>
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
  walletHeader: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: spacing.screen,
    paddingBottom: 28,
    marginBottom: 8,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: CAJERO_AZUL_REY,
    opacity: 0.14,
    top: -60,
    right: -50,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 4,
  },
  brandText: { flex: 1, minWidth: 0 },
  brandKicker: {
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  brandEmpresa: {
    color: '#fff',
    fontWeight: '800',
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 16,
  },
  welcomeLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
    marginBottom: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.icon,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
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
    gap: 6,
  },
  userName: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  roleText: {
    color: CAJERO_NAVY,
    fontWeight: '700',
    flexShrink: 1,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    marginBottom: 14,
    marginTop: 8,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
  },
  logout: {
    marginTop: 28,
    marginHorizontal: spacing.screen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
