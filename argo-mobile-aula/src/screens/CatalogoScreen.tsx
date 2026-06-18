import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { CursoCard } from '../components/CursoCard';
import { EmptyState } from '../components/EmptyState';
import { ScaledText } from '../components/ScaledText';
import { SearchField } from '../components/SearchField';
import { useTheme } from '../context/ThemeContext';
import { useDebounced } from '../hooks/useDebounced';
import { fetchCategorias, fetchCursos } from '../api/aulaApi';
import type { CategoriaVirtual, CursoVirtual } from '../api/types';
import type { RootStackParamList } from '../navigation/types';

export default function CatalogoScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const c = useTheme();
  const [q, setQ] = useState('');
  const qDeb = useDebounced(q);
  const [cats, setCats] = useState<CategoriaVirtual[]>([]);
  const [catId, setCatId] = useState<number | null>(null);
  const [cursos, setCursos] = useState<CursoVirtual[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, categorias] = await Promise.all([
        fetchCursos(qDeb, catId),
        cats.length ? Promise.resolve(cats) : fetchCategorias(),
      ]);
      setCursos(rows);
      if (!cats.length) setCats(categorias);
    } catch {
      setCursos([]);
    } finally {
      setLoading(false);
    }
  }, [qDeb, catId, cats]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.pad}>
        <SearchField value={q} onChangeText={setQ} placeholder="Buscar curso…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
          <Pressable
            onPress={() => setCatId(null)}
            style={[styles.chip, { backgroundColor: catId == null ? c.primary : c.card, borderColor: c.border }]}
          >
            <ScaledText baseSize={13} style={{ color: catId == null ? '#fff' : c.text }}>
              Todos
            </ScaledText>
          </Pressable>
          {cats.map((cat) => (
            <Pressable
              key={cat.idCategoria}
              onPress={() => setCatId(cat.idCategoria)}
              style={[
                styles.chip,
                {
                  backgroundColor: catId === cat.idCategoria ? c.primary : c.card,
                  borderColor: c.border,
                },
              ]}
            >
              <ScaledText
                baseSize={13}
                style={{ color: catId === cat.idCategoria ? '#fff' : c.text }}
              >
                {cat.nombre}
              </ScaledText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={c.primary} />
      ) : cursos.length === 0 ? (
        <EmptyState title="Sin cursos" subtitle="Pruebe otro filtro o búsqueda" />
      ) : (
        <ScrollView contentContainerStyle={styles.pad}>
          {cursos.map((curso) => (
            <CursoCard
              key={String(curso.idPrograma)}
              curso={curso}
              onPress={() =>
                nav.navigate('CursoDetalle', { id: String(curso.idPrograma), titulo: curso.nombreProg })
              }
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { paddingHorizontal: 16 },
  catRow: { marginBottom: 8, maxHeight: 44 },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
});
