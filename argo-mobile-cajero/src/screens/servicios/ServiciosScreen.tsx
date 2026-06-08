import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { SearchField } from '../../components/SearchField';
import { SurfaceCard } from '../../components/SurfaceCard';
import { ScaledText } from '../../components/ScaledText';
import { MoneyText } from '../../components/MoneyText';
import { EmptyState } from '../../components/EmptyState';
import { listarServicios } from '../../api/serviciosApi';
import type { ServicioItem } from '../../api/domain';
import { useDebounced } from '../../hooks/useDebounced';
import { useAccessibility } from '../../context/AccessibilityContext';
import { themeColors } from '../../theme/colors';

export default function ServiciosScreen() {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [q, setQ] = useState('');
  const debounced = useDebounced(q);
  const [items, setItems] = useState<ServicioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listarServicios({ q: debounced, catalogo: true });
      setItems(rows);
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

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.searchWrap}>
        <SearchField value={q} onChangeText={setQ} placeholder="Buscar servicio…" />
      </View>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.idServ ?? it._id)}
        refreshing={loading}
        onRefresh={() => void load()}
        contentContainerStyle={items.length ? styles.list : styles.listEmpty}
        ListEmptyComponent={!loading ? <EmptyState title="Sin servicios" /> : null}
        renderItem={({ item }) => (
          <SurfaceCard style={styles.row} elevated={false}>
            <View style={{ flex: 1 }}>
              <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '700' }}>{item.descrServicio}</ScaledText>
              {item.programaNombre ? (
                <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 4 }}>{item.programaNombre}</ScaledText>
              ) : null}
            </View>
            <MoneyText value={item.tarifa1} baseSize={14} style={{ color: c.primary }} bold />
          </SurfaceCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: { padding: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  listEmpty: { flexGrow: 1 },
  row: { marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
