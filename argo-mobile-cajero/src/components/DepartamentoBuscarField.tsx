import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { listarDepartamentos, mapDepartamentosOpciones } from '../api/catalogosApi';
import { SearchField } from './SearchField';
import { ScaledText } from './ScaledText';
import { coincideBusquedaEtiqueta } from '../utils/buscarTexto';
import { mensajeErrorApi } from '../utils/pago';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';

export type DepartamentoSeleccion = {
  codDepto: string;
  nombreDepto: string;
};

type Props = {
  label: string;
  value: string;
  texto: string;
  onSeleccion: (d: DepartamentoSeleccion) => void;
  onLimpiar?: () => void;
  placeholder?: string;
  required?: boolean;
};

export function DepartamentoBuscarField({
  label,
  value,
  texto,
  onSeleccion,
  onLimpiar,
  placeholder = 'Seleccione departamento…',
  required,
}: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [opciones, setOpciones] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async (force = false) => {
    if (!force && opciones.length > 0) return;
    setLoading(true);
    setError('');
    try {
      const rows = await listarDepartamentos();
      const mapped = mapDepartamentosOpciones(rows);
      setOpciones(mapped);
      if (!mapped.length) {
        setError('No hay departamentos en el catálogo. Revise la carga Divipola en el ERP.');
      }
    } catch (e) {
      setOpciones([]);
      setError(mensajeErrorApi(e));
    } finally {
      setLoading(false);
    }
  }, [opciones.length]);

  useEffect(() => {
    if (!open) return;
    void cargar();
  }, [open, cargar]);

  const filtradas = useMemo(() => {
    if (!q.trim()) return opciones;
    return opciones.filter((o) => coincideBusquedaEtiqueta(o.label, q));
  }, [opciones, q]);

  function seleccionar(opt: { value: string; label: string }) {
    onSeleccion({ codDepto: opt.value, nombreDepto: opt.label });
    setOpen(false);
    setQ('');
  }

  const visible = texto || value;

  return (
    <View style={styles.wrap}>
      <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 6, fontWeight: '600' }}>
        {label}{required ? ' *' : ''}
      </ScaledText>
      <Pressable
        onPress={() => {
          setQ(texto || '');
          setOpen(true);
        }}
        style={[styles.field, { borderColor: c.border, backgroundColor: c.card }]}
      >
        <ScaledText
          baseSize={15}
          style={{ color: visible ? c.text : '#94a3b8', flex: 1 }}
          numberOfLines={2}
        >
          {texto || placeholder}
        </ScaledText>
        {visible ? (
          <Pressable
            onPress={() => {
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
          <View style={[styles.modalHead, { borderBottomColor: c.border }]}>
            <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '800', flex: 1 }}>
              {label}
            </ScaledText>
            <Pressable onPress={() => setOpen(false)} hitSlop={8}>
              <Ionicons name="close" size={26} color={c.text} />
            </Pressable>
          </View>
          <View style={{ padding: 16, paddingBottom: 8 }}>
            <SearchField value={q} onChangeText={setQ} placeholder="Filtrar departamento…" autoFocus />
          </View>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={c.primary} />
              <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 8 }}>
                Cargando departamentos…
              </ScaledText>
            </View>
          ) : null}
          {!loading && error ? (
            <View style={styles.center}>
              <ScaledText baseSize={14} style={{ color: c.danger, textAlign: 'center', marginBottom: 12 }}>
                {error}
              </ScaledText>
              <Pressable
                onPress={() => void cargar(true)}
                style={[styles.retryBtn, { borderColor: c.primary }]}
              >
                <ScaledText baseSize={14} style={{ color: c.primary, fontWeight: '700' }}>
                  Reintentar
                </ScaledText>
              </Pressable>
            </View>
          ) : null}
          {!loading && !error ? (
            <FlatList
              data={filtradas}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
              ListEmptyComponent={
                <ScaledText baseSize={14} style={{ color: c.textSoft, textAlign: 'center', marginTop: 24 }}>
                  {q.trim() ? 'Sin coincidencias' : 'Sin departamentos'}
                </ScaledText>
              }
              renderItem={({ item }) => {
                const on = item.value === value;
                return (
                  <Pressable
                    onPress={() => seleccionar(item)}
                    style={[
                      styles.opt,
                      {
                        borderColor: on ? c.primary : c.border,
                        backgroundColor: on ? c.accentSoft : c.card,
                      },
                    ]}
                  >
                    <ScaledText baseSize={14} style={{ color: c.text, fontWeight: on ? '700' : '500' }}>
                      {item.label}
                    </ScaledText>
                    {on ? <Ionicons name="checkmark-circle" size={20} color={c.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
    gap: 8,
  },
  modal: { flex: 1 },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 8,
  },
  center: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 24 },
  retryBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
