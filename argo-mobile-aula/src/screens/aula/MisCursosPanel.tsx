import React from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { CursoCard } from '../../components/CursoCard';
import { EmptyState } from '../../components/EmptyState';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenBody } from '../../components/ScreenBody';
import { SectionHeader } from '../../components/SectionHeader';
import { ScaledText } from '../../components/ScaledText';
import { SurfaceCard } from '../../components/SurfaceCard';
import { useTheme } from '../../context/ThemeContext';
import { useMisCursos } from '../../hooks/useMisCursos';
import type { CursoVirtual } from '../../api/types';
import { puedeCursar } from '../../utils/cursoUtils';
import { resolvePlayerUrl } from '../../utils/uploadUrl';
import type { RootStackParamList } from '../../navigation/types';
import { space } from '../../theme/spacing';

export default function MisCursosPanel() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const c = useTheme();
  const { cursos, loading, error, reload } = useMisCursos();

  function abrir(curso: CursoVirtual) {
    if (!puedeCursar(curso)) {
      Alert.alert('Curso', 'Complete el pago en el CEA para acceder a este curso.');
      return;
    }
    const url = resolvePlayerUrl(curso.playerUrl);
    if (!url) {
      Alert.alert('Curso', 'Contenido no disponible.');
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
    <ScreenBody onRefresh={reload} refreshing={loading}>
      <SectionHeader
        title="Mis cursos"
        subtitle={`${cursos.length} matriculado(s)`}
        icon="book-outline"
      />
      {error ? (
        <SurfaceCard style={{ marginBottom: space.md }}>
          <ScaledText baseSize={14} style={{ color: c.danger, marginBottom: space.sm }}>
            {error}
          </ScaledText>
          <PrimaryButton label="Reintentar" onPress={() => void reload()} variant="secondary" />
        </SurfaceCard>
      ) : null}
      {!loading && cursos.length === 0 ? (
        <EmptyState title="Sin cursos matriculados" subtitle="Matricúlate desde el catálogo" icon="book-outline" />
      ) : (
        cursos.map((curso) => (
          <CursoCard key={String(curso.idPrograma)} curso={curso} layout="horizontal" onPress={() => abrir(curso)} />
        ))
      )}
    </ScreenBody>
  );
}
