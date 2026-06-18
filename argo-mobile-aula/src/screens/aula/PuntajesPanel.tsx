import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '../../components/EmptyState';
import { ScaledText } from '../../components/ScaledText';
import { ScreenBody } from '../../components/ScreenBody';
import { SurfaceCard } from '../../components/SurfaceCard';
import { useTheme } from '../../context/ThemeContext';
import { fetchMisCursos } from '../../api/aulaApi';
import type { CursoVirtual } from '../../api/types';
import { pctCurso } from '../../utils/cursoUtils';

export default function PuntajesPanel() {
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

  const conProgreso = cursos.filter((x) => pctCurso(x) > 0 || (x.progreso?.mejorNotaEval ?? null) != null);

  return (
    <ScreenBody onRefresh={load}>
      <ScaledText baseSize={20} style={{ color: c.text, fontWeight: '800', marginBottom: 4 }}>
        Mis puntajes
      </ScaledText>
      <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 16 }}>
        Avance y evaluaciones de tus cursos virtuales
      </ScaledText>
      {conProgreso.length === 0 ? (
        <EmptyState title="Sin puntajes aún" subtitle="Matricúlese y avance en un curso" icon="stats-chart-outline" />
      ) : (
        conProgreso.map((curso) => (
          <SurfaceCard key={String(curso.idPrograma)} style={{ marginBottom: 12 }}>
            <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '700' }}>
              {curso.nombreProg}
            </ScaledText>
            <View style={styles.grid}>
              <Metric label="Completitud" value={`${Math.round(pctCurso(curso))}%`} />
              <Metric
                label="Mejor nota"
                value={curso.progreso?.mejorNotaEval != null ? String(curso.progreso.mejorNotaEval) : '—'}
              />
              <Metric label="Intentos" value={String(curso.progreso?.intentosEval ?? 0)} />
              <Metric label="Aprobado" value={curso.progreso?.aprobado ? 'Sí' : 'No'} />
            </View>
            {curso.progreso?.clases?.length ? (
              <View style={{ marginTop: 10 }}>
                {curso.progreso.clases.map((cl) => (
                  <ScaledText key={cl.numero} baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
                    Clase {cl.numero}: {Math.round(cl.pct)}% {cl.aprobada ? '✓' : ''}
                  </ScaledText>
                ))}
              </View>
            ) : null}
          </SurfaceCard>
        ))
      )}
    </ScreenBody>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const c = useTheme();
  return (
    <View style={styles.metric}>
      <ScaledText baseSize={11} style={{ color: c.textSoft }}>
        {label}
      </ScaledText>
      <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '700' }}>
        {value}
      </ScaledText>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 12 },
  metric: { width: '45%' },
});
