import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { CursoCard } from '../components/CursoCard';
import { EmptyState } from '../components/EmptyState';
import { FilterChip } from '../components/FilterChip';
import { ScaledText } from '../components/ScaledText';
import { SearchField } from '../components/SearchField';
import { SectionHeader } from '../components/SectionHeader';
import { useTheme } from '../context/ThemeContext';
import { useDebounced } from '../hooks/useDebounced';
import { fetchCategorias, fetchCursos } from '../api/aulaApi';
import type { CategoriaVirtual, CursoVirtual } from '../api/types';
import type { RootStackParamList } from '../navigation/types';
import { space } from '../theme/spacing';

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
        <SectionHeader
          title="Catálogo"
          subtitle={loading ? 'Cargando…' : `${cursos.length} curso(s) disponibles`}
          icon="library-outline"
        />
        <SearchField value={q} onChangeText={setQ} placeholder="Buscar por nombre…" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <FilterChip label="Todos" active={catId == null} onPress={() => setCatId(null)} />
          {cats.map((cat) => (
            <FilterChip
              key={cat.idCategoria}
              label={cat.nombre}
              active={catId === cat.idCategoria}
              onPress={() => setCatId(cat.idCategoria)}
            />
          ))}
        </ScrollView>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: space.xxl }} color={c.primary} size="large" />
      ) : cursos.length === 0 ? (
        <EmptyState title="Sin resultados" subtitle="Prueba otra búsqueda o categoría" icon="search-outline" />
      ) : (
        <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
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
  pad: { paddingHorizontal: space.lg },
  chips: { paddingBottom: space.md },
});
