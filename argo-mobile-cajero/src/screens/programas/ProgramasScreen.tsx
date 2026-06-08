import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { SearchField } from '../../components/SearchField';
import { SurfaceCard } from '../../components/SurfaceCard';
import { ScaledText } from '../../components/ScaledText';
import { MoneyText } from '../../components/MoneyText';
import { EmptyState } from '../../components/EmptyState';
import { listarProgramas } from '../../api/programasApi';
import type { ProgramaItem } from '../../api/domain';
import { useDebounced } from '../../hooks/useDebounced';
import { useAccessibility } from '../../context/AccessibilityContext';
import { themeColors } from '../../theme/colors';

export default function ProgramasScreen() {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [q, setQ] = useState('');
  const debounced = useDebounced(q);
  const [items, setItems] = useState<ProgramaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listarProgramas({ q: debounced, catalogo: true });
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
        <SearchField value={q} onChangeText={setQ} placeholder="Buscar programa…" />
      </View>
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.idPrograma ?? it._id)}
        refreshing={loading}
        onRefresh={() => void load()}
        contentContainerStyle={items.length ? styles.list : styles.listEmpty}
        ListEmptyComponent={!loading ? <EmptyState title="Sin programas" /> : null}
        renderItem={({ item }) => (
          <SurfaceCard style={styles.row} elevated={false}>
            <View style={{ flex: 1 }}>
              <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '700' }}>{item.nombreProg}</ScaledText>
              <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 4 }}>
                {item.codigoProg ? `Cód. ${item.codigoProg}` : ''}{item.estado ? ` · ${item.estado}` : ''}
              </ScaledText>
            </View>
            {item.valorMatricula != null ? (
              <MoneyText value={item.valorMatricula} baseSize={14} style={{ color: c.primary }} />
            ) : null}
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
