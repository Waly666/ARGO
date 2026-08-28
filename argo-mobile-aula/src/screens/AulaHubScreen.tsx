import React, { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContinueCourseCard } from '../components/ContinueCourseCard';
import { ModuleTile } from '../components/ModuleTile';
import { ScaledText } from '../components/ScaledText';
import { StatTile } from '../components/StatTile';
import { SurfaceCard } from '../components/SurfaceCard';
import { useAuth } from '../context/AuthContext';
import { usePortalBranding } from '../hooks/usePortalBranding';
import { useTheme } from '../context/ThemeContext';
import { useMisCursos } from '../hooks/useMisCursos';
import { fetchMisCertificados } from '../api/aulaApi';
import type { CursoVirtual } from '../api/types';
import { APP_BRANDING, AULA_AZUL_REY, AULA_NAVY, AULA_NAVY_SOFT } from '../config/appBranding';
import type { RootStackParamList } from '../navigation/types';
import { AULA_HUB_MODULES, type AulaHubRoute } from '../theme/modules';
import { layout, radii, shadows } from '../theme/tokens';
import {
  cursoCompletado,
  cursoEnProgreso,
  cursoParaContinuar,
  pctCurso,
  puedeCursar,
} from '../utils/cursoUtils';
import { resolvePlayerUrl } from '../utils/uploadUrl';

const PANEL_ROUTE: Partial<Record<string, AulaHubRoute>> = {
  cursos: 'AulaCursos',
  presenciales: 'AulaPresenciales',
  puntajes: 'AulaPuntajes',
  certificados: 'AulaCertificados',
  foro: 'AulaForo',
  perfil: 'AulaPerfil',
};

function nombreCompleto(user: { nombreCompleto?: string; email?: string } | null): string {
  if (!user) return 'alumno';
  return user.nombreCompleto?.trim() || user.email || 'alumno';
}

