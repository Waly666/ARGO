import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CursoCard } from '../components/CursoCard';
import { GradientHeader } from '../components/GradientHeader';
import { WelcomeBrandHeader } from '../components/WelcomeBrandHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { QuickAction } from '../components/QuickAction';
import { ScaledText } from '../components/ScaledText';
import { ScreenBody } from '../components/ScreenBody';
import { SectionHeader } from '../components/SectionHeader';
import { usePortalConfig } from '../context/PortalConfigContext';
import { useTheme } from '../context/ThemeContext';
import { fetchCursos } from '../api/aulaApi';
import type { CursoVirtual } from '../api/types';
import { resolveUploadUrl } from '../utils/uploadUrl';
import type { RootStackParamList } from '../navigation/types';
import { radius, space } from '../theme/spacing';
import { shadow } from '../theme/shadows';

export default function WelcomeScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { config, refresh: refreshConfig } = usePortalConfig();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [destacados, setDestacados] = useState<CursoVirtual[]>([]);

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

  const heroImg = resolveUploadUrl(config?.site?.tema?.urlHeroAbsoluta) || resolveUploadUrl(config?.site?.tema?.urlHero);
  const heroLead = config?.heroTitulo?.trim() || '';
  const heroSub = config?.heroSubtitulo?.trim() || '';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <GradientHeader height={188}>
        <WelcomeBrandHeader />
      </GradientHeader>

      <ScreenBody onRefresh={load}>
        {heroLead || heroSub ? (
          <View
            style={[
              styles.heroTextCard,
              shadow.sm,
              {
                backgroundColor: c.card,
                borderColor: c.borderLight,
                borderWidth: 1,
                marginTop: space.md,
              },
            ]}
          >
            {heroLead ? (
              <ScaledText baseSize={16} style={[styles.heroLead, { color: c.text }]}>
                {heroLead}
              </ScaledText>
            ) : null}
            {heroSub && heroSub !== heroLead ? (
              <ScaledText
                baseSize={14}
                style={[styles.heroSub, { color: c.textSoft }, heroLead ? { marginTop: space.sm } : null]}
              >
                {heroSub}
              </ScaledText>
            ) : null}
          </View>
        ) : null}
        {heroImg ? (
          <View style={[styles.heroImgWrap, shadow.lg]}>
            <Image source={{ uri: heroImg }} style={styles.heroImg} resizeMode="cover" />
          </View>
        ) : null}

        <View style={[styles.ctaCard, shadow.md, { backgroundColor: c.card, marginTop: heroImg ? space.lg : 0 }]}>
          <PrimaryButton label="Iniciar sesión" onPress={() => nav.navigate('Login')} icon="log-in-outline" fullWidth size="lg" />
          <PrimaryButton
            label="Explorar catálogo"
            variant="secondary"
            onPress={() => nav.navigate('Catalogo')}
            icon="compass-outline"
            fullWidth
          />
        </View>

        <View style={styles.actions}>
          <QuickAction
            label="Certificados"
            subtitle="Consulta por documento"
            icon="ribbon-outline"
            tint={c.accent}
            onPress={() => nav.navigate('ConsultaCertificados')}
          />
          {config?.registroAbierto !== false ? (
            <QuickAction
              label="Registrarse"
              subtitle="Crea tu cuenta"
              icon="person-add-outline"
              tint={c.ok}
              onPress={() => nav.navigate('Registro')}
            />
          ) : (
            <QuickAction
              label="Catálogo"
              subtitle="Ver todos los cursos"
              icon="library-outline"
              onPress={() => nav.navigate('Catalogo')}
            />
          )}
        </View>

        {destacados.length > 0 ? (
          <>
            <SectionHeader title="Cursos destacados" subtitle="Empieza hoy" icon="star-outline" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {destacados.map((curso) => (
                <View key={String(curso.idPrograma)} style={styles.hItem}>
                  <CursoCard
                    curso={curso}
                    layout="vertical"
                    onPress={() =>
                      nav.navigate('CursoDetalle', { id: String(curso.idPrograma), titulo: curso.nombreProg })
                    }
                  />
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}

        <View style={{ height: insets.bottom + space.lg }} />
      </ScreenBody>
    </View>
  );
}

const styles = StyleSheet.create({
  heroTextCard: {
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.lg,
  },
  heroLead: {
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  heroSub: {
    textAlign: 'center',
    lineHeight: 24,
  },
  heroImgWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: space.sm,
  },
  heroImg: { width: '100%', height: 160 },
  ctaCard: {
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
    marginBottom: space.lg,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    justifyContent: 'space-between',
    marginBottom: space.xl,
  },
  hScroll: { marginHorizontal: -space.lg, paddingHorizontal: space.lg, marginBottom: space.lg },
  hItem: { width: 280, marginRight: space.md },
});
