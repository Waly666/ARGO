import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { DataChip } from '../components/DataChip';
import { EmptyState } from '../components/EmptyState';
import { IconInput } from '../components/IconInput';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import { certificadosGenerados } from '../api/jornadasApi';
import type { CertificadoJornada } from '../api/types';
import { fmtFecha } from '../utils/jornadaUi';
import { themeColors } from '../theme/colors';
import { useAccessibility } from '../context/AccessibilityContext';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'Certificados'>;

function textoBusqueda(item: CertificadoJornada): string {
  return [
    item.nombreCompleto,
    item.nombreAlumno,
    item.numDoc,
    item.codigoCert,
    item.codContrato,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export default function CertificadosScreen() {
  const route = useRoute<Route>();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const { idContrato, contratoLabel } = route.params || {};

  const [rows, setRows] = useState<CertificadoJornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const cargar = useCallback(async () => {
    setErr(null);
    try {
      const r = await certificadosGenerados(idContrato);
      setRows(r || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [idContrato]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void cargar();
    }, [cargar]),
  );

  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((item) => textoBusqueda(item).includes(term));
  }, [rows, q]);

  if (loading && !rows.length) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={styles.list}
      data={filtrados}
      keyExtractor={(item) => item._id}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => void cargar()} tintColor={c.primary} />
      }
      ListHeaderComponent={
        <>
          {contratoLabel ? (
            <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 12 }}>
              Contrato: {contratoLabel}
            </ScaledText>
          ) : (
            <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 12 }}>
              Todos los certificados de jornadas visibles para su usuario.
            </ScaledText>
          )}

          <View style={styles.searchWrap}>
            <IconInput
              label="Buscar por nombre"
              icon="search-outline"
              value={q}
              onChangeText={setQ}
              placeholder="Nombre, documento o código…"
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {err ? (
            <ScaledText baseSize={14} style={{ color: c.danger, marginBottom: 12 }}>
              {err}
            </ScaledText>
          ) : null}
          {rows.length > 0 ? (
            <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800', marginBottom: 10 }}>
              {q.trim()
                ? `Resultados (${filtrados.length} de ${rows.length})`
                : `Emitidos (${rows.length})`}
            </ScaledText>
          ) : null}
        </>
      }
      renderItem={({ item }) => {
        const alumno = item.nombreCompleto || item.nombreAlumno || 'Alumno';
        const fecha = fmtFecha(item.fechaEmision || item.createdAt);
        const lugar = item.ubicacionJornada || item.municipio || item.direccion || null;

        return (
          <Pressable
            onPress={() =>
              nav.navigate('CertificadoHtml', {
                id: item._id,
                titulo: item.codigoCert || 'Certificado',
              })
            }
            style={({ pressed }) => ({
              marginBottom: 12,
              opacity: pressed ? 0.94 : 1,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            })}
          >
            <SurfaceCard style={styles.certCard}>
              <View style={[styles.cardAccent, { backgroundColor: c.primary }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <DataChip label="Emitido" icon="ribbon-outline" tone="mint" />
                  {item.codigoCert ? (
                    <DataChip label={item.codigoCert} icon="barcode-outline" tone="soft" />
                  ) : null}
                </View>

                <ScaledText
                  baseSize={17}
                  style={{ color: c.text, fontWeight: '800', marginTop: 12, lineHeight: 22 }}
                  numberOfLines={2}
                >
                  {alumno}
                </ScaledText>

                <View style={styles.metaBlock}>
                  <View style={styles.metaLine}>
                    <Ionicons name="card-outline" size={15} color={c.primaryDark} />
                    <ScaledText baseSize={13} style={[styles.metaText, { color: c.primaryDark }]}>
                      Doc. {item.numDoc ?? '—'}
                    </ScaledText>
                  </View>
                  <View style={styles.metaLine}>
                    <Ionicons name="calendar-outline" size={15} color={c.textSoft} />
                    <ScaledText baseSize={13} style={[styles.metaText, { color: c.textSoft }]}>
                      {fecha}
                    </ScaledText>
                  </View>
                  {item.codContrato ? (
                    <View style={styles.metaLine}>
                      <Ionicons name="document-text-outline" size={15} color={c.textSoft} />
                      <ScaledText
                        baseSize={13}
                        style={[styles.metaText, { color: c.textSoft }]}
                      >
                        Contrato {item.codContrato}
                      </ScaledText>
                    </View>
                  ) : null}
                  {lugar ? (
                    <View style={styles.metaLine}>
                      <Ionicons name="location-outline" size={15} color={c.primaryDark} />
                      <ScaledText
                        baseSize={13}
                        style={[styles.metaText, { color: c.primaryDark }]}
                        numberOfLines={2}
                      >
                        {lugar}
                      </ScaledText>
                    </View>
                  ) : null}
                </View>

                <View style={[styles.cardFooter, { borderTopColor: c.border }]}>
                  <DataChip label="Certificado" icon="checkmark-circle" tone="mint" />
                  <View style={[styles.openBtn, { backgroundColor: c.accentSoft }]}>
                    <ScaledText baseSize={12} style={{ color: c.primaryDark, fontWeight: '800' }}>
                      Ver
                    </ScaledText>
                    <Ionicons name="chevron-forward" size={16} color={c.primaryDark} />
                  </View>
                </View>
              </View>
            </SurfaceCard>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          title={q.trim() ? 'Sin resultados' : 'Sin certificados'}
          hint={
            q.trim()
              ? 'Pruebe con otro nombre, documento o código.'
              : 'Se generan al finalizar la clase con asistencias según el contrato.'
          }
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  searchWrap: { marginBottom: 14 },
  certCard: {
    padding: 0,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardAccent: { width: 5 },
  cardBody: { flex: 1, padding: 14, paddingLeft: 12 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaBlock: { marginTop: 10, gap: 6 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontWeight: '600', flex: 1 },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
