import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { ScreenBody } from '../../components/ScreenBody';
import { SurfaceCard } from '../../components/SurfaceCard';
import { ScaledText } from '../../components/ScaledText';
import { MoneyText } from '../../components/MoneyText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { abrirCaja, cerrarCaja, fetchCajaActivaFull } from '../../api/cajaApi';
import type { CajaActivaFull } from '../../api/domain';
import { useAccessibility } from '../../context/AccessibilityContext';
import { themeColors } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';

export default function CajaScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [data, setData] = useState<CajaActivaFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState('0');
  const [efectivoCierre, setEfectivoCierre] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await fetchCajaActivaFull();
      setData(r);
      if (r.resumenParcial?.efectivoEsperado != null) {
        setEfectivoCierre(String(Math.round(r.resumenParcial.efectivoEsperado)));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al cargar caja');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const abierta = data?.abierta && data.sesion;
  const resumen = data?.resumenParcial ?? data?.sesion?.resumen;

  async function onAbrir() {
    const saldo = Number(saldoInicial.replace(/\D/g, '')) || 0;
    setBusy(true);
    setErr(null);
    try {
      await abrirCaja({ saldoInicial: saldo });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo abrir la caja');
    } finally {
      setBusy(false);
    }
  }

  async function onCerrar() {
    const sesion = data?.sesion;
    if (!sesion) return;
    const contado = Number(efectivoCierre.replace(/\D/g, '')) || 0;
    Alert.alert('Cerrar caja', `¿Cerrar turno #${sesion.idSesion} con ${contado.toLocaleString('es-CO')} en efectivo?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            setErr(null);
            try {
              await cerrarCaja(sesion.idSesion, { efectivoContado: contado });
              await load();
              Alert.alert('Caja cerrada', 'Turno cerrado correctamente.');
            } catch (e) {
              setErr(e instanceof Error ? e.message : 'No se pudo cerrar');
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  }

  return (
    <ScreenBody refreshing={loading} onRefresh={() => { setLoading(true); void load(); }}>
      <SurfaceCard style={{ marginBottom: 14 }}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: abierta ? c.ok : c.warn }]} />
          <ScaledText baseSize={20} style={{ color: c.text, fontWeight: '800', flex: 1 }}>
            {abierta ? `Caja abierta #${data?.sesion?.idSesion}` : 'Sin caja abierta'}
          </ScaledText>
        </View>
        {abierta && data?.sesion ? (
          <ScaledText baseSize={14} style={{ color: c.textSoft, marginTop: 6 }}>
            Desde {new Date(data.sesion.fechaApertura).toLocaleString('es-CO')}
            {data.sesion.sedeNombre ? ` · ${data.sesion.sedeNombre}` : ''}
          </ScaledText>
        ) : (
          <ScaledText baseSize={14} style={{ color: c.textSoft, marginTop: 6 }}>
            Abra turno para registrar cobros e ingresos.
          </ScaledText>
        )}
      </SurfaceCard>

      {abierta && resumen ? (
        <SurfaceCard style={{ marginBottom: 14 }}>
          <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '800', marginBottom: 10 }}>
            Resumen parcial
          </ScaledText>
          <Stat label="Ingresos" value={resumen.totalIngresos} color={c.ok} />
          <Stat label="Egresos" value={resumen.totalEgresos} color={c.danger} />
          <Stat label="Saldo teórico" value={resumen.saldoTeorico} color={c.primary} />
          <Stat label="Efectivo esperado" value={resumen.efectivoEsperado ?? 0} color={c.accent} />
        </SurfaceCard>
      ) : null}

      {!abierta ? (
        <SurfaceCard style={{ marginBottom: 14 }}>
          <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 8 }}>
            Saldo inicial en efectivo
          </ScaledText>
          <TextInput
            value={saldoInicial}
            onChangeText={setSaldoInicial}
            keyboardType="numeric"
            style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
          />
          <PrimaryButton
            label="Abrir caja"
            icon="lock-open-outline"
            onPress={() => void onAbrir()}
            disabled={busy}
            fullWidth
            style={{ marginTop: 14 }}
          />
        </SurfaceCard>
      ) : (
        <>
          <View style={styles.links}>
            <PrimaryButton
              label="Cobros pendientes"
              icon="wallet-outline"
              onPress={() => nav.navigate('CajaCobros')}
              fullWidth
            />
            <PrimaryButton
              label="Movimientos del turno"
              icon="list-outline"
              variant="ghost"
              onPress={() => nav.navigate('CajaMovimientos')}
              fullWidth
            />
          </View>

          <SurfaceCard style={{ marginTop: 14 }}>
            <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 8 }}>
              Efectivo contado al cierre
            </ScaledText>
            <TextInput
              value={efectivoCierre}
              onChangeText={setEfectivoCierre}
              keyboardType="numeric"
              style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
            />
            <PrimaryButton
              label="Cerrar caja"
              icon="lock-closed-outline"
              variant="danger"
              onPress={() => void onCerrar()}
              disabled={busy}
              fullWidth
              style={{ marginTop: 14 }}
            />
          </SurfaceCard>
        </>
      )}

      {err ? (
        <View style={[styles.errBox, { backgroundColor: c.dangerBg }]}>
          <Ionicons name="alert-circle-outline" size={18} color={c.danger} />
          <ScaledText baseSize={14} style={{ color: c.danger, flex: 1 }}>{err}</ScaledText>
        </View>
      ) : null}
    </ScreenBody>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  return (
    <View style={styles.stat}>
      <ScaledText baseSize={14} style={{ color: c.textSoft }}>{label}</ScaledText>
      <MoneyText value={value} baseSize={16} style={{ color }} bold />
    </View>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  links: { gap: 10 },
  stat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  errBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, marginTop: 12 },
});
