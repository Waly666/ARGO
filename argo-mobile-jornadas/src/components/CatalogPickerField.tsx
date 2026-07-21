import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CatalogOption } from '../catalogos/alumnoCatalogos';
import { labelCatalogo } from '../catalogos/alumnoCatalogos';
import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';

type Props = {
  label: string;
  required?: boolean;
  options: CatalogOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function CatalogPickerField({
  label,
  required,
  options,
  value,
  onChange,
  placeholder = 'Seleccione…',
}: Props) {
  const insets = useSafeAreaInsets();
  const { highContrast, buttonMultiplier, textMultiplier } = useAccessibility();
  const c = themeColors(highContrast);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t),
    );
  }, [options, q]);

  const current = labelCatalogo(options, value) || placeholder;

  return (
    <View style={styles.wrap}>
      <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 6, fontWeight: '600' }}>
        {label}
        {required ? ' *' : ''}
      </ScaledText>
      <Pressable
        onPress={() => {
          setQ('');
          setOpen(true);
        }}
        style={[
          styles.field,
          {
            height: 52 * buttonMultiplier,
            borderColor: c.border,
            backgroundColor: c.card,
          },
        ]}
      >
        <ScaledText
          baseSize={15}
          style={{
            flex: 1,
            color: value ? c.text : '#94a3b8',
            fontSize: 15 * textMultiplier,
          }}
          numberOfLines={1}
        >
          {current}
        </ScaledText>
        <Ionicons name="chevron-down" size={18} color={c.textSoft} />
      </Pressable>

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
            placeholder="Buscar…"
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
          <FlatList
            data={shown}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom) }}
            renderItem={({ item }) => {
              const sel = item.value === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={[
                    styles.opt,
                    {
                      backgroundColor: sel ? c.accentSoft : c.card,
                      borderColor: sel ? c.primary : c.border,
                    },
                  ]}
                >
                  <ScaledText
                    baseSize={15}
                    style={{ color: c.text, fontWeight: sel ? '800' : '600', flex: 1 }}
                  >
                    {item.label}
                  </ScaledText>
                  {sel ? <Ionicons name="checkmark-circle" size={20} color={c.primary} /> : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <ScaledText baseSize={14} style={{ color: c.textSoft, textAlign: 'center', marginTop: 24 }}>
                Sin coincidencias
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
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
});
