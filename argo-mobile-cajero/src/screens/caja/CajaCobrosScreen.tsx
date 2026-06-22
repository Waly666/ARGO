import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { ScreenBody } from '../../components/ScreenBody';
import { SearchField } from '../../components/SearchField';
import { ScaledText } from '../../components/ScaledText';
import { MoneyText } from '../../components/MoneyText';
import { EmptyState } from '../../components/EmptyState';
import { SurfaceCard } from '../../components/SurfaceCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import {
  PagoCobroFields,
  pagoCobroStateInicial,
  validarEstadoPago,
  type PagoCobroState,
} from '../../components/PagoCobroFields';
import { listarLiquidacionConSaldo } from '../../api/liquidacionApi';
import { crearIngreso, reciboIngresoHtmlPath } from '../../api/ingresosApi';
import { fetchTiposPago } from '../../api/catalogosApi';
import type { RootStackParamList } from '../../navigation/types';
import type { LiquidacionConSaldoItem } from '../../api/domain';
import { useDebounced } from '../../hooks/useDebounced';
import { useAccessibility } from '../../context/AccessibilityContext';
import { themeColors } from '../../theme/colors';
import { esLiquidacionVirtual, mensajeErrorApi } from '../../utils/pago';

export default function CajaCobrosScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [q, setQ] = useState('');
  const debounced = useDebounced(q);
  const [items, setItems] = useState<LiquidacionConSaldoItem[]>([]);
  const [totales, setTotales] = useState({ saldo: 0 });
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [cobroItem, setCobroItem] = useState<LiquidacionConSaldoItem | null>(null);
  const [montoText, setMontoText] = useState('');
  const [pagoCobro, setPagoCobro] = useState<PagoCobroState>(() => pagoCobroStateInicial());
  const [tiposPago, setTiposPago] = useState<Awaited<ReturnType<typeof fetchTiposPago>>>([]);

  const load = useCallback(async () => {
    try {
      const [r, tipos] = await Promise.all([
        listarLiquidacionConSaldo({ q: debounced, limit: 80 }),
        fetchTiposPago().catch(() => []),
      ]);
      setItems(r.items);
      setTotales({ saldo: r.totales?.saldo ?? 0 });
      setTiposPago(tipos);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const cobroVirtual = cobroItem ? esLiquidacionVirtual(cobroItem) : false;

  function abrirCobro(item: LiquidacionConSaldoItem) {
    const saldo = Number(item.saldo) || 0;
    if (saldo <= 0) return;
    setCobroItem(item);
    setMontoText(String(Math.round(saldo)));
    setPagoCobro(pagoCobroStateInicial());
  }

  function cerrarCobro() {
    setCobroItem(null);
    setMontoText('');
    setPagoCobro(pagoCobroStateInicial());
  }

  function parseMonto(): number {
    const raw = montoText.replace(/[^\d]/g, '');
    return raw === '' ? 0 : Number(raw);
  }

  function patchPagoCobro(patch: Partial<PagoCobroState>) {
    setPagoCobro((s) => ({ ...s, ...patch }));
  }

  async function confirmarCobro() {
    if (!cobroItem) return;
    const saldo = Number(cobroItem.saldo) || 0;
    const valor = cobroVirtual ? saldo : parseMonto();
    if (valor <= 0) {
      Alert.alert('Cobro', 'Indique un valor mayor a cero.');
      return;
    }
    if (cobroVirtual && Math.abs(valor - saldo) > 0.0001) {
      Alert.alert(
        'Matrícula virtual',
        `Debe cobrarse el saldo completo (${Math.round(saldo).toLocaleString('es-CO')} COP).`,
      );
      return;
    }
    if (valor > saldo + 0.0001) {
      Alert.alert('Cobro', `El valor no puede superar el saldo (${saldo.toLocaleString('es-CO')}).`);
      return;
    }
    const valPago = validarEstadoPago(pagoCobro, tiposPago);
    if (!valPago.ok) {
      Alert.alert('Cobro', valPago.message ?? 'Complete los datos del pago.');
      return;
    }
    setPayingId(cobroItem._id);
    try {
      const ing = await crearIngreso(
        {
          numDoc: cobroItem.alumnoDoc ?? cobroItem.numDoc,
          idLiquidacion: cobroItem._id,
          valor,
          idTipoPago: pagoCobro.idTipoPago,
          idCuentaBancaria: pagoCobro.idCuentaBancaria || undefined,
          numComprobante: pagoCobro.numComprobante.trim() || undefined,
          observaciones: pagoCobro.observaciones.trim() || undefined,
        },
        pagoCobro.soporte,
      );
      const num = ing.numRecibo ?? ing._id;
      const tipo = valor >= saldo - 0.0001 ? 'Pago total' : 'Abono parcial';
      cerrarCobro();
      Alert.alert('Cobro registrado', `${tipo}\nRecibo #${num}`, [
        { text: 'Cerrar', style: 'cancel' },
        {
          text: 'Imprimir recibo',
          onPress: () =>
            nav.navigate('DocumentoViewer', {
              title: `Recibo ${num}`,
              htmlPath: reciboIngresoHtmlPath(ing._id),
            }),
        },
      ]);
      await load();
    } catch (e) {
      Alert.alert('Error', mensajeErrorApi(e));
    } finally {
      setPayingId(null);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.searchWrap}>
        <SearchField value={q} onChangeText={setQ} placeholder="Alumno, documento o servicio…" />
      </View>
      <SurfaceCard style={styles.totals} elevated={false}>
        <ScaledText baseSize={13} style={{ color: c.textSoft }}>Saldo pendiente (lista)</ScaledText>
        <MoneyText value={totales.saldo} baseSize={20} style={{ color: c.warn }} bold />
      </SurfaceCard>
      <FlatList
        data={items}
        keyExtractor={(it) => it._id}
        refreshing={loading}
        onRefresh={() => { setLoading(true); void load(); }}
        contentContainerStyle={items.length ? styles.list : styles.listEmpty}
        ListEmptyComponent={
          !loading ? <EmptyState title="Sin cobros pendientes" subtitle="No hay liquidaciones con saldo." /> : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => abrirCobro(item)}
            disabled={payingId === item._id}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.9 : payingId === item._id ? 0.6 : 1 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '700' }}>
                {item.alumnoNombre || `Doc ${item.alumnoDoc ?? item.numDoc}`}
              </ScaledText>
              <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 4 }} numberOfLines={2}>
                {item.descripcion || 'Servicio'}
              </ScaledText>
              {esLiquidacionVirtual(item) ? (
                <ScaledText baseSize={11} style={{ color: c.accent, fontWeight: '700', marginTop: 4 }}>
                  Virtual — pago total
                </ScaledText>
              ) : null}
            </View>
            <MoneyText value={item.saldo} baseSize={16} style={{ color: c.primary }} bold />
          </Pressable>
        )}
      />

      <Modal visible={!!cobroItem} transparent animationType="fade" onRequestClose={cerrarCobro}>
        <View style={styles.modalBackdrop}>
          <SurfaceCard style={{ ...styles.modalCard, backgroundColor: c.card }} elevated>
            {cobroItem ? (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '800' }}>
                  Registrar cobro
                </ScaledText>
                <ScaledText baseSize={14} style={{ color: c.textSoft, marginTop: 6 }}>
                  {cobroItem.alumnoNombre || `Doc ${cobroItem.alumnoDoc ?? cobroItem.numDoc}`}
                </ScaledText>
                <ScaledText baseSize={14} style={{ color: c.text, marginTop: 4 }} numberOfLines={2}>
                  {cobroItem.descripcion || 'Servicio'}
                </ScaledText>
                {cobroVirtual ? (
                  <ScaledText baseSize={12} style={{ color: c.accent, fontWeight: '700', marginTop: 6 }}>
                    Matrícula virtual: solo pago del saldo completo
                  </ScaledText>
                ) : null}
                <View style={styles.modalSaldo}>
                  <ScaledText baseSize={13} style={{ color: c.textSoft }}>Saldo pendiente</ScaledText>
                  <MoneyText value={cobroItem.saldo} baseSize={16} style={{ color: c.warn }} bold />
                </View>
                {!cobroVirtual ? (
                  <>
                    <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 12, marginBottom: 6 }}>
                      Valor a pagar (abono o total)
                    </ScaledText>
                    <TextInput
                      value={montoText}
                      onChangeText={(t) => setMontoText(t.replace(/[^\d]/g, ''))}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#94a3b8"
                      style={[styles.montoInput, { borderColor: c.border, color: c.text, backgroundColor: c.bg }]}
                    />
                    <Pressable
                      onPress={() => setMontoText(String(Math.round(Number(cobroItem.saldo) || 0)))}
                      style={[styles.totalLink, { borderColor: c.primary }]}
                    >
                      <ScaledText baseSize={13} style={{ color: c.primary, fontWeight: '700' }}>
                        Usar saldo completo
                      </ScaledText>
                    </Pressable>
                    {parseMonto() > 0 && parseMonto() < (Number(cobroItem.saldo) || 0) - 0.0001 ? (
                      <ScaledText baseSize={12} style={{ color: c.warn, fontWeight: '600', marginTop: 8 }}>
                        Abono parcial
                      </ScaledText>
                    ) : null}
                  </>
                ) : (
                  <View style={[styles.modalSaldo, { marginTop: 8 }]}>
                    <ScaledText baseSize={13} style={{ color: c.textSoft }}>Valor a cobrar</ScaledText>
                    <MoneyText value={cobroItem.saldo} baseSize={18} style={{ color: c.primary }} bold />
                  </View>
                )}
                <PagoCobroFields
                  idLiquidaciones={[cobroItem._id]}
                  subtotalItems={cobroVirtual ? Number(cobroItem.saldo) || 0 : parseMonto()}
                  value={pagoCobro}
                  onChange={patchPagoCobro}
                />
                <View style={styles.modalActions}>
                  <PrimaryButton label="Cancelar" variant="ghost" onPress={cerrarCobro} style={{ flex: 1 }} />
                  <PrimaryButton
                    label="Cobrar"
                    icon="cash-outline"
                    onPress={() => void confirmarCobro()}
                    disabled={payingId === cobroItem._id}
                    style={{ flex: 1 }}
                  />
                </View>
              </ScrollView>
            ) : null}
          </SurfaceCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: { paddingHorizontal: 16, paddingTop: 8 },
  totals: { marginHorizontal: 16, marginTop: 10, marginBottom: 8, paddingVertical: 12 },
  list: { padding: 16, paddingTop: 4, gap: 10 },
  listEmpty: { flexGrow: 1 },
  row: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { padding: 18, gap: 4, maxHeight: '92%' },
  modalSaldo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cbd5e1',
  },
  montoInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
  },
  totalLink: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
