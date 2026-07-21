import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { formatoIdClaseCorto } from '../components/ClaseIdChip';
import { DataChip, type ChipTone } from '../components/DataChip';
import { EmptyState } from '../components/EmptyState';
import { PressableCard } from '../components/PressableCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { jornadasDelDia } from '../api/jornadasApi';
import type { JornadaCap } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { fmtFecha, ymdLocal } from '../utils/jornadaUi';
import { alertarMetaDesdeJornada } from '../utils/metaAlumnosAlert';
import { puedeGestionarJornadas } from '../utils/permisos';
import { colors, themeColors } from '../theme/colors';
import { useAccessibility } from '../context/AccessibilityContext';
import type { RootStackParamList } from '../navigation/types';

function labelJornada(j: JornadaCap): string {
  const f = fmtFecha(j.fechaProgramacion);
  const muni = j.municipio || j.contratoLabel || j.codContrato || '';
  return `${f}${muni ? ` · ${muni}` : ''}`;
}

function estadoJornadaChip(estado?: string): {
  label: string;
  icon: 'play-circle' | 'checkmark-circle' | 'calendar-outline' | 'pause-circle-outline';
  tone: ChipTone;
  accent: string;
} {
  const e = String(estado || '').toUpperCase();
  if (e === 'EN PROCESO') {
    return { label: 'En curso', icon: 'play-circle', tone: 'sky', accent: colors.pastelSkyFg };
  }
  if (e === 'FINALIZADO') {
    return { label: 'Terminada', icon: 'checkmark-circle', tone: 'slate', accent: colors.pastelSlateFg };
  }
  if (e === 'INACTIVO') {
    return { label: 'Inactiva', icon: 'pause-circle-outline', tone: 'amber', accent: colors.pastelAmberFg };
  }
  return { label: 'Programada', icon: 'calendar-outline', tone: 'lavender', accent: colors.pastelLavenderFg };
}

