import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { CursoCard } from '../../components/CursoCard';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenBody } from '../../components/ScreenBody';
import { ScaledText } from '../../components/ScaledText';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { SurfaceCard } from '../../components/SurfaceCard';
import { useTheme } from '../../context/ThemeContext';
import { usePasarelaActiva } from '../../hooks/usePasarelaActiva';
import { useMisCursos } from '../../hooks/useMisCursos';
import { fetchInscripcion, iniciarPagoEnLinea } from '../../api/aulaApi';
import type { CursoVirtual, EstadoInscripcionVirtual } from '../../api/types';
import { cursoCompletado, cursoEnProgreso, puedeCursar } from '../../utils/cursoUtils';
import { puedeMostrarPagoWompi } from '../../utils/pagoVirtual';
import { resolvePlayerUrl } from '../../utils/uploadUrl';
import type { RootStackParamList } from '../../navigation/types';
import { space } from '../../theme/spacing';

type TabKey = 'ongoing' | 'completed';

function CursoMatriculadoRow({
  curso,
  pasarelaActiva,
  onRefresh,
}: {
  curso: CursoVirtual;
  pasarelaActiva: boolean;
  onRefresh: () => void;
}) {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const c = useTheme();
  const [ins, setIns] = React.useState<EstadoInscripcionVirtual | null>(null);
  const [pagando, setPagando] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void fetchInscripcion(curso.idPrograma)
      .then((row) => {
        if (!cancelled) setIns(row);
      })
      .catch(() => {
        if (!cancelled) setIns(null);
      });
    return () => {
      cancelled = true;
    };
  }, [curso.idPrograma]);

  const puedeEntrar = puedeCursar(curso) && ins?.puedeCursar !== false;
  const mostrarPago = ins ? puedeMostrarPagoWompi(ins, curso, pasarelaActiva) : false;

  const irDetalle = () => {
    nav.navigate('CursoDetalle', { id: String(curso.idPrograma), titulo: curso.nombreProg });
  };

  async function onPagar() {
    if (!pasarelaActiva) {
      Alert.alert('Pago en línea', 'Los pagos en línea no están activos. Vea el detalle del curso para más opciones.');
      irDetalle();
      return;
    }
    setPagando(true);
    try {
      const res = await iniciarPagoEnLinea(curso.idPrograma);
      if (!res.checkoutUrl?.trim()) throw new Error('No se pudo iniciar el pago.');
      nav.navigate('PagoCheckout', {
        url: res.checkoutUrl.trim(),
        titulo: curso.nombreProg,
        idPrograma: String(curso.idPrograma),
      });
    } catch (e) {
      Alert.alert('Pago', e instanceof Error ? e.message : 'No se pudo iniciar el pago.');
    } finally {
      setPagando(false);
    }
  }

  function onEntrar() {
    const url = resolvePlayerUrl(curso.playerUrl);
    if (!url) {
      irDetalle();
      return;
    }
    nav.navigate('CoursePlayer', {
      idPrograma: String(curso.idPrograma),
      titulo: curso.nombreProg,
      playerUrl: url,
      storagePrefix: curso.storagePrefix ?? undefined,
    });
  }

  return (
    <View style={styles.row}>
      <CursoCard curso={curso} layout="enrolled" onPress={irDetalle} />
      <View style={styles.actions}>
        {mostrarPago ? (
          <PrimaryButton
            label={pagando ? 'Abriendo…' : 'Pagar'}
            onPress={() => void onPagar()}
            loading={pagando}
            icon="card-outline"
            size="md"
          />
        ) : null}
        {puedeEntrar ? (
          <PrimaryButton
            label="Continuar"
            onPress={onEntrar}
            icon="play"
            size="md"
            variant={mostrarPago ? 'secondary' : 'primary'}
          />
        ) : (
          <PrimaryButton label="Ver curso" onPress={irDetalle} icon="open-outline" size="md" variant="secondary" />
        )}
      </View>
      {mostrarPago ? (
        <ScaledText baseSize={11} style={{ color: c.textSoft, marginTop: -space.xs, marginBottom: space.sm, paddingHorizontal: space.xs }}>
          Pago pendiente — puede pagar en línea o en el CEA
        </ScaledText>
      ) : null}
    </View>
  );
}

export default function MisCursosPanel() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const c = useTheme();
  const { pasarelaActiva } = usePasarelaActiva();
  const { cursos, loading, error, reload } = useMisCursos();
  const [tab, setTab] = useState<TabKey>('ongoing');

  const enCurso = useMemo(() => cursos.filter(cursoEnProgreso), [cursos]);
  const completados = useMemo(() => cursos.filter(cursoCompletado), [cursos]);
  const visibles = tab === 'ongoing' ? enCurso : completados;

  return (
    <ScreenBody onRefresh={reload} refreshing={loading}>
      <ScaledText baseSize={24} style={{ color: c.text, fontWeight: '600', marginBottom: space.xs }}>
        Mis cursos
      </ScaledText>
      <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: space.lg }}>
        {cursos.length} matriculado(s)
      </ScaledText>

      <SegmentedTabs
        tabs={[
          { key: 'ongoing', label: `En curso (${enCurso.length})` },
          { key: 'completed', label: `Completados (${completados.length})` },
        ]}
        active={tab}
        onChange={(k) => setTab(k as TabKey)}
        scrollable
      />

      {error ? (
        <SurfaceCard style={{ marginBottom: space.md }}>
          <ScaledText baseSize={14} style={{ color: c.danger, marginBottom: space.sm }}>
            {error}
          </ScaledText>
          <PrimaryButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
        </SurfaceCard>
      ) : null}

      {!loading && visibles.length === 0 ? (
        <>
          <EmptyState
            title={tab === 'ongoing' ? 'Sin cursos en progreso' : 'Sin cursos completados'}
            subtitle="Explore el catálogo y matricúlese en un programa"
            icon="book-outline"
          />
          <PrimaryButton label="Ver todos los cursos" onPress={() => nav.navigate('AulaCursos')} icon="library-outline" fullWidth />
        </>
      ) : (
        visibles.map((curso) => (
          <CursoMatriculadoRow
            key={String(curso.idPrograma)}
            curso={curso}
            pasarelaActiva={pasarelaActiva}
            onRefresh={() => void reload()}
          />
        ))
      )}
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: space.xs },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: -space.xs,
    marginBottom: space.md,
    paddingHorizontal: space.xs,
  },
});
