import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CursoCard } from '../components/CursoCard';
import { ModuleTile } from '../components/ModuleTile';
import { ScaledText } from '../components/ScaledText';
import { SectionHeader } from '../components/SectionHeader';
import { usePortalBranding } from '../hooks/usePortalBranding';
import { usePortalConfig } from '../context/PortalConfigContext';
import { useTheme } from '../context/ThemeContext';
import { fetchCursos } from '../api/aulaApi';
import type { CursoVirtual } from '../api/types';
import { APP_BRANDING, AULA_AZUL_REY, AULA_NAVY, AULA_NAVY_SOFT } from '../config/appBranding';
import type { RootStackParamList } from '../navigation/types';
import { AULA_PUBLIC_MODULES } from '../theme/modules';
import { layout, radii } from '../theme/tokens';
import { resolveUploadUrl } from '../utils/uploadUrl';

export default function WelcomeScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { config, refresh: refreshConfig } = usePortalConfig();
  const { tituloApp, nombreEmpresa, logoSource } = usePortalBranding();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [destacados, setDestacados] = useState<CursoVirtual[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const publicModules = useMemo(() => {
    if (config?.registroAbierto === false) {
      return AULA_PUBLIC_MODULES.filter((m) => m.key !== 'Registro');
    }
    return AULA_PUBLIC_MODULES;
  }, [config?.registroAbierto]);

  const load = useCallback(async () => {
    await Promise.all([
      refreshConfig(),
      (async () => {
        try {
          const rows = await fetchCursos();
          setDestacados(rows.slice(0, 6));
        } catch {
          setDestacados([]);
        }
      })(),
    ]);
  }, [refreshConfig]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void refreshConfig();
    }, [refreshConfig]),
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const heroImg = resolveUploadUrl(config?.site?.tema?.urlHeroAbsoluta) || resolveUploadUrl(config?.site?.tema?.urlHero);
  const heroTitle = config?.heroTitulo?.trim() || 'Formación virtual certificada';

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={c.primary} colors={[c.primary]} />
        }
      >
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
          <ScaledText baseSize={20} style={styles.heroTitle}>
            {heroTitle}
          </ScaledText>
          <ScaledText baseSize={14} style={styles.heroLead}>
            {config?.heroSubtitulo?.trim() || 'Estudia a tu ritmo desde el celular.'}
          </ScaledText>
        </LinearGradient>

        <View style={styles.sectionHead}>
          <View>
            <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '800', letterSpacing: -0.3 }}>
              Accesos rápidos
            </ScaledText>
            <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 2 }}>
              Explora el portal sin iniciar sesión
            </ScaledText>
          </View>
        </View>

        <View style={styles.grid}>
          {publicModules.map((mod) => (
            <ModuleTile key={mod.key} module={mod} onPress={() => nav.navigate(mod.key)} />
          ))}
        </View>

        {heroImg ? (
          <View style={[styles.heroImgWrap, { borderColor: c.border }]}>
            <Image source={{ uri: heroImg }} style={styles.heroImg} resizeMode="cover" />
          </View>
        ) : null}

        {destacados.length > 0 ? (
          <>
            <SectionHeader
              title="Cursos populares"
              subtitle="Los más consultados"
              icon="flame-outline"
              iconColor={c.primary}
              iconBg={c.accentSoft}
              action={
                <Pressable onPress={() => nav.navigate('Catalogo')}>
                  <ScaledText baseSize={13} style={{ color: c.primary, fontWeight: '700' }}>
                    Ver todos
                  </ScaledText>
                </Pressable>
              }
            />
            <View style={styles.list}>
              {destacados.map((curso) => (
                <CursoCard
                  key={String(curso.idPrograma)}
                  curso={curso}
                  layout="catalog"
                  onPress={() =>
                    nav.navigate('CursoDetalle', { id: String(curso.idPrograma), titulo: curso.nombreProg })
                  }
                />
              ))}
            </View>
          </>
        ) : null}

        <Pressable onPress={() => nav.navigate('Login')} style={[styles.loginCta, { backgroundColor: c.card, borderColor: c.border }]}>
          <Ionicons name="log-in-outline" size={20} color={c.primary} />
          <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '700', flex: 1, marginLeft: 10 }}>
            ¿Ya tienes cuenta? Ingresar
          </ScaledText>
          <Ionicons name="chevron-forward" size={18} color={c.textSoft} />
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
    alignItems: 'center',
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, alignSelf: 'stretch' },
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
  heroTitle: { color: '#fff', fontWeight: '800', fontSize: 20, textAlign: 'center', marginTop: 12 },
  heroLead: { color: 'rgba(255,255,255,0.88)', textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 12 },
  sectionHead: {
    paddingHorizontal: layout.screen,
    marginBottom: 14,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
    paddingHorizontal: layout.screen,
    marginBottom: 8,
  },
  heroImgWrap: {
    marginHorizontal: layout.screen,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 16,
  },
  heroImg: { width: '100%', height: 160 },
  list: { paddingHorizontal: layout.screen, marginTop: -8 },
  loginCta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout.screen,
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
});
