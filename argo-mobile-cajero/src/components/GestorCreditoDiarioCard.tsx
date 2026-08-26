import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { fetchMiCreditoDiario, type GestorCreditoDiario } from '../api/gestoresApi';
import { ScaledText } from './ScaledText';
import { SurfaceCard } from './SurfaceCard';
import { useAccessibility } from '../context/AccessibilityContext';
import { themeColors } from '../theme/colors';
import { formatMoney } from '../utils/format';
import { esUsuarioGestor } from '../utils/tipoCapacitacion';

type Props = {
  rol?: string | null;
  compact?: boolean;
  onChange?: (data: GestorCreditoDiario | null) => void;
};

export function GestorCreditoDiarioCard({ rol, compact, onChange }: Props) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [data, setData] = useState<GestorCreditoDiario | null>(null);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    if (!esUsuarioGestor(rol)) {
      setData(null);
      onChange?.(null);
      return;
    }
    setLoading(true);
    try {
      const r = await fetchMiCreditoDiario();
      setData(r);
      onChange?.(r);
    } catch {
      setData(null);
      onChange?.(null);
    } finally {
      setLoading(false);
    }
  }, [rol, onChange]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  if (!esUsuarioGestor(rol)) return null;
  if (loading && !data) {
    return (
      <SurfaceCard elevated={false} style={{ ...styles.card, ...(compact ? styles.cardCompact : null) }}>
        <ActivityIndicator color={c.primary} />
      </SurfaceCard>
    );
  }
  if (!data?.aplica) return null;

  const ilimitado = data.ilimitado === true;
  const consumido = data.consumidoHoy ?? 0;
  const limite = data.creditoDiario ?? 0;
  const disponible = data.disponibleHoy ?? Math.max(0, limite - consumido);
  const pct = !ilimitado && limite > 0 ? Math.min(100, Math.round((consumido / limite) * 100)) : 0;
  const agotado = !ilimitado && disponible <= 0;

  return (
      <SurfaceCard
      elevated={false}
      style={{
        ...styles.card,
        ...(compact ? styles.cardCompact : null),
        borderColor: agotado ? c.danger : c.border,
        backgroundColor: agotado ? c.dangerBg : c.card,
      }}
    >
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: highContrast ? c.bgAlt : '#eff6ff' }]}>
          <Ionicons name="wallet-outline" size={20} color={c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '800' }}>
            Crédito diario
          </ScaledText>
          <ScaledText baseSize={11} style={{ color: c.textSoft, marginTop: 2 }}>
            {ilimitado ? 'Sin tope configurado' : 'Comprobantes de ingreso de hoy'}
          </ScaledText>
        </View>
        {agotado ? (
          <ScaledText baseSize={11} style={{ color: c.danger, fontWeight: '800' }}>
            AGOTADO
          </ScaledText>
        ) : null}
      </View>

      <View style={styles.row}>
        <ScaledText baseSize={12} style={{ color: c.textSoft }}>Consumido hoy</ScaledText>
        <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800' }}>
          {formatMoney(consumido)}
        </ScaledText>
      </View>

      {!ilimitado ? (
        <>
          <View style={styles.row}>
            <ScaledText baseSize={12} style={{ color: c.textSoft }}>Disponible</ScaledText>
            <ScaledText baseSize={15} style={{ color: agotado ? c.danger : c.ok, fontWeight: '800' }}>
              {formatMoney(disponible)}
            </ScaledText>
          </View>
          <View style={styles.row}>
            <ScaledText baseSize={12} style={{ color: c.textSoft }}>Límite diario</ScaledText>
            <ScaledText baseSize={13} style={{ color: c.textSoft, fontWeight: '600' }}>
              {formatMoney(limite)}
            </ScaledText>
          </View>
          <View style={[styles.barTrack, { backgroundColor: highContrast ? c.bgAlt : '#e2e8f0' }]}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${pct}%`,
                  backgroundColor: agotado ? c.danger : pct > 85 ? c.warn : c.primary,
                },
              ]}
            />
          </View>
        </>
      ) : (
        <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 4 }}>
          Puede registrar cobros sin límite de monto diario.
        </ScaledText>
      )}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, padding: 14, gap: 8 },
  cardCompact: { marginBottom: 8, padding: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  barTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 4,
  },
  barFill: { height: '100%', borderRadius: 999 },
});