export default function AulaHubScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AulaHub'>>();
  const insets = useSafeAreaInsets();
  const { state, signOut } = useAuth();
  const c = useTheme();
  const { tituloApp, nombreEmpresa, logoSource } = usePortalBranding();
  const { cursos, loading, reload } = useMisCursos();
  const [certs, setCerts] = React.useState(0);

  const user = state.status === 'signedIn' ? state.user : null;
  const displayName = useMemo(() => nombreCompleto(user), [user]);
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'A';

  const enCurso = cursos.filter(cursoEnProgreso);
  const completados = cursos.filter(cursoCompletado);
  const continuar = [...cursos]
    .filter(cursoParaContinuar)
    .sort((a, b) => pctCurso(b) - pctCurso(a))
    .slice(0, 2);

  const loadCerts = useCallback(async () => {
    if (state.status !== 'signedIn') {
      setCerts(0);
      return;
    }
    try {
      const rows = await fetchMisCertificados();
      setCerts(rows.length);
    } catch {
      setCerts(0);
    }
  }, [state.status]);

  useFocusEffect(
    useCallback(() => {
      void loadCerts();
      void reload();
    }, [loadCerts, reload]),
  );

  useEffect(() => {
    const panel = route.params?.panel;
    if (!panel || panel === 'tablero') return;
    const target = PANEL_ROUTE[panel];
    if (target) {
      nav.navigate(target);
      nav.setParams({ panel: undefined });
    }
  }, [nav, route.params?.panel]);

  function abrir(curso: CursoVirtual) {
    if (!puedeCursar(curso)) {
      nav.navigate('CursoDetalle', { id: String(curso.idPrograma) });
      return;
    }
    const url = resolvePlayerUrl(curso.playerUrl);
    if (!url) return;
    nav.navigate('CoursePlayer', {
      idPrograma: String(curso.idPrograma),
      titulo: curso.nombreProg,
      playerUrl: url,
      storagePrefix: curso.storagePrefix ?? undefined,
    });
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[AULA_NAVY, AULA_NAVY_SOFT, '#1A2240']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.walletHeader, { paddingTop: Math.max(insets.top, 12) + 8 }]}
        >
          <View style={styles.headerGlow} />
          <View style={styles.brandRow}>
            <Image source={logoSource ?? APP_BRANDING.logo} style={styles.logo} resizeMode="contain" />
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
                  {initials}
                </ScaledText>
              </View>
              <View style={styles.userMeta}>
                <ScaledText baseSize={18} style={styles.userName} numberOfLines={2}>
                  {displayName}
                </ScaledText>
                <View style={styles.rolePill}>
                  <Ionicons name="school" size={12} color={AULA_AZUL_REY} />
                  <ScaledText baseSize={12} style={styles.roleText} numberOfLines={1}>
                    Estudiante virtual
                  </ScaledText>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {continuar.length > 0 ? (
          <View style={styles.continueWrap}>
            <SurfaceCard tint={c.accentSoft} accentLeft={c.primary}>
              <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '700', marginBottom: 12 }}>
                Continuar aprendiendo
              </ScaledText>
              {continuar.map((curso) => (
                <ContinueCourseCard key={String(curso.idPrograma)} curso={curso} onPress={() => abrir(curso)} />
              ))}
            </SurfaceCard>
          </View>
        ) : loading ? (
          <ActivityIndicator color={c.primary} style={{ marginTop: 20 }} />
        ) : null}

        <View style={styles.stats}>
          <StatTile label="Cursos" value={cursos.length} icon="book-outline" color={c.primary} softColor={c.accentSoft} />
          <StatTile label="En progreso" value={enCurso.length} icon="play-circle-outline" color={c.primary} softColor={c.accentSoft} />
          <StatTile label="Completados" value={completados.length} icon="checkmark-circle-outline" color={c.primaryDark} softColor={c.accentSoft} />
          <StatTile label="Certificados" value={certs} icon="ribbon-outline" color={c.gold} softColor={c.goldSoft} />
        </View>

        <View style={styles.sectionHead}>
          <View>
            <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '800', letterSpacing: -0.3 }}>
              Módulos
            </ScaledText>
            <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 2 }}>
              Accesos rápidos a tu aula virtual
            </ScaledText>
          </View>
          <View style={[styles.countBadge, { backgroundColor: c.accentSoft }]}>
            <ScaledText baseSize={12} style={{ color: c.primary, fontWeight: '700' }}>
              {AULA_HUB_MODULES.length}
            </ScaledText>
          </View>
        </View>

        <View style={styles.grid}>
          {AULA_HUB_MODULES.map((mod) => (
            <ModuleTile key={mod.key} module={mod} onPress={() => nav.navigate(mod.key)} />
          ))}
        </View>

        <Pressable
          onPress={() => void signOut()}
          style={({ pressed }) => [
            styles.logout,
            {
              backgroundColor: pressed ? c.dangerSoft : c.card,
              opacity: pressed ? 0.92 : 1,
            },
            shadows.card,
          ]}
        >
          <View style={[styles.logoutIcon, { backgroundColor: c.dangerSoft }]}>
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
    paddingHorizontal: layout.screen,
    paddingBottom: 28,
    marginBottom: 8,
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
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
  brandEmpresa: { color: '#fff', fontWeight: '800', marginTop: 2 },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 16,
  },
  welcomeLabel: { color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginBottom: 10 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  avatarText: { color: '#fff', fontWeight: '800' },
  userMeta: { flex: 1, minWidth: 0, gap: 6 },
  userName: { color: '#fff', fontWeight: '800', letterSpacing: -0.2 },
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
  roleText: { color: AULA_NAVY, fontWeight: '700', flexShrink: 1 },
  continueWrap: { paddingHorizontal: layout.screen, marginTop: -18, marginBottom: 8 },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: layout.screen,
    marginBottom: 8,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screen,
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
    paddingHorizontal: layout.screen,
  },
  logout: {
    marginTop: 28,
    marginHorizontal: layout.screen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
  },
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
