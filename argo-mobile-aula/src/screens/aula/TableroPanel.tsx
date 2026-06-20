import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { ContinueCourseCard } from '../../components/ContinueCourseCard';
import { PortalLogo } from '../../components/PortalLogo';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScaledText } from '../../components/ScaledText';
import { ScreenBody } from '../../components/ScreenBody';
import { SectionHeader } from '../../components/SectionHeader';
import { StatTile } from '../../components/StatTile';
import { SurfaceCard } from '../../components/SurfaceCard';
import { useAuth } from '../../context/AuthContext';
import { usePortalBranding } from '../../hooks/usePortalBranding';
import { usePortalConfig } from '../../context/PortalConfigContext';
import { useTheme } from '../../context/ThemeContext';
import { useMisCursos } from '../../hooks/useMisCursos';
import { fetchMisCertificados } from '../../api/aulaApi';
import type { CursoVirtual } from '../../api/types';
import {
  cursoCompletado,
  cursoEnProgreso,
  cursoParaContinuar,
  pctCurso,
  puedeCursar,
} from '../../utils/cursoUtils';
import { resolvePlayerUrl } from '../../utils/uploadUrl';
import type { RootStackParamList } from '../../navigation/types';
import { radius, space } from '../../theme/spacing';
import { type } from '../../theme/typography';
import { shadow } from '../../theme/shadows';

export default function TableroPanel() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const c = useTheme();
  const { nombreEmpresa } = usePortalBranding();
  const { refresh: refreshPortal } = usePortalConfig();
  const { cursos, loading, error, reload } = useMisCursos();
  const [certs, setCerts] = useState(0);
  const [certsLoading, setCertsLoading] = useState(true);

  const loadCerts = useCallback(async () => {
    if (state.status !== 'signedIn') {
      setCerts(0);
      setCertsLoading(false);
      return;
    }
    setCertsLoading(true);
    try {
      const certRows = await fetchMisCertificados();
      setCerts(certRows.length);
    } catch {
      setCerts(0);
    } finally {
      setCertsLoading(false);
    }
  }, [state.status]);

  useFocusEffect(
    useCallback(() => {
      void loadCerts();
      void refreshPortal();
    }, [loadCerts, refreshPortal]),
  );

  const enCurso = cursos.filter(cursoEnProgreso);
  const completados = cursos.filter(cursoCompletado);
  const continuar = [...cursos]
    .filter(cursoParaContinuar)
    .sort((a, b) => pctCurso(b) - pctCurso(a))
    .slice(0, 4);

  const nombre = state.status === 'signedIn' ? state.user.nombreCompleto : '';
  const primerNombre = nombre.split(' ')[0] || 'alumno';

  function abrir(curso: CursoVirtual) {
    if (!puedeCursar(curso)) return;
    const url = resolvePlayerUrl(curso.playerUrl);
    if (!url) return;
    nav.navigate('CoursePlayer', {
      idPrograma: String(curso.idPrograma),
      titulo: curso.nombreProg,
      playerUrl: url,
      storagePrefix: curso.storagePrefix ?? undefined,
    });
  }

  async function onRefresh() {
    await Promise.all([reload(), loadCerts()]);
  }

  return (
    <ScreenBody onRefresh={onRefresh} refreshing={loading || certsLoading}>
      <SurfaceCard style={{ ...styles.welcome, ...shadow.sm }} tint={c.accentSoft} accentLeft={c.primary}>
        <View style={styles.brandBlock}>
          <PortalLogo width={112} height={56} hideLetterFallback />
          <ScaledText baseSize={17} style={[styles.brandName, { color: c.text }]} numberOfLines={2}>
            {nombreEmpresa}
          </ScaledText>
          <ScaledText baseSize={12} style={[styles.welcomeKicker, { color: c.textSoft }]}>
            Mi aula virtual
          </ScaledText>
        </View>
        <ScaledText baseSize={type.h1.fontSize} style={[styles.welcomeName, { color: c.primary }]}>
          Hola, {primerNombre}
        </ScaledText>
        <ScaledText baseSize={14} style={[styles.welcomeSub, { color: c.textSoft }]}>
          Sigue aprendiendo con {nombreEmpresa}
        </ScaledText>
      </SurfaceCard>

      {loading && cursos.length === 0 ? (
        <ActivityIndicator color={c.primary} style={{ marginVertical: space.xl }} />
      ) : null}

      {error ? (
        <SurfaceCard style={{ marginBottom: space.md }}>
          <ScaledText baseSize={14} style={{ color: c.danger, marginBottom: space.sm }}>
            {error}
          </ScaledText>
          <PrimaryButton label="Reintentar" onPress={() => void onRefresh()} variant="secondary" />
        </SurfaceCard>
      ) : null}

      <View style={styles.stats}>
        <StatTile label="Cursos" value={cursos.length} icon="book-outline" color={c.primary} softColor={c.accentSoft} />
        <StatTile label="En progreso" value={enCurso.length} icon="play-circle-outline" color={c.accent} softColor={c.foroSoft} />
        <StatTile label="Completados" value={completados.length} icon="checkmark-circle-outline" color={c.ok} softColor={c.okSoft} />
        <StatTile label="Certificados" value={certs} icon="ribbon-outline" color={c.gold} softColor={c.goldSoft} />
      </View>

      {continuar.length > 0 ? (
        <SurfaceCard style={{ marginTop: space.lg }} tint={c.accentSoft} accentLeft={c.accent}>
          <SectionHeader
            title="Continuar aprendiendo"
            subtitle="Retoma donde lo dejaste"
            icon="flash-outline"
            iconColor={c.accent}
            iconBg={c.foroSoft}
          />
          {continuar.map((curso) => (
            <ContinueCourseCard key={String(curso.idPrograma)} curso={curso} onPress={() => abrir(curso)} />
          ))}
        </SurfaceCard>
      ) : !loading && cursos.length === 0 ? (
        <SurfaceCard style={{ marginTop: space.lg }}>
          <EmptyState
            title="Aún no tienes cursos"
            subtitle="Explora el catálogo y matricúlate en tu primer programa"
            icon="school-outline"
          />
          <PrimaryButton
            label="Ver catálogo"
            onPress={() => nav.navigate('Catalogo')}
            icon="compass-outline"
            fullWidth
          />
        </SurfaceCard>
      ) : !loading && cursos.length > 0 ? (
        <SurfaceCard style={{ marginTop: space.lg }}>
          <ScaledText baseSize={15} style={{ color: c.textSoft, textAlign: 'center' }}>
            Tienes {cursos.length} curso(s) matriculado(s). Abre la pestaña Cursos para verlos todos.
          </ScaledText>
        </SurfaceCard>
      ) : null}
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  welcome: {
    borderRadius: radius.lg,
    padding: space.xl,
    marginBottom: space.lg,
  },
  brandBlock: { alignItems: 'center', marginBottom: space.md },
  brandName: {
    fontWeight: '800',
    textAlign: 'center',
    marginTop: space.sm,
    lineHeight: 22,
  },
  welcomeName: { fontWeight: '800', marginTop: space.xs },
  welcomeSub: { marginTop: 4 },
  welcomeKicker: { marginTop: 4, textAlign: 'center' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, justifyContent: 'space-between' },
});
