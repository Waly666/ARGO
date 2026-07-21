import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchField } from '../../components/SearchField';
import { ScaledText } from '../../components/ScaledText';
import { EmptyState } from '../../components/EmptyState';
import { ProgramaCard } from '../../components/ProgramaCard';
import { ModuleScreenHero } from '../../components/ModuleScreenHero';
import { listarProgramas } from '../../api/programasApi';
import { fetchTiposCapacitacion } from '../../api/catalogosApi';
import type { ProgramaItem } from '../../api/domain';
import { parseTiposCap, type TipoCapOption } from '../../utils/programaDisplay';
import { useDebounced } from '../../hooks/useDebounced';
import { useAccessibility } from '../../context/AccessibilityContext';
import { themeColors } from '../../theme/colors';

export default function ProgramasScreen() {
  const insets = useSafeAreaInsets();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [q, setQ] = useState('');
  const debounced = useDebounced(q);
  const [items, setItems] = useState<ProgramaItem[]>([]);
  const [tiposCap, setTiposCap] = useState<TipoCapOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, tipos] = await Promise.all([
        listarProgramas({ q: debounced, catalogo: true }),
        fetchTiposCapacitacion(),
      ]);
      setItems(rows);
      setTiposCap(parseTiposCap(tipos));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const listHeader = (
    <View style={styles.headerBlock}>
      <ModuleScreenHero
        title="Programas"
        subtitle="Catálogo con tipo, horas y valor de matrícula"
        icon="book"
      />
      <SearchField value={q} onChangeText={setQ} placeholder="Nombre, código o tipo…" />
      <View style={[styles.metaRow, { backgroundColor: highContrast ? c.bgAlt : '#eff6ff' }]}>
        <Ionicons name="library-outline" size={16} color={c.primary} />
        <ScaledText baseSize={12} style={{ color: c.textSoft, flex: 1 }}>
          {items.length > 0
            ? `${items.length} programa${items.length === 1 ? '' : 's'}`
            : 'Escriba para buscar en el catálogo'}
        </ScaledText>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.idPrograma ?? it._id)}
        refreshing={loading}
        onRefresh={() => void load()}
        ListHeaderComponent={listHeader}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 24 + insets.bottom },
          !items.length && styles.listEmpty,
        ]}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="book-outline"
              title="Sin programas"
              subtitle="No hay programas que coincidan con la búsqueda."
            />
          ) : null
        }
        renderItem={({ item }) => <ProgramaCard programa={item} tiposCap={tiposCap} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBlock: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  listEmpty: { flexGrow: 1 },
});
