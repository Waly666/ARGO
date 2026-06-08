import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenBody } from '../../components/ScreenBody';
import { SurfaceCard } from '../../components/SurfaceCard';
import { ScaledText } from '../../components/ScaledText';
import { MoneyText } from '../../components/MoneyText';
import { EmptyState } from '../../components/EmptyState';
import { fetchIngresosSesionActiva, fetchEgresosSesionActiva } from '../../api/cajaApi';
import { useAccessibility } from '../../context/AccessibilityContext';
import { themeColors } from '../../theme/colors';

type Mov = {
  id: string;
  tipo: 'ingreso' | 'egreso';
  label: string;
  valor: number;
  fecha?: string;
};

export default function CajaMovimientosScreen() {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const [movs, setMovs] = useState<Mov[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [ing, egr] = await Promise.all([fetchIngresosSesionActiva(), fetchEgresosSesionActiva()]);
      const rows: Mov[] = [];
      for (const r of ing as Record<string, unknown>[]) {
        rows.push({
          id: String(r.idIngreso ?? r._id ?? Math.random()),
          tipo: 'ingreso',
          label: String(r.servicio ?? r.conceptoLabel ?? r.pagador ?? 'Ingreso'),
          valor: Number(r.valor) || 0,
          fecha: String(r.fecha ?? ''),
        });
      }
      for (const r of egr as Record<string, unknown>[]) {
        rows.push({
          id: String(r.idEgreso ?? r._id ?? Math.random()),
          tipo: 'egreso',
          label: String(r.concepto ?? r.tipoEgresoDescr ?? 'Egreso'),
          valor: Number(r.valorEgreso) || 0,
          fecha: String(r.fechaEgreso ?? ''),
        });
      }
      rows.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
      setMovs(rows);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al cargar movimientos');
      setMovs([]);
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

  return (
    <ScreenBody refreshing={loading} onRefresh={() => { setLoading(true); void load(); }}>
      {err ? (
        <ScaledText baseSize={14} style={{ color: c.danger, marginBottom: 12 }}>{err}</ScaledText>
      ) : null}
      {!movs.length && !loading ? (
        <EmptyState title="Sin movimientos" subtitle="Abra caja o registre ingresos/egresos en este turno." />
      ) : (
        movs.map((m) => (
          <SurfaceCard key={m.id} style={styles.row} elevated={false}>
            <View style={{ flex: 1 }}>
              <ScaledText baseSize={12} style={{ color: m.tipo === 'ingreso' ? c.ok : c.danger, fontWeight: '700' }}>
                {m.tipo === 'ingreso' ? 'INGRESO' : 'EGRESO'}
              </ScaledText>
              <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '600', marginTop: 4 }}>
                {m.label}
              </ScaledText>
              {m.fecha ? (
                <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 4 }}>
                  {new Date(m.fecha).toLocaleString('es-CO')}
                </ScaledText>
              ) : null}
            </View>
            <MoneyText
              value={m.valor}
              baseSize={16}
              style={{ color: m.tipo === 'ingreso' ? c.ok : c.danger }}
              bold
            />
          </SurfaceCard>
        ))
      )}
    </ScreenBody>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
