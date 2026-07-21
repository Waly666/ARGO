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

import { buscarMunicipiosDivipola, type MunicipioDivipola } from '../api/catalogosApi';
import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';

type Props = {
  label: string;
  required?: boolean;
  texto: string;
  onSeleccionado: (m: MunicipioDivipola) => void;
  onLimpiar: () => void;
  placeholder?: string;
};

export function MunicipioBuscarField({
  label,
  required,
  texto,
  onSeleccionado,
  onLimpiar,
  placeholder = 'Buscar municipio…',
}: Props) {
  const insets = useSafeAreaInsets();
  const { highContrast, buttonMultiplier, textMultiplier } = useAccessibility();
  const c = themeColors(highContrast);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<MunicipioDivipola[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    if (debounce.current) clearTimeout(debounce.current);
    const term = q.trim();
    if (term.length < 2) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounce.current = setTimeout(() => {
      void buscarMunicipiosDivipola(term)
        .then(setRows)
        .catch(() => setRows([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q, open]);

  return (
    <View style={styles.wrap}>
      <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 6, fontWeight: '600' }}>
        {label}
        {required ? ' *' : ''}
      </ScaledText>
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            setQ(texto || '');
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
          <Ionicons name="location-outline" size={18} color={c.primary} style={{ marginRight: 8 }} />
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
            placeholder="Escriba municipio o departamento…"
            placeholderTextColor="#94a3b8"
            style={[
              styles.search,
              {
                borderColor: c.border,
                backgroundColor: c.card,
                color: c.text,
                fontSize: 15 * textMultiplier,
              },
            ]}
            autoFocus
          />
          {loading ? <ActivityIndicator color={c.primary} style={{ marginVertical: 8 }} /> : null}
          <FlatList
            data={rows}
            keyExtractor={(item) => item.codMunicipio || item.label}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom) }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSeleccionado(item);
                  setOpen(false);
                }}
                style={[styles.opt, { backgroundColor: c.card, borderColor: c.border }]}
              >
                <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '700' }}>
                  {item.label}
                </ScaledText>
              </Pressable>
            )}
            ListEmptyComponent={
              <ScaledText baseSize={14} style={{ color: c.textSoft, textAlign: 'center', marginTop: 24 }}>
                {q.trim().length < 2 ? 'Escriba al menos 2 letras' : 'Sin resultados'}
              </ScaledText>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
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
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  opt: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
});
