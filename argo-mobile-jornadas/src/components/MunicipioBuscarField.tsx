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
  /** Cascada: solo municipios de este departamento. */
  codDepto?: string;
  disabled?: boolean;
};

export function MunicipioBuscarField({
  label,
  required,
  texto,
  onSeleccionado,
  onLimpiar,
  placeholder = 'Buscar municipio…',
  codDepto = '',
  disabled = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { highContrast, buttonMultiplier, textMultiplier } = useAccessibility();
  const c = themeColors(highContrast);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<MunicipioDivipola[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const depto = String(codDepto || '').trim();

  useEffect(() => {
    if (!open || disabled) return;
    if (debounce.current) clearTimeout(debounce.current);
    const term = q.trim();
    // Nacional: exige 2 letras. Cascada: q vacío lista todo el depto.
    if (!depto && term.length < 2) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounce.current = setTimeout(() => {
      void buscarMunicipiosDivipola(term, depto ? 200 : 20, depto)
        .then(setRows)
        .catch(() => setRows([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q, open, depto, disabled]);

  const hintEmpty = depto
    ? termHint(q)
    : q.trim().length < 2
      ? 'Escriba al menos 2 letras'
      : 'Sin resultados';

  return (
    <View style={styles.wrap}>
      <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 6, fontWeight: '600' }}>
        {label}
        {required ? ' *' : ''}
      </ScaledText>
      <View style={styles.row}>
        <Pressable
          disabled={disabled}
          onPress={() => {
            if (disabled) return;
            setQ(texto || '');
            setOpen(true);
          }}
          style={[
            styles.field,
            {
              borderColor: c.border,
              backgroundColor: disabled ? c.bg : c.card,
              opacity: disabled ? 0.55 : 1,
            },
          ]}
        >
          <ScaledText
            baseSize={15}
            style={{
              color: texto ? c.text : c.textSoft,
              flex: 1,
              fontSize: 15 * textMultiplier,
            }}
            numberOfLines={1}
          >
            {texto || (disabled ? 'Elija primero el departamento' : placeholder)}
          </ScaledText>
          <Ionicons name="chevron-down" size={18 * buttonMultiplier} color={c.textSoft} />
        </Pressable>
        {texto ? (
          <Pressable
            disabled={disabled}
            onPress={() => {
              if (disabled) return;
              onLimpiar();
            }}
            style={[styles.clear, { borderColor: c.border }]}
            hitSlop={8}
          >
            <Ionicons name="close" size={18 * buttonMultiplier} color={c.textSoft} />
          </Pressable>
        ) : null}
      </View>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[styles.modal, { backgroundColor: c.bg, paddingTop: insets.top + 8 }]}>
          <View style={styles.modalHead}>
            <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '800', flex: 1 }}>
              {label}
            </ScaledText>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={c.text} />
            </Pressable>
          </View>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={depto ? 'Filtrar municipio…' : 'Escriba municipio o departamento…'}
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
                  {item.nombreMunicipio || item.label}
                </ScaledText>
                {!depto && item.nombreDepto ? (
                  <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
                    {item.nombreDepto}
                  </ScaledText>
                ) : null}
              </Pressable>
            )}
            ListEmptyComponent={
              <ScaledText baseSize={14} style={{ color: c.textSoft, textAlign: 'center', marginTop: 24 }}>
                {loading ? '' : hintEmpty}
              </ScaledText>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

function termHint(q: string): string {
  return q.trim() ? 'Sin resultados en este departamento' : 'Sin municipios';
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  clear: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  modal: { flex: 1, paddingHorizontal: 16 },
  modalHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  search: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  opt: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
});
