import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { CursoCard } from '../../components/CursoCard';
import { EmptyState } from '../../components/EmptyState';
import { ScreenBody } from '../../components/ScreenBody';
import { ScaledText } from '../../components/ScaledText';
import { useTheme } from '../../context/ThemeContext';
import { fetchMisCursos } from '../../api/aulaApi';
import type { CursoVirtual } from '../../api/types';
import { puedeCursar } from '../../utils/cursoUtils';
import { resolvePlayerUrl } from '../../utils/uploadUrl';
import type { RootStackParamList } from '../../navigation/types';

export default function MisCursosPanel() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const c = useTheme();
  const [cursos, setCursos] = useState<CursoVirtual[]>([]);

  const load = useCallback(async () => {
    try {
      setCursos(await fetchMisCursos());
    } catch {
      setCursos([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
    <ScreenBody onRefresh={load}>
      <ScaledText baseSize={20} style={{ color: c.text, fontWeight: '800', marginBottom: 12 }}>
        Mis cursos
      </ScaledText>
      {cursos.length === 0 ? (
        <EmptyState title="Sin cursos matriculados" icon="book-outline" />
      ) : (
        cursos.map((curso) => (
          <CursoCard key={String(curso.idPrograma)} curso={curso} onPress={() => abrir(curso)} />
        ))
      )}
    </ScreenBody>
  );
}