export default function JornadasHoyScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const user = state.status === 'signedIn' ? state.user : null;
  const esAdmin = puedeGestionarJornadas(user?.permisos, user?.rol, user?.rolNombre);
  const [rows, setRows] = useState<JornadaCap[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setErr(null);
    try {
      const r = await jornadasDelDia(ymdLocal());
      const list = r || [];
      setRows(list);
      for (const j of list) {
        if (j.metaAlcanzada) alertarMetaDesdeJornada(j);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al cargar');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void cargar();
    }, [cargar]),
  );

  const operables = rows.filter((j) => j.estado === 'EN PROCESO');
  const otras = rows.filter((j) => j.estado !== 'EN PROCESO');

  function abrirClases(j: JornadaCap) {
    nav.navigate('ClasesJornada', {
      jornadaId: j._id,
      jornadaLabel: labelJornada(j),
      idContrato: j.idContrato,
    });
  }

  function abrirEditar(j: JornadaCap) {
    nav.navigate('EditarJornada', { jornadaId: j._id });
  }

  function onTapJornada(j: JornadaCap, operable: boolean) {
    if (esAdmin) {
      Alert.alert(labelJornada(j), '¿Qué desea hacer?', [
        { text: 'Editar jornada / GPS', onPress: () => abrirEditar(j) },
        ...(operable || esAdmin
          ? [{ text: 'Ver / operar clases', onPress: () => abrirClases(j) }]
          : []),
        { text: 'Cancelar', style: 'cancel' },
      ]);
      return;
    }
    if (operable) abrirClases(j);
  }

  function renderItem(j: JornadaCap, operable: boolean) {
    const est = estadoJornadaChip(j.estado);
    const lugar = [j.municipio, j.direccion].filter(Boolean).join(' · ') || 'Sin ubicación';
    const totalClases = j.totalClases ?? 0;
    const alumnosLleva = j.alumnosLleva ?? 0;
    const metaAlumnos =
      j.metaAlumnos != null && j.metaAlumnos > 0
        ? j.metaAlumnos
        : j.numeObjeJornada != null
          ? Number(j.numeObjeJornada) || 0
          : 0;
    const metaOk = j.metaAlcanzada || (metaAlumnos > 0 && alumnosLleva >= metaAlumnos);
    const puedeAbrir = operable || esAdmin;

    return (
      <View key={j._id} style={{ marginBottom: 4 }}>
      <PressableCard
        disabled={!puedeAbrir}
        onPress={puedeAbrir ? () => onTapJornada(j, operable) : undefined}
        style={{ opacity: puedeAbrir ? 1 : 0.78 }}
        cardStyle={styles.jornadaCard}
      >
        <View style={[styles.cardAccent, { backgroundColor: est.accent }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <DataChip label={est.label} icon={est.icon} tone={est.tone} />
          </View>

          <ScaledText
            baseSize={17}
            style={{ color: c.text, fontWeight: '800', marginTop: 12, lineHeight: 22 }}
            numberOfLines={2}
          >
            {`${(j.codContrato || j.contratoLabel?.split('—')[0] || 'Contrato').trim()} — ${formatoIdClaseCorto(j._id)}`}
          </ScaledText>

          <View style={styles.metaBlock}>
            <View style={styles.metaLine}>
              <Ionicons name="location-outline" size={15} color={c.primaryDark} />
              <ScaledText baseSize={13} style={[styles.metaText, { color: c.primaryDark }]} numberOfLines={2}>
                {lugar}
              </ScaledText>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: c.pastelLavender }]}>
              <Ionicons name="school-outline" size={16} color={c.pastelLavenderFg} />
              <ScaledText baseSize={16} style={[styles.statNum, { color: c.pastelLavenderFg }]}>
                {totalClases}
              </ScaledText>
              <ScaledText baseSize={11} style={[styles.statLabel, { color: c.pastelLavenderFg }]}>
                Clases
              </ScaledText>
            </View>
            <View style={[styles.statBox, { backgroundColor: metaOk ? c.pastelRose : c.pastelPeach }]}>
              <Ionicons
                name="people-outline"
                size={16}
                color={metaOk ? c.pastelRoseFg : c.pastelPeachFg}
              />
              <ScaledText
                baseSize={16}
                style={[styles.statNum, { color: metaOk ? c.pastelRoseFg : c.pastelPeachFg }]}
              >
                {alumnosLleva}
              </ScaledText>
              <ScaledText
                baseSize={11}
                style={[styles.statLabel, { color: metaOk ? c.pastelRoseFg : c.pastelPeachFg }]}
              >
                Alumnos
              </ScaledText>
            </View>
            <View style={[styles.statBox, { backgroundColor: c.pastelSky }]}>
              <Ionicons name="flag-outline" size={16} color={c.pastelSkyFg} />
              <ScaledText baseSize={16} style={[styles.statNum, { color: c.pastelSkyFg }]}>
                {metaAlumnos || '—'}
              </ScaledText>
              <ScaledText baseSize={11} style={[styles.statLabel, { color: c.pastelSkyFg }]}>
                Meta
              </ScaledText>
            </View>
          </View>

          {metaOk ? (
            <View
              style={[
                styles.metaAlertBanner,
                { backgroundColor: c.pastelRose, borderColor: c.pastelRoseBorder },
              ]}
            >
              <Ionicons name="warning" size={16} color={c.pastelRoseFg} />
              <ScaledText baseSize={12} style={[styles.metaAlertText, { color: c.pastelRoseFg }]}>
                {j.metaSuperada || alumnosLleva > metaAlumnos
                  ? `Tope superado (${alumnosLleva}/${metaAlumnos})`
                  : `Tope alcanzado (${alumnosLleva}/${metaAlumnos})`}
              </ScaledText>
            </View>
          ) : null}

          <View style={[styles.cardFooter, { borderTopColor: c.border }]}>
            {esAdmin ? (
              <ScaledText baseSize={12} style={{ color: c.primaryDark, fontWeight: '700' }}>
                Toque para editar jornada o ver clases
              </ScaledText>
            ) : operable ? (
              <>
                <DataChip
                  label={
                    metaAlumnos > 0
                      ? `${alumnosLleva}/${metaAlumnos} alumnos`
                      : `${alumnosLleva} alumnos`
                  }
                  icon="trending-up-outline"
                  tone="mint"
                />
                <View style={[styles.openBtn, { backgroundColor: c.accentSoft }]}>
                  <ScaledText baseSize={12} style={{ color: c.primaryDark, fontWeight: '800' }}>
                    Ver clases
                  </ScaledText>
                  <Ionicons name="chevron-forward" size={16} color={c.primaryDark} />
                </View>
              </>
            ) : (
              <DataChip
                label={
                  String(j.estado || '').toUpperCase() === 'FINALIZADO'
                    ? 'Jornada cerrada'
                    : 'Solo opera jornadas en curso'
                }
                icon={
                  String(j.estado || '').toUpperCase() === 'FINALIZADO'
                    ? 'lock-closed-outline'
                    : 'information-circle-outline'
                }
                tone="slate"
              />
            )}
          </View>
        </View>
      </PressableCard>
          {esAdmin ? (
            <View style={{ marginTop: 8, marginBottom: 8, gap: 8 }}>
              <PrimaryButton
                label="Editar jornada / GPS"
                icon="create-outline"
                fullWidth
                onPress={() => abrirEditar(j)}
              />
              <PrimaryButton
                label="Ver / operar clases"
                icon="school-outline"
                variant="ghost"
                fullWidth
                onPress={() => abrirClases(j)}
              />
            </View>
          ) : null}
      </View>
    );
  }

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
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => void cargar()} tintColor={c.primary} />
      }
      ListHeaderComponent={
        <>
          <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 12 }}>
            Hoy: {fmtFecha(new Date().toISOString())}.
            {esAdmin
              ? ' Como administrador puede editar cualquier jornada (ubicación y GPS) o abrir sus clases.'
              : ' Toque una jornada en curso para operar clases.'}
          </ScaledText>
          {err ? (
            <ScaledText baseSize={14} style={{ color: c.danger, marginBottom: 12 }}>
              {err}
            </ScaledText>
          ) : null}
          {operables.length > 0 ? (
            <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800', marginBottom: 8 }}>
              En operación ({operables.length})
            </ScaledText>
          ) : null}
        </>
      }
      data={operables}
      keyExtractor={(j) => j._id}
      renderItem={({ item }) => renderItem(item, true)}
      ListEmptyComponent={
        !operables.length ? (
          <EmptyState
            icon="sunny-outline"
            title="No hay jornadas en curso hoy"
            hint="Si la jornada está programada para hoy, aparecerá aquí cuando el sistema la active."
          />
        ) : null
      }
      ListFooterComponent={
        otras.length ? (
          <View style={{ marginTop: 16 }}>
            <ScaledText baseSize={15} style={{ color: c.textSoft, fontWeight: '700', marginBottom: 8 }}>
              Otras del día ({otras.length})
            </ScaledText>
            {otras.map((j) => renderItem(j, false))}
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  jornadaCard: {
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
  statsRow: { marginTop: 12, flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  statNum: { fontWeight: '800', marginTop: 2 },
  statLabel: { fontWeight: '600' },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaAlertBanner: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  metaAlertText: { fontWeight: '800', flex: 1 },
});
