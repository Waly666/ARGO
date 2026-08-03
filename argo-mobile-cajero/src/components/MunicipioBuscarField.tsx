import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SearchField } from './SearchField';
import { ScaledText } from './ScaledText';
import { buscarMunicipios, type MunicipioItem } from '../api/catalogosApi';
import { useDebounced } from '../hooks/useDebounced';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';

type Props = {
  label: string;
  texto: string;
  onTextoChange: (text: string) => void;
  onSeleccion?: (m: MunicipioItem) => void;
  onLimpiar?: () => void;
  placeholder?: string;
  /** Cascada: solo municipios de este departamento. */
  codDepto?: string;
  disabled?: boolean;
};

export function MunicipioBuscarField({
  label,
  texto,
  onTextoChange,
  onSeleccion,
  onLimpiar,
  placeholder = 'Buscar municipio…',
  codDepto = '',
  disabled = false,
}: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const debounced = useDebounced(q, 300);
  const [items, setItems] = useState<MunicipioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const depto = String(codDepto || '').trim();

  useEffect(() => {
    if (!open || disabled) return;
    const term = debounced.trim();
    if (!depto && term.length < 2) {
      setItems([]);
      return;
    }
    setLoading(true);
    void buscarMunicipios(term, depto ? 200 : 25, depto)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [debounced, open, depto, disabled]);

  function seleccionar(m: MunicipioItem) {
    onTextoChange(m.nombreMunicipio || m.label);
    onSeleccion?.(m);
    setOpen(false);
  }

  return (
    <View style={styles.wrap}>
      <ScaledText baseSize={13} style={{ color: c.textSoft, fontWeight: '600', marginBottom: 6 }}>
        {label}
      </ScaledText>
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
          style={{ color: texto ? c.text : c.textSoft, flex: 1 }}
          numberOfLines={1}
        >
          {texto || (disabled ? 'Elija primero el departamento' : placeholder)}
        </ScaledText>
        {texto && !disabled ? (
          <Pressable
            onPress={() => {
              onTextoChange('');
              onLimpiar?.();
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={20} color={c.textSoft} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-down" size={18} color={c.textSoft} />
        )}
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[styles.modal, { backgroundColor: c.bg }]}>
          <View style={styles.head}>
            <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '800', flex: 1 }}>
              {label}
            </ScaledText>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={c.text} />
            </Pressable>
          </View>
          <SearchField
            value={q}
            onChangeText={setQ}
            placeholder={depto ? 'Filtrar municipio…' : 'Buscar municipio…'}
            autoFocus
          />
          {loading ? (
            <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 12 }}>
              Buscando…
            </ScaledText>
          ) : null}
          <FlatList
            data={items}
            keyExtractor={(item) => item.codMunicipio}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => seleccionar(item)}
                style={[styles.opt, { borderColor: c.border, backgroundColor: c.card }]}
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
              !loading ? (
                <ScaledText baseSize={14} style={{ color: c.textSoft, textAlign: 'center', marginTop: 24 }}>
                  {depto
                    ? debounced.trim()
                      ? 'Sin resultados en este departamento'
                      : 'Sin municipios'
                    : debounced.trim().length < 2
                      ? 'Escriba al menos 2 letras'
                      : 'Sin resultados'}
                </ScaledText>
              ) : null
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  modal: { flex: 1, padding: 16, paddingTop: 48 },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  opt: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
});
