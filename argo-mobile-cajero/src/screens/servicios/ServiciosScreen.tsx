import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchField } from '../../components/SearchField';
import { ScaledText } from '../../components/ScaledText';
import { EmptyState } from '../../components/EmptyState';
import { ServicioCard } from '../../components/ServicioCard';
import { ModuleScreenHero } from '../../components/ModuleScreenHero';
import { listarServicios } from '../../api/serviciosApi';
import { fetchTiposServicio } from '../../api/catalogosApi';
import type { ServicioItem } from '../../api/domain';
import { parseTiposServ, type TipoServOption } from '../../utils/servicioDisplay';
import { useDebounced } from '../../hooks/useDebounced';
import { useAccessibility } from '../../context/AccessibilityContext';
import { themeColors } from '../../theme/colors';

export default function ServiciosScreen() {
  const insets = useSafeAreaInsets();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [q, setQ] = useState('');
  const debounced = useDebounced(q);
  const [items, setItems] = useState<ServicioItem[]>([]);
  const [tiposServ, setTiposServ] = useState<TipoServOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, tipos] = await Promise.all([
        listarServicios({ q: debounced, catalogo: true }),
        fetchTiposServicio(),
      ]);
      setItems(rows);
      setTiposServ(parseTiposServ(tipos));
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
        title="Servicios"
        subtitle="Catálogo de cobros, tarifas y trámites"
        icon="layers"
      />
      <SearchField value={q} onChangeText={setQ} placeholder="Nombre, tipo o programa…" />
      <View style={[styles.metaRow, { backgroundColor: highContrast ? c.bgAlt : '#eff6ff' }]}>
        <Ionicons name="pricetag-outline" size={16} color={c.primary} />
        <ScaledText baseSize={12} style={{ color: c.textSoft, flex: 1 }}>
          {items.length > 0
            ? `${items.length} servicio${items.length === 1 ? '' : 's'}`
            : 'Escriba para buscar en el catálogo'}
        </ScaledText>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.idServ ?? it._id)}
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
              icon="pricetag-outline"
              title="Sin servicios"
              subtitle="No hay servicios que coincidan con la búsqueda."
            />
          ) : null
        }
        renderItem={({ item }) => <ServicioCard servicio={item} tiposServ={tiposServ} />}
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
