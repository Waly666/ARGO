import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { SearchField } from '../../components/SearchField';
import { ScaledText } from '../../components/ScaledText';
import { MoneyText } from '../../components/MoneyText';
import { EmptyState } from '../../components/EmptyState';
import { buscarAlumnos } from '../../api/alumnosApi';
import type { AlumnoListItem } from '../../api/domain';
import { useDebounced } from '../../hooks/useDebounced';
import { nombreCompleto } from '../../utils/format';
import { useAccessibility } from '../../context/AccessibilityContext';
import { themeColors } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';

export default function AlumnosScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [q, setQ] = useState('');
  const debounced = useDebounced(q);
  const [items, setItems] = useState<AlumnoListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!debounced.trim()) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const r = await buscarAlumnos({ q: debounced, limit: 50 });
      setItems(r.items);
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
        <SearchField value={q} onChangeText={setQ} placeholder="Nombre o documento del alumno…" />
        <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 6 }}>
          Escriba al menos 2 caracteres para buscar.
        </ScaledText>
      </View>
      <FlatList
        data={items}
        keyExtractor={(it) => it._id}
        refreshing={loading}
        onRefresh={() => void load()}
        contentContainerStyle={items.length ? styles.list : styles.listEmpty}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="school-outline"
              title={debounced.trim() ? 'Sin resultados' : 'Busque un alumno'}
              subtitle={debounced.trim() ? 'Pruebe otro nombre o documento.' : 'Use el campo de búsqueda arriba.'}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const nombre = nombreCompleto(item);
          const saldo = item.indicadores?.saldoTotal ?? 0;
          return (
            <Pressable
              onPress={() =>
                nav.navigate('AlumnoDetalle', {
                  numDoc: String(item.numDoc),
                  nombre,
                  alumnoId: item._id,
                })
              }
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: c.accentSoft }]}>
                <Ionicons name="person-outline" size={22} color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '700' }}>{nombre}</ScaledText>
                <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 4 }}>
                  Doc. {item.numDoc}
                </ScaledText>
              </View>
              {saldo > 0 ? <MoneyText value={saldo} baseSize={14} style={{ color: c.warn }} bold /> : null}
              <Ionicons name="chevron-forward" size={20} color={c.textSoft} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: { padding: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  listEmpty: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
