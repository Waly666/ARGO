import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ForoChat } from '../../components/ForoChat';
import { EmptyState } from '../../components/EmptyState';
import { ScaledText } from '../../components/ScaledText';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { fetchMisCursos } from '../../api/aulaApi';
import type { CursoVirtual } from '../../api/types';

export default function ForoPanel() {
  const { state } = useAuth();
  const c = useTheme();
  const [cursos, setCursos] = useState<CursoVirtual[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');

  const load = useCallback(async () => {
    try {
      const rows = await fetchMisCursos();
      setCursos(rows);
      if (rows.length && !sel) {
        setSel(String(rows[0].idPrograma));
        setNombre(rows[0].nombreProg);
      }
    } catch {
      setCursos([]);
    }
  }, [sel]);

  useEffect(() => {
    void load();
  }, [load]);

  const token = state.status === 'signedIn' ? state.token : null;

  if (cursos.length === 0) {
    return (
      <EmptyState
        title="Sin cursos para el foro"
        subtitle="Matricúlese en un curso para participar"
        icon="chatbubbles-outline"
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.pad}>
        <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '800', marginBottom: 8 }}>
          Foro de cursos
        </ScaledText>
        <View style={styles.chips}>
          {cursos.map((curso) => {
            const id = String(curso.idPrograma);
            const active = sel === id;
            return (
              <Pressable
                key={id}
                onPress={() => {
                  setSel(id);
                  setNombre(curso.nombreProg);
                }}
                style={[
                  styles.chip,
                  { backgroundColor: active ? c.primary : c.card, borderColor: c.border },
                ]}
              >
                <ScaledText baseSize={12} style={{ color: active ? '#fff' : c.text }} numberOfLines={1}>
                  {curso.nombreProg}
                </ScaledText>
              </Pressable>
            );
          })}
        </View>
      </View>
      {sel ? (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 8 }}>
          <ForoChat token={token} idPrograma={sel} nombreCurso={nombre} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { padding: 16, paddingBottom: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, maxWidth: '100%' },
});
