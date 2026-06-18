import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { EmptyState } from '../../components/EmptyState';
import { ScaledText } from '../../components/ScaledText';
import { ScreenBody } from '../../components/ScreenBody';
import { SurfaceCard } from '../../components/SurfaceCard';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { fetchMisCertificados, fetchMisCursos } from '../../api/aulaApi';
import type { CursoVirtual } from '../../api/types';
import { cursoCompletado, cursoEnProgreso, pctCurso, puedeCursar } from '../../utils/cursoUtils';
import { resolvePlayerUrl } from '../../utils/uploadUrl';
import type { RootStackParamList } from '../../navigation/types';

export default function TableroPanel() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const c = useTheme();
  const [cursos, setCursos] = useState<CursoVirtual[]>([]);
  const [certs, setCerts] = useState(0);

  const load = useCallback(async () => {
    try {
      const [rows, certRows] = await Promise.all([fetchMisCursos(), fetchMisCertificados()]);
      setCursos(rows);
      setCerts(certRows.length);
    } catch {
      setCursos([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enCurso = cursos.filter(cursoEnProgreso);
  const completados = cursos.filter(cursoCompletado);
  const nombre = state.status === 'signedIn' ? state.user.nombreCompleto : '';

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

  return (
    <ScreenBody onRefresh={load}>
      <ScaledText baseSize={22} style={{ color: c.text, fontWeight: '800' }}>
        Hola, {nombre.split(' ')[0] || 'alumno'}
      </ScaledText>
      <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 16 }}>
        Resumen de tu aprendizaje
      </ScaledText>
      <View style={styles.stats}>
        <StatCard label="Cursos" value={String(cursos.length)} color={c.primary} />
        <StatCard label="En progreso" value={String(enCurso.length)} color={c.accent} />
        <StatCard label="Completados" value={String(completados.length)} color={c.ok} />
        <StatCard label="Certificados" value={String(certs)} color={c.primaryDark} />
      </View>
      {enCurso.length > 0 ? (
        <SurfaceCard style={{ marginTop: 16 }}>
          <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '800', marginBottom: 10 }}>
            Continuar aprendiendo
          </ScaledText>
          {enCurso.slice(0, 3).map((curso) => (
            <Pressable key={String(curso.idPrograma)} onPress={() => abrir(curso)}>
              <ScaledText baseSize={15} style={{ color: c.primary, fontWeight: '600', marginBottom: 8 }}>
                {curso.nombreProg} · {Math.round(pctCurso(curso))}%
              </ScaledText>
            </Pressable>
          ))}
        </SurfaceCard>
      ) : cursos.length === 0 ? (
        <EmptyState
          title="Sin cursos"
          subtitle="Matricúlese en el catálogo para comenzar"
          icon="school-outline"
        />
      ) : null}
    </ScreenBody>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const c = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: c.card, borderColor: c.border }]}>
      <ScaledText baseSize={20} style={{ color, fontWeight: '800' }}>
        {value}
      </ScaledText>
      <ScaledText baseSize={11} style={{ color: c.textSoft, marginTop: 2 }}>
        {label}
      </ScaledText>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
});
