import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { ContinueCourseCard } from '../../components/ContinueCourseCard';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { PromoBanner } from '../../components/PromoBanner';
import { ScaledText } from '../../components/ScaledText';
import { ScreenBody } from '../../components/ScreenBody';
import { SearchField } from '../../components/SearchField';
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
import { space } from '../../theme/spacing';

export default function TableroPanel() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const c = useTheme();
  const { nombreEmpresa } = usePortalBranding();
  const { refresh: refreshPortal } = usePortalConfig();
  const { cursos, loading, error, reload } = useMisCursos();
  const [certs, setCerts] = useState(0);
  const [certsLoading, setCertsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

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

  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || 'A';

  async function onRefresh() {
    await Promise.all([reload(), loadCerts()]);
  }

  return (
    <ScreenBody onRefresh={onRefresh} refreshing={loading || certsLoading}>
      <View style={styles.topRow}>
        <View style={styles.userRow}>
          <View style={[styles.avatar, { backgroundColor: c.foroSoft }]}>
            <ScaledText baseSize={16} style={{ color: c.primary, fontWeight: '600' }}>
              {iniciales}
            </ScaledText>
          </View>
          <View style={{ flex: 1 }}>
            <ScaledText baseSize={12} style={{ color: c.textSoft }}>
              Buenos días
            </ScaledText>
            <ScaledText baseSize={20} style={{ color: c.text, fontWeight: '600' }} numberOfLines={1}>
              {primerNombre}
            </ScaledText>
          </View>
        </View>
        <Pressable style={[styles.bell, { backgroundColor: c.card, borderColor: c.borderLight }]}>
          <Ionicons name="notifications-outline" size={22} color={c.text} />
        </Pressable>
      </View>

      <SearchField
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar curso…"
        onFilterPress={() => nav.navigate('AulaCursos')}
      />
      <Pressable onPress={() => nav.navigate('AulaCursos')} style={{ marginTop: -space.sm, marginBottom: space.lg }}>
        <ScaledText baseSize={12} style={{ color: c.primary, fontWeight: '700' }}>
          Ir al catálogo →
        </ScaledText>
      </Pressable>

      <PromoBanner
        title="Sigue aprendiendo hoy"
        subtitle={`${nombreEmpresa} — formación certificada en línea`}
        ctaLabel="Explorar cursos"
        onPress={() => nav.navigate('AulaCursos')}
      />

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
        <StatTile label="Cursos" value={cursos.length} icon="book-outline" color={c.primary} softColor={c.foroSoft} />
          <StatTile label="En progreso" value={enCurso.length} icon="play-circle-outline" color={c.primary} softColor={c.accentSoft} />
          <StatTile label="Completados" value={completados.length} icon="checkmark-circle-outline" color={c.primaryDark} softColor={c.accentSoft} />
        <StatTile label="Certificados" value={certs} icon="ribbon-outline" color={c.gold} softColor={c.goldSoft} />
      </View>

      {continuar.length > 0 ? (
        <SurfaceCard style={{ marginTop: space.md }} tint={c.foroSoft} accentLeft={c.primary}>
          <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '600', marginBottom: space.md }}>
            Continuar aprendiendo
          </ScaledText>
          {continuar.map((curso) => (
            <ContinueCourseCard key={String(curso.idPrograma)} curso={curso} onPress={() => abrir(curso)} />
          ))}
        </SurfaceCard>
      ) : !loading && cursos.length === 0 ? (
        <SurfaceCard style={{ marginTop: space.md }}>
          <EmptyState
            title="Aún no tienes cursos"
            subtitle="Explora el catálogo y matricúlate en tu primer programa"
            icon="school-outline"
          />
          <PrimaryButton label="Explorar cursos" onPress={() => nav.navigate('AulaCursos')} icon="library-outline" fullWidth />
        </SurfaceCard>
      ) : null}
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, justifyContent: 'space-between' },
});
