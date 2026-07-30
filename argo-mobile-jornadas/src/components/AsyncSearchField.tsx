import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';

export type AsyncSearchItem = { id: string; label: string };

type Props = {
  label: string;
  required?: boolean;
  texto: string;
  placeholder?: string;
  minChars?: number;
  /** Si true, carga resultados al abrir aunque q esté vacío. */
  loadOnOpen?: boolean;
  onBuscar: (q: string) => Promise<AsyncSearchItem[]>;
  onSeleccionado: (item: AsyncSearchItem) => void;
  onLimpiar: () => void;
};

export function AsyncSearchField({
  label,
  required,
  texto,
  placeholder = 'Buscar…',
  minChars = 0,
  loadOnOpen = true,
  onBuscar,
  onSeleccionado,
  onLimpiar,
}: Props) {
  const insets = useSafeAreaInsets();
  const { highContrast, buttonMultiplier, textMultiplier } = useAccessibility();
  const c = themeColors(highContrast);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<AsyncSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (debounce.current) clearTimeout(debounce.current);
    const term = q.trim();
    if (term.length < minChars && !(loadOnOpen && term.length === 0)) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounce.current = setTimeout(() => {
      void onBuscar(term)
        .then(setRows)
        .catch(() => setRows([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q, open, minChars, loadOnOpen, onBuscar]);

  return (
    <View style={styles.wrap}>
      <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 6, fontWeight: '600' }}>
        {label}
        {required ? ' *' : ''}
      </ScaledText>
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            setQ('');
            setOpen(true);
          }}
          style={[
            styles.field,
            {
              flex: 1,
              height: 52 * buttonMultiplier,
              borderColor: c.border,
              backgroundColor: c.card,
            },
          ]}
        >
          <ScaledText
            baseSize={15}
            style={{ flex: 1, color: texto ? c.text : '#94a3b8', fontSize: 15 * textMultiplier }}
            numberOfLines={1}
          >
            {texto || placeholder}
          </ScaledText>
          <Ionicons name="search" size={18} color={c.textSoft} />
        </Pressable>
        {texto ? (
          <Pressable
            onPress={onLimpiar}
            style={[styles.clearBtn, { borderColor: c.border, backgroundColor: c.card }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={c.textSoft} />
          </Pressable>
        ) : null}
      </View>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[styles.modal, { paddingTop: insets.top, backgroundColor: c.bg }]}>
          <View style={styles.modalHead}>
            <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '800', flex: 1 }}>
              {label}
            </ScaledText>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <Ionicons name="close" size={26} color={c.textSoft} />
            </Pressable>
          </View>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            autoFocus
            style={[
              styles.search,
              {
                borderColor: c.border,
                backgroundColor: c.card,
                color: c.text,
                fontSize: 15 * textMultiplier,
              },
            ]}
          />
          {loading ? <ActivityIndicator color={c.primary} style={{ marginVertical: 12 }} /> : null}
          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              !loading ? (
                <ScaledText baseSize={14} style={{ color: c.textSoft, padding: 16, textAlign: 'center' }}>
                  {minChars > 0 && q.trim().length < minChars
                    ? `Escriba al menos ${minChars} caracteres`
                    : 'Sin resultados'}
                </ScaledText>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSeleccionado(item);
                  setOpen(false);
                }}
                style={[styles.rowItem, { borderBottomColor: c.border }]}
              >
                <ScaledText baseSize={15} style={{ color: c.text }}>
                  {item.label}
                </ScaledText>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: { flex: 1, paddingHorizontal: 16 },
  modalHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingTop: 8 },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  rowItem: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
