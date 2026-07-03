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

import { ScaledText } from './ScaledText';
import { PrimaryButton } from './PrimaryButton';
import type { ProgramaJornada } from '../api/types';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';

export function programaId(p: ProgramaJornada): string {
  return String(p.idPrograma ?? p._id ?? '').trim();
}

export function programaLabel(p: ProgramaJornada): string {
  return String(p.nombreProg || p.codigoProg || programaId(p) || 'Programa').trim();
}

/** Compara ids de programa aunque vengan como número u ObjectId. */
export function mismoProgramaId(a?: string | number | null, b?: string | number | null): boolean {
  const x = String(a ?? '').trim();
  const y = String(b ?? '').trim();
  if (!x || !y) return false;
  return x === y;
}

type Props = {
  programas: ProgramaJornada[];
  value: string;
  onChange: (idPrograma: string) => void;
  disabled?: boolean;
  label?: string;
};

export function ProgramaPicker({
  programas,
  value,
  onChange,
  disabled,
  label = 'Programa',
}: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const seleccionado = useMemo(
    () => programas.find((p) => mismoProgramaId(programaId(p), value)),
    [programas, value],
  );

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return programas;
    return programas.filter((p) => programaLabel(p).toLowerCase().includes(t));
  }, [programas, q]);

  const textoActual = seleccionado
    ? programaLabel(seleccionado)
    : value
      ? `Programa ${value}`
      : 'Toque para elegir programa';

  return (
    <View>
      <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 6, fontWeight: '600' }}>
        {label}
      </ScaledText>
      <Pressable
        disabled={disabled}
        onPress={() => {
          setQ('');
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.trigger,
          {
            borderColor: c.border,
            backgroundColor: c.bgAlt,
            opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <ScaledText
            baseSize={15}
            style={{
              color: seleccionado || value ? c.text : c.textSoft,
              fontWeight: seleccionado || value ? '700' : '500',
            }}
          >
            {textoActual}
          </ScaledText>
          <ScaledText baseSize={12} style={{ color: c.primary, marginTop: 4, fontWeight: '600' }}>
            {disabled ? 'No editable' : 'Cambiar programa'}
          </ScaledText>
        </View>
        <Ionicons name="chevron-down" size={22} color={c.primary} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: c.card }]}>
            <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '800', marginBottom: 8 }}>
              Elegir programa
            </ScaledText>
            <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 10 }}>
              {programas.length} programa(s) de jornadas de capacitación
            </ScaledText>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Buscar por nombre…"
              placeholderTextColor="#94a3b8"
              style={[styles.search, { borderColor: c.border, color: c.text, backgroundColor: c.bgAlt }]}
              autoCorrect={false}
            />
            <FlatList
              data={filtrados}
              keyExtractor={(item, index) => programaId(item) || `p-${index}`}
              style={{ maxHeight: 360 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <ScaledText baseSize={14} style={{ color: c.textSoft, textAlign: 'center', padding: 20 }}>
                  No hay programas que coincidan.
                </ScaledText>
              }
              renderItem={({ item }) => {
                const id = programaId(item);
                const sel = mismoProgramaId(id, value);
                return (
                  <Pressable
                    onPress={() => {
                      if (!id) return;
                      onChange(id);
                      setOpen(false);
                    }}
                    style={[
                      styles.row,
                      {
                        borderColor: sel ? c.primary : c.border,
                        backgroundColor: sel ? c.accentSoft : c.bgAlt,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <ScaledText
                        baseSize={15}
                        style={{ color: c.text, fontWeight: sel ? '800' : '600' }}
                      >
                        {programaLabel(item)}
                      </ScaledText>
                      {item.codigoProg ? (
                        <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
                          {item.codigoProg}
                        </ScaledText>
                      ) : null}
                    </View>
                    {sel ? <Ionicons name="checkmark-circle" size={22} color={c.primary} /> : null}
                  </Pressable>
                );
              }}
            />
            <View style={{ height: 12 }} />
            <PrimaryButton label="Cerrar" variant="ghost" onPress={() => setOpen(false)} fullWidth />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '88%',
  },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
});
