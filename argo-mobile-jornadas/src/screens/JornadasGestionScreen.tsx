import React, { useCallback, useMemo, useState } from 'react';
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
import { CatalogPickerField } from '../components/CatalogPickerField';
import { DataChip, type ChipTone } from '../components/DataChip';
import { EmptyState } from '../components/EmptyState';
import { IconInput } from '../components/IconInput';
import { PressableCard } from '../components/PressableCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { listarContratos, listarJornadas } from '../api/jornadasApi';
import type { CatalogOption } from '../catalogos/alumnoCatalogos';
import type { JornadaCap } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { fmtFecha, ymdLocal } from '../utils/jornadaUi';
import { puedeGestionarJornadas } from '../utils/permisos';
import { colors, themeColors } from '../theme/colors';
import { useAccessibility } from '../context/AccessibilityContext';
import type { RootStackParamList } from '../navigation/types';

function labelJornada(j: JornadaCap): string {
  const f = fmtFecha(j.fechaProgramacion);
  const muni = j.municipio || j.contratoLabel || j.codContrato || '';
  return `${f}${muni ? ` · ${muni}` : ''}`;
}

function estadoChip(estado?: string): {
  label: string;
  icon: 'play-circle' | 'checkmark-circle' | 'calendar-outline' | 'pause-circle-outline';
  tone: ChipTone;
  accent: string;
} {
  const e = String(estado || '').toUpperCase();
  if (e === 'EN PROCESO') {
    return { label: 'En curso', icon: 'play-circle', tone: 'mint', accent: colors.primary };
  }
  if (e === 'FINALIZADO') {
    return { label: 'Terminada', icon: 'checkmark-circle', tone: 'slate', accent: colors.pastelSlateFg };
  }
  if (e === 'INACTIVO') {
    return { label: 'Inactiva', icon: 'pause-circle-outline', tone: 'amber', accent: colors.pastelAmberFg };
  }
  return { label: 'Programada', icon: 'calendar-outline', tone: 'soft', accent: colors.primaryDark };
}

function daysAgoYmd(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return ymdLocal(d);
}

export default function JornadasGestionScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const user = state.status === 'signedIn' ? state.user : null;
  const esAdmin = puedeGestionarJornadas(user?.permisos, user?.rol, user?.rolNombre);

  const [rows, setRows] = useState<JornadaCap[]>([]);
  const [contratosOpts, setContratosOpts] = useState<CatalogOption[]>([]);
  const [idContrato, setIdContrato] = useState('');
  const [desde, setDesde] = useState(() => daysAgoYmd(30));
  const [hasta, setHasta] = useState(() => ymdLocal());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const cargarContratos = useCallback(async () => {
    try {
      const list = await listarContratos();
      setContratosOpts(
        (list || [])
          .filter((x) => x._id)
          .map((x) => ({
            value: x._id,
            label: `${x.codContrato || '—'} — ${x.nombreComercial || x.razoSocial || 'Contrato'}`,
          })),
      );
    } catch {
      /* filtros opcionales */
    }
  }, []);

  const cargar = useCallback(async () => {
    setErr(null);
    try {
      const r = await listarJornadas({
        idContrato: idContrato || undefined,
        desde: desde.trim() || undefined,
        hasta: hasta.trim() || undefined,
      });
      setRows(r || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al cargar');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [idContrato, desde, hasta]);

  useFocusEffect(
    useCallback(() => {
      if (!esAdmin) {
        nav.replace('JornadasHoy');
        return;
      }
      setLoading(true);
      void cargarContratos();
      void cargar();
    }, [esAdmin, nav, cargar, cargarContratos]),
  );

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) =>
      String(b.fechaProgramacion || '').localeCompare(String(a.fechaProgramacion || '')),
    );
  }, [rows]);

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

  function onTap(j: JornadaCap) {
    Alert.alert(labelJornada(j), '¿Qué desea hacer?', [
      { text: 'Editar jornada / GPS', onPress: () => abrirEditar(j) },
      { text: 'Ver / operar clases', onPress: () => abrirClases(j) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  if (!esAdmin) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.primary} />
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
      data={sorted}
      keyExtractor={(j) => j._id}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => void cargar()} tintColor={c.primary} />
      }
      ListHeaderComponent={
        <View style={{ marginBottom: 12 }}>
          <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 12 }}>
            Admin: liste jornadas por rango de fechas, edite o cree nuevas.
          </ScaledText>
          <PrimaryButton
            label="Nueva jornada"
            icon="add-circle-outline"
            fullWidth
            onPress={() => nav.navigate('CrearJornada', {})}
          />
          <View style={{ height: 12 }} />
          <CatalogPickerField
            label="Contrato (opcional)"
            options={[{ value: '', label: 'Todos los contratos' }, ...contratosOpts]}
            value={idContrato}
            onChange={setIdContrato}
            placeholder="Todos"
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Desde (AAAA-MM-DD)"
            icon="calendar-outline"
            value={desde}
            onChangeText={setDesde}
            placeholder="2026-01-01"
            autoCapitalize="none"
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Hasta (AAAA-MM-DD)"
            icon="calendar-outline"
            value={hasta}
            onChangeText={setHasta}
            placeholder={ymdLocal()}
            autoCapitalize="none"
          />
          <View style={{ height: 10 }} />
          <PrimaryButton
            label="Buscar"
            icon="search-outline"
            variant="ghost"
            fullWidth
            onPress={() => {
              setLoading(true);
              void cargar();
            }}
          />
          {err ? (
            <ScaledText baseSize={14} style={{ color: c.danger, marginTop: 10 }}>
              {err}
            </ScaledText>
          ) : null}
          <ScaledText
            baseSize={15}
            style={{ color: c.text, fontWeight: '800', marginTop: 14, marginBottom: 4 }}
          >
            Jornadas ({sorted.length})
          </ScaledText>
        </View>
      }
      renderItem={({ item: j }) => {
        const est = estadoChip(j.estado);
        const lugar = [j.municipio, j.direccion].filter(Boolean).join(' · ') || 'Sin ubicación';
        return (
          <View style={{ marginBottom: 12 }}>
            <PressableCard onPress={() => onTap(j)} cardStyle={styles.card}>
              <View style={[styles.accent, { backgroundColor: est.accent }]} />
              <View style={styles.body}>
                <DataChip label={est.label} icon={est.icon} tone={est.tone} />
                <ScaledText
                  baseSize={16}
                  style={{ color: c.text, fontWeight: '800', marginTop: 10 }}
                  numberOfLines={2}
                >
                  {`${(j.codContrato || 'Contrato').trim()} — ${formatoIdClaseCorto(j._id)}`}
                </ScaledText>
                <ScaledText baseSize={13} style={{ color: c.primaryDark, marginTop: 6 }}>
                  {fmtFecha(j.fechaProgramacion)} · {lugar}
                </ScaledText>
                <View style={styles.rowBtns}>
                  <PrimaryButton
                    label="Editar"
                    icon="create-outline"
                    style={{ flex: 1 }}
                    onPress={() => abrirEditar(j)}
                  />
                  <PrimaryButton
                    label="Clases"
                    icon="school-outline"
                    variant="ghost"
                    style={{ flex: 1 }}
                    onPress={() => abrirClases(j)}
                  />
                </View>
              </View>
            </PressableCard>
          </View>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          title="Sin jornadas"
          hint="Ajuste el rango de fechas o cree una jornada nueva."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  card: { padding: 0, overflow: 'hidden', flexDirection: 'row' },
  accent: { width: 5 },
  body: { flex: 1, padding: 14 },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
