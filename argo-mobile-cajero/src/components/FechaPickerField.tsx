import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SearchField } from './SearchField';
import { ScaledText } from './ScaledText';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import {
  DIAS_CORTO,
  MESES_CORTO,
  MESES_LARGO,
  buildMonthGrid,
  formatYmdDisplay,
  formatYmdLegible,
  isYmdInRange,
  listarAnios,
  parseYmd,
  ymdFromParts,
  ymdToday,
} from '../utils/fechaHelpers';

type Vista = 'anio' | 'mes' | 'dia';

type Props = {
  label: string;
  value: string;
  onChange: (ymd: string) => void;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  /** Sin fecha previa, abrir en selección de año (ideal para nacimiento). */
  inicioEnAnio?: boolean;
  mostrarHoy?: boolean;
};

const ANIO_MIN_DEF = new Date().getFullYear() - 100;

export function FechaPickerField({
  label,
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
  required,
  min,
  max,
  inicioEnAnio = false,
  mostrarHoy = false,
}: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [open, setOpen] = useState(false);
  const [vista, setVista] = useState<Vista>('dia');
  const [anio, setAnio] = useState(() => new Date().getFullYear() - 25);
  const [mes, setMes] = useState(() => new Date().getMonth() + 1);
  const [buscarAnio, setBuscarAnio] = useState('');

  const maxYmd = max ?? ymdToday();
  const minYmd = min ?? `${ANIO_MIN_DEF}-01-01`;
  const minAnio = parseYmd(minYmd)?.y ?? ANIO_MIN_DEF;
  const maxAnio = parseYmd(maxYmd)?.y ?? new Date().getFullYear();

  const anios = useMemo(() => listarAnios(minAnio, maxAnio), [minAnio, maxAnio]);

  const aniosFiltrados = useMemo(() => {
    const q = buscarAnio.trim();
    if (!q) return anios;
    return anios.filter((y) => String(y).includes(q));
  }, [anios, buscarAnio]);

  const grillaDias = useMemo(() => buildMonthGrid(anio, mes), [anio, mes]);

  const seleccion = parseYmd(value);

  const abrir = useCallback(() => {
    const p = parseYmd(value);
    if (p) {
      setAnio(p.y);
      setMes(p.m);
      setVista('dia');
    } else {
      setAnio(Math.min(maxAnio, Math.max(minAnio, new Date().getFullYear() - 25)));
      setMes(1);
      setVista(inicioEnAnio ? 'anio' : 'dia');
    }
    setBuscarAnio('');
    setOpen(true);
  }, [value, inicioEnAnio, minAnio, maxAnio]);

  function cerrar() {
    setOpen(false);
    setBuscarAnio('');
  }

  function elegirDia(dia: number) {
    const ymd = ymdFromParts(anio, mes, dia);
    if (!isYmdInRange(ymd, minYmd, maxYmd)) return;
    onChange(ymd);
    cerrar();
  }

  function elegirAnio(y: number) {
    setAnio(y);
    setVista('mes');
    setBuscarAnio('');
  }

  function elegirMes(m: number) {
    setMes(m);
    setVista('dia');
  }

  function irAtras() {
    if (vista === 'dia') setVista('mes');
    else if (vista === 'mes') setVista('anio');
  }

  const titulo =
    vista === 'anio'
      ? 'Seleccione el año'
      : vista === 'mes'
        ? `Mes de ${anio}`
        : `${MESES_LARGO[mes - 1]} ${anio}`;

  const visible = formatYmdDisplay(value);

  return (
    <View style={styles.wrap}>
      <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 6, fontWeight: '600' }}>
        {label}{required ? ' *' : ''}
      </ScaledText>
      <Pressable
        onPress={abrir}
        style={[styles.field, { borderColor: c.border, backgroundColor: c.card }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: highContrast ? c.bgAlt : '#f1f5f9' }]}>
          <Ionicons name="calendar-outline" size={20} color={c.primary} />
        </View>
        <ScaledText
          baseSize={16}
          style={{ color: visible ? c.text : '#94a3b8', flex: 1 }}
          numberOfLines={1}
        >
          {visible || placeholder}
        </ScaledText>
        {visible ? (
          <Pressable
            onPress={() => onChange('')}
            hitSlop={8}
            accessibilityLabel="Limpiar fecha"
          >
            <Ionicons name="close-circle" size={20} color={c.textSoft} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-down" size={18} color={c.textSoft} />
        )}
      </Pressable>

      {open ? (
      <Modal visible animationType="slide" onRequestClose={cerrar}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: c.bg }]}>
        <View style={styles.modal}>
          <View style={[styles.modalHead, { borderBottomColor: c.border }]}>
            <Pressable onPress={vista === 'anio' ? cerrar : irAtras} hitSlop={8} style={styles.headBtn}>
              <Ionicons name={vista === 'anio' ? 'close' : 'arrow-back'} size={24} color={c.text} />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '800' }}>
                {titulo}
              </ScaledText>
              {seleccion && vista === 'dia' ? (
                <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
                  Actual: {formatYmdLegible(value)}
                </ScaledText>
              ) : null}
            </View>
            <Pressable onPress={cerrar} hitSlop={8} style={styles.headBtn}>
              <Ionicons name="close" size={24} color={c.text} />
            </Pressable>
          </View>

          {vista !== 'anio' ? (
            <View style={[styles.crumbs, { borderBottomColor: c.border }]}>
              <Pressable onPress={() => setVista('anio')} style={[styles.crumb, { borderColor: c.border }]}>
                <ScaledText baseSize={13} style={{ color: c.primary, fontWeight: '700' }}>
                  {anio}
                </ScaledText>
              </Pressable>
              {vista === 'dia' ? (
                <>
                  <Ionicons name="chevron-forward" size={14} color={c.textSoft} />
                  <Pressable onPress={() => setVista('mes')} style={[styles.crumb, { borderColor: c.border }]}>
                    <ScaledText baseSize={13} style={{ color: c.primary, fontWeight: '700' }}>
                      {MESES_CORTO[mes - 1]}
                    </ScaledText>
                  </Pressable>
                </>
              ) : null}
            </View>
          ) : null}

          <View style={styles.modalBody}>
          {vista === 'anio' ? (
            <>
              <View style={styles.buscarWrap}>
                <SearchField
                  value={buscarAnio}
                  onChangeText={setBuscarAnio}
                  placeholder="Buscar año…"
                  autoFocus
                />
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.anioScroll}
                showsVerticalScrollIndicator
              >
                {aniosFiltrados.length === 0 ? (
                  <ScaledText baseSize={14} style={{ color: c.textSoft, textAlign: 'center', marginTop: 24 }}>
                    Sin años para «{buscarAnio.trim()}»
                  </ScaledText>
                ) : (
                  aniosFiltrados.map((y) => {
                    const on = seleccion?.y === y;
                    return (
                      <Pressable
                        key={y}
                        onPress={() => elegirAnio(y)}
                        style={[
                          styles.anioRow,
                          {
                            borderColor: on ? c.primary : c.border,
                            backgroundColor: on ? c.accentSoft : c.card,
                          },
                        ]}
                      >
                        <ScaledText baseSize={16} style={{ color: c.text, fontWeight: on ? '800' : '600' }}>
                          {y}
                        </ScaledText>
                        {y === new Date().getFullYear() ? (
                          <ScaledText baseSize={11} style={{ color: c.textSoft }}>
                            Actual
                          </ScaledText>
                        ) : null}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </>
          ) : null}

          {vista === 'mes' ? (
            <ScrollView contentContainerStyle={styles.mesGrid} keyboardShouldPersistTaps="handled">
              {MESES_CORTO.map((nombre, idx) => {
                const m = idx + 1;
                const on = seleccion?.y === anio && seleccion.m === m;
                return (
                  <Pressable
                    key={nombre}
                    onPress={() => elegirMes(m)}
                    style={[
                      styles.mesCell,
                      {
                        borderColor: on ? c.primary : c.border,
                        backgroundColor: on ? c.accentSoft : c.card,
                      },
                    ]}
                  >
                    <ScaledText baseSize={14} style={{ color: c.text, fontWeight: on ? '800' : '600' }}>
                      {nombre}
                    </ScaledText>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {vista === 'dia' ? (
            <View style={styles.diaWrap}>
              <View style={styles.weekRow}>
                {DIAS_CORTO.map((d) => (
                  <ScaledText
                    key={d}
                    baseSize={12}
                    style={[styles.wd, { color: c.textSoft, fontWeight: '700' }]}
                  >
                    {d}
                  </ScaledText>
                ))}
              </View>
              {grillaDias.map((row, ri) => (
                <View key={`r-${ri}`} style={styles.weekRow}>
                  {row.map((dia, ci) => {
                    if (dia == null) {
                      return <View key={`e-${ri}-${ci}`} style={styles.diaCell} />;
                    }
                    const ymd = ymdFromParts(anio, mes, dia);
                    const disabled = !isYmdInRange(ymd, minYmd, maxYmd);
                    const on =
                      seleccion?.y === anio && seleccion.m === mes && seleccion.d === dia;
                    const hoy = ymd === ymdToday();
                    return (
                      <Pressable
                        key={`d-${ri}-${ci}`}
                        disabled={disabled}
                        onPress={() => elegirDia(dia)}
                        style={[
                          styles.diaCell,
                          styles.diaBtn,
                          {
                            borderColor: on ? c.primary : 'transparent',
                            backgroundColor: on
                              ? c.accentSoft
                              : hoy
                                ? highContrast
                                  ? c.bgAlt
                                  : '#eff6ff'
                                : 'transparent',
                            opacity: disabled ? 0.28 : 1,
                          },
                        ]}
                      >
                        <ScaledText
                          baseSize={15}
                          style={{
                            color: on ? c.primary : c.text,
                            fontWeight: on || hoy ? '800' : '500',
                          }}
                        >
                          {dia}
                        </ScaledText>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : null}
          </View>

          <View style={[styles.footer, { borderTopColor: c.border }]}>
            {value ? (
              <Pressable onPress={() => { onChange(''); cerrar(); }} style={styles.footBtn}>
                <ScaledText baseSize={14} style={{ color: c.danger, fontWeight: '700' }}>
                  Limpiar
                </ScaledText>
              </Pressable>
            ) : (
              <View style={styles.footBtn} />
            )}
            {mostrarHoy ? (
              <Pressable
                onPress={() => {
                  const hoy = ymdToday();
                  if (isYmdInRange(hoy, minYmd, maxYmd)) {
                    onChange(hoy);
                    cerrar();
                  }
                }}
                style={styles.footBtn}
              >
                <ScaledText baseSize={14} style={{ color: c.primary, fontWeight: '700' }}>
                  Hoy
                </ScaledText>
              </Pressable>
            ) : (
              <View style={styles.footBtn} />
            )}
          </View>
        </View>
        </SafeAreaView>
      </Modal>
      ) : null}
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
    height: 52,
    overflow: 'hidden',
    gap: 4,
  },
  iconWrap: {
    width: 48,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSafe: { flex: 1 },
  modal: { flex: 1 },
  modalBody: { flex: 1 },
  buscarWrap: { padding: 16, paddingBottom: 8 },
  anioScroll: { paddingHorizontal: 16, paddingBottom: 24 },
  diaWrap: { paddingHorizontal: 12, paddingBottom: 16 },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  crumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  crumb: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  anioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  mesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    justifyContent: 'center',
  },
  mesCell: {
    width: '30%',
    minWidth: 96,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  wd: { width: 40, textAlign: 'center' },
  diaCell: { width: 40, height: 40 },
  diaBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footBtn: { padding: 8, minWidth: 72, alignItems: 'center' },
});
