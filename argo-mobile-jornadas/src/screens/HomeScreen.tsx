import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableCard } from '../components/PressableCard';
import { ScaledText } from '../components/ScaledText';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import type { AuthUser } from '../api/types';
import { ARGO_AZUL_REY, ARGO_NAVY, ARGO_NAVY_SOFT } from '../config/appBranding';
import { themeColors } from '../theme/colors';
import { modulosHomeVisibles, type JornadasHomeModule } from '../theme/modules';
import { radii, spacing } from '../theme/tokens';
import { useAccessibility } from '../context/AccessibilityContext';
import { puedeGestionarJornadas } from '../utils/permisos';
import type { RootStackParamList } from '../navigation/types';

function nombreBienvenida(user: AuthUser | null): string {
  if (!user) return 'Instructor';
  const completo = [user.nombres, user.apellidos].filter(Boolean).join(' ').trim();
  if (completo) return completo;
  const desdeEmpleado = String(user.empleado?.nombreCompleto || '').trim();
  if (desdeEmpleado) return desdeEmpleado;
  return user.username || 'Instructor';
}

const TILE_STYLES: Record<
  string,
  { accent: 'primary' | 'primaryDark' | 'mint' | 'mintFg' }
> = {
  hoy: { accent: 'primary' },
  registrar: { accent: 'mintFg' },
  certificados: { accent: 'primaryDark' },
  password: { accent: 'primary' },
  gestionar: { accent: 'primary' },
  crear: { accent: 'mintFg' },
  informes: { accent: 'primaryDark' },
};

export default function HomeScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { state } = useAuth();
  const { tituloApp, nombreEmpresa, logoSource } = useBranding();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const user = state.status === 'signedIn' ? state.user : null;
  const nombre = nombreBienvenida(user);
  const esAdmin = puedeGestionarJornadas(user?.permisos, user?.rol, user?.rolNombre);

  const modulos = useMemo(
    () => modulosHomeVisibles(user?.permisos),
    [user?.permisos],
  );

  const headerColors: [string, string, string] = highContrast
    ? [c.card, c.bgAlt, c.bg]
    : [ARGO_NAVY, ARGO_NAVY_SOFT, '#1A2240'];

  function tileColors(key: string) {
    const style = TILE_STYLES[key] || TILE_STYLES.hoy;
    switch (style.accent) {
      case 'mintFg':
        return { accent: c.pastelMintFg, iconBg: c.pastelMint, iconColor: c.pastelMintFg };
      case 'primaryDark':
        return { accent: c.primaryDark, iconBg: c.accentSoft, iconColor: c.primaryDark };
      default:
        return { accent: c.primary, iconBg: c.accentSoft, iconColor: c.primaryDark };
    }
  }

  function abrirModulo(mod: JornadasHomeModule) {
    switch (mod.route) {
      case 'CrearAlumnoJornada':
        nav.navigate('CrearAlumnoJornada', {});
        break;
      case 'Certificados':
        nav.navigate('Certificados', {});
        break;
      case 'CrearJornada':
        nav.navigate('CrearJornada', {});
        break;
      default:
        nav.navigate(mod.route);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
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
                <Ionicons name="person" size={22} color={c.primary} />
              </View>
              <View style={styles.userMeta}>
                <ScaledText baseSize={18} style={styles.userName} numberOfLines={1}>
                  {nombre}
                </ScaledText>
                <View style={styles.rolePill}>
                  <Ionicons name="shield-checkmark" size={12} color={ARGO_AZUL_REY} />
                  <ScaledText baseSize={12} style={styles.roleText} numberOfLines={1}>
                    {user?.rolNombre || user?.rol || 'Instructor jornadas'}
                  </ScaledText>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHead}>
          <View>
            <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '800', letterSpacing: -0.3 }}>
              Operación en campo
            </ScaledText>
            <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 2 }}>
              Accesos según permisos del rol en el ERP
            </ScaledText>
          </View>
          <View style={[styles.countBadge, { backgroundColor: c.chipBg }]}>
            <ScaledText baseSize={12} style={{ color: c.primary, fontWeight: '700' }}>
              {modulos.length}
            </ScaledText>
          </View>
        </View>

        {modulos.map((mod) => {
          const colors = tileColors(mod.key);
          const hint =
            mod.key === 'hoy' && esAdmin
              ? 'Operación del día (admin también gestiona otras fechas)'
              : mod.hint;
          return (
            <PressableCard
              key={mod.key}
              onPress={() => abrirModulo(mod)}
              cardStyle={styles.tileCard}
            >
              <View style={[styles.cardAccent, { backgroundColor: colors.accent }]} />
              <View style={styles.tileBody}>
                <View style={[styles.iconBox, { backgroundColor: colors.iconBg }]}>
                  <Ionicons name={mod.icon} size={26} color={colors.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '800' }}>
                    {mod.title}
                  </ScaledText>
                  <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 4, lineHeight: 18 }}>
                    {hint}
                  </ScaledText>
                </View>
                <View style={[styles.openBtn, { backgroundColor: colors.iconBg }]}>
                  <Ionicons name="chevron-forward" size={18} color={colors.iconColor} />
                </View>
              </View>
            </PressableCard>
          );
        })}

        {!modulos.length ? (
          <ScaledText baseSize={14} style={{ color: c.textSoft, textAlign: 'center', paddingHorizontal: spacing.screen }}>
            Su rol no tiene pantallas de la app móvil asignadas. Configure permisos «App móvil Jornadas» en
            Configuración → Roles.
          </ScaledText>
        ) : null}

        <ScaledText baseSize={12} style={{ color: c.textSoft, textAlign: 'center', marginTop: 8 }}>
          Use el menú ☰ arriba para navegar o cerrar sesión.
        </ScaledText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 32 },
  walletHeader: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 28,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(61,92,255,0.25)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logo: { width: 52, height: 52 },
  brandText: { flex: 1 },
  brandKicker: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 0.8 },
  brandEmpresa: { color: '#fff', fontWeight: '700', marginTop: 2 },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  welcomeLabel: { color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMeta: { flex: 1 },
  userName: { color: '#fff', fontWeight: '800' },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  roleText: { color: ARGO_AZUL_REY, fontWeight: '700', maxWidth: 200 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    marginTop: 20,
    marginBottom: 12,
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  tileCard: {
    padding: 0,
    overflow: 'hidden',
    flexDirection: 'row',
    marginHorizontal: spacing.screen,
    marginBottom: 12,
  },
  cardAccent: { width: 5 },
  tileBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
