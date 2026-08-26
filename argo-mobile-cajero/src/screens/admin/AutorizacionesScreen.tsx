import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  autorizarSolicitud,
  listarAutorizaciones,
  rechazarSolicitud,
  type SolicitudAutorizacion,
} from '../../api/autorizacionApi';
import { EmptyState } from '../../components/EmptyState';
import { ModuleScreenHero } from '../../components/ModuleScreenHero';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScaledText } from '../../components/ScaledText';
import { SearchField } from '../../components/SearchField';
import { SurfaceCard } from '../../components/SurfaceCard';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { themeColors } from '../../theme/colors';
import { fmtFecha } from '../../utils/formato';
import { etiquetaModulo, modulosCrudOrdenados, puedeAutorizarOperaciones } from '../../utils/crudPermiso';

const ESTADOS = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: '', label: 'Todos' },
  { value: 'ejecutada', label: 'Ejecutadas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'fallida', label: 'Fallidas' },
] as const;

function labelEstado(estado: string): string {
  switch (String(estado || '').toLowerCase()) {
    case 'pendiente':
      return 'Pendiente';
    case 'ejecutada':
      return 'Ejecutada';
    case 'rechazada':
      return 'Rechazada';
    case 'fallida':
      return 'Fallida';
    case 'caducada':
      return 'Caducada';
    default:
      return estado || '—';
  }
}

export default function AutorizacionesScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const permisos = state.status === 'signedIn' ? state.user.permisos ?? [] : [];
  const puedeVer = puedeAutorizarOperaciones(permisos);
  const modulos = useMemo(() => modulosCrudOrdenados(), []);

  const [items, setItems] = useState<SolicitudAutorizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgError, setMsgError] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [filtroModulo, setFiltroModulo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [rechazoId, setRechazoId] = useState<number | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const pendientes = items.filter((s) => s.estado === 'pendiente').length;

  const itemsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => {
      const blob = [
        s.idSolicitud,
        s.modulo,
        etiquetaModulo(s.modulo),
        s.resumen,
        s.idEntidad,
        s.usuarioSolicita,
        s.nombreSolicita,
        s.motivo,
        s.motivoRechazo,
        s.estado,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [items, busqueda]);

  const cargar = useCallback(async () => {
    if (!puedeVer) return;
    setLoading(true);
    setMsg(null);
    try {
      const rows = await listarAutorizaciones({
        estado: filtroEstado || undefined,
        modulo: filtroModulo || undefined,
        limit: 150,
      });
      setItems(rows || []);
    } catch (e) {
      setMsgError(true);
      setMsg(e instanceof Error ? e.message : 'No se pudo cargar la bandeja.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroModulo, puedeVer]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  useEffect(() => {
    if (puedeVer) void cargar();
  }, [filtroEstado, filtroModulo, puedeVer]);

  function inform(texto: string, error = false) {
    setMsg(texto);
    setMsgError(error);
    setTimeout(() => setMsg((m) => (m === texto ? null : m)), 6000);
  }

  function autorizar(s: SolicitudAutorizacion) {
    Alert.alert(
      'Autorizar eliminación',
      `¿Autorizar y ejecutar la eliminación solicitada por ${s.nombreSolicita || s.usuarioSolicita || 'el usuario'}?\n\n${s.resumen || ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Autorizar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setProcesandoId(s.idSolicitud);
              try {
                await autorizarSolicitud(s.idSolicitud);
                inform('Eliminación autorizada y ejecutada.');
                await cargar();
              } catch (e) {
                inform(e instanceof Error ? e.message : 'No se pudo autorizar.', true);
              } finally {
                setProcesandoId(null);
              }
            })();
          },
        },
      ],
    );
  }

  async function confirmarRechazo() {
    if (rechazoId == null) return;
    setProcesandoId(rechazoId);
    try {
      await rechazarSolicitud(rechazoId, motivoRechazo.trim() || undefined);
      setRechazoId(null);
      setMotivoRechazo('');
      inform('Solicitud rechazada.');
      await cargar();
    } catch (e) {
      inform(e instanceof Error ? e.message : 'No se pudo rechazar.', true);
    } finally {
      setProcesandoId(null);
    }
  }

  if (!puedeVer) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, paddingTop: 24 }]}>
        <EmptyState
          icon="lock-closed-outline"
          title="Solo administradores"
          subtitle="Necesita permiso config.autorizaciones o config.roles para gestionar solicitudes de eliminación."
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom }]}>
        <View style={styles.pad}>
          <ModuleScreenHero
            title="Autorizaciones"
            subtitle="Solicitudes de eliminación enviadas por usuarios sin permiso directo"
            icon="shield-checkmark"
          />

          {pendientes > 0 ? (
            <SurfaceCard style={{ borderColor: '#f59e0b', backgroundColor: highContrast ? c.bgAlt : '#fffbeb' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="alert-circle" size={20} color="#d97706" />
                <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '700' }}>
                  {pendientes} pendiente{pendientes === 1 ? '' : 's'}
                </ScaledText>
              </View>
            </SurfaceCard>
          ) : null}

          {msg ? (
            <SurfaceCard
              style={{
                borderColor: msgError ? c.danger : '#22c55e',
                backgroundColor: msgError ? c.dangerBg : '#f0fdf4',
              }}
            >
              <ScaledText baseSize={14} style={{ color: msgError ? c.danger : '#166534' }}>
                {msg}
              </ScaledText>
            </SurfaceCard>
          ) : null}

          <ScaledText baseSize={12} style={{ color: c.textSoft, fontWeight: '600' }}>
            Estado
          </ScaledText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {ESTADOS.map((e) => (
              <PrimaryButton
                key={e.value || 'all'}
                label={e.label}
                variant={filtroEstado === e.value ? 'primary' : 'ghost'}
                onPress={() => setFiltroEstado(e.value)}
                style={styles.chipBtn}
              />
            ))}
          </ScrollView>

          <ScaledText baseSize={12} style={{ color: c.textSoft, fontWeight: '600' }}>
            Módulo
          </ScaledText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            <PrimaryButton
              label="Todos"
              variant={!filtroModulo ? 'primary' : 'ghost'}
              onPress={() => setFiltroModulo('')}
              style={styles.chipBtn}
            />
            {modulos.map((m) => (
              <PrimaryButton
                key={m.id}
                label={m.label}
                variant={filtroModulo === m.id ? 'primary' : 'ghost'}
                onPress={() => setFiltroModulo(m.id)}
                style={styles.chipBtn}
              />
            ))}
          </ScrollView>

          <SearchField value={busqueda} onChangeText={setBusqueda} placeholder="Resumen, usuario, motivo…" />
          <PrimaryButton
            label={loading ? 'Cargando…' : 'Actualizar'}
            icon="refresh"
            variant="ghost"
            disabled={loading}
            onPress={() => void cargar()}
            fullWidth
          />
        </View>

        {loading ? (
          <ScaledText baseSize={14} style={{ color: c.textSoft, textAlign: 'center', padding: 24 }}>
            Cargando solicitudes…
          </ScaledText>
        ) : !itemsFiltrados.length ? (
          <EmptyState
            icon="shield-outline"
            title="Sin solicitudes"
            subtitle={
              filtroEstado === 'pendiente'
                ? 'No hay autorizaciones pendientes en este momento.'
                : 'No hay registros que coincidan con los filtros.'
            }
          />
        ) : (
          <View style={styles.pad}>
            {itemsFiltrados.map((s) => (
              <SurfaceCard key={s.idSolicitud} style={styles.card}>
                <View style={styles.cardHead}>
                  <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800' }}>
                    #{s.idSolicitud} · {etiquetaModulo(s.modulo)}
                  </ScaledText>
                  <View style={[styles.estadoPill, estadoStyle(s.estado)]}>
                    <ScaledText baseSize={11} style={{ fontWeight: '700', color: estadoStyle(s.estado).color }}>
                      {labelEstado(s.estado)}
                    </ScaledText>
                  </View>
                </View>
                <ScaledText baseSize={14} style={{ color: c.text, marginTop: 6 }}>
                  {s.resumen || s.idEntidad}
                </ScaledText>
                <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 4 }}>
                  {fmtFecha(s.fechaSolicitud)} · {s.nombreSolicita || s.usuarioSolicita || '—'}
                </ScaledText>
                {s.motivo ? (
                  <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 6 }}>
                    Motivo: {s.motivo}
                  </ScaledText>
                ) : null}
                {s.motivoRechazo ? (
                  <ScaledText baseSize={12} style={{ color: c.danger, marginTop: 4 }}>
                    Rechazo: {s.motivoRechazo}
                  </ScaledText>
                ) : null}
                {s.errorEjecucion ? (
                  <ScaledText baseSize={12} style={{ color: c.danger, marginTop: 4 }}>
                    Error: {s.errorEjecucion}
                  </ScaledText>
                ) : null}

                {s.estado === 'pendiente' ? (
                  <View style={styles.actions}>
                    <PrimaryButton
                      label={procesandoId === s.idSolicitud ? '…' : 'Autorizar'}
                      icon="checkmark"
                      disabled={procesandoId === s.idSolicitud}
                      onPress={() => autorizar(s)}
                      style={{ flex: 1 }}
                    />
                    <PrimaryButton
                      label="Rechazar"
                      variant="danger"
                      disabled={procesandoId === s.idSolicitud}
                      onPress={() => {
                        setRechazoId(s.idSolicitud);
                        setMotivoRechazo('');
                      }}
                      style={{ flex: 1 }}
                    />
                  </View>
                ) : s.fechaResolucion ? (
                  <ScaledText baseSize={11} style={{ color: c.textSoft, marginTop: 8 }}>
                    Resuelto {fmtFecha(s.fechaResolucion)}
                    {s.nombreResuelve ? ` · ${s.nombreResuelve}` : ''}
                  </ScaledText>
                ) : null}
              </SurfaceCard>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={rechazoId != null} transparent animationType="slide" onRequestClose={() => setRechazoId(null)}>
        <View style={styles.modalBackdrop}>
          <SurfaceCard style={styles.modalCard}>
            <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '800', marginBottom: 8 }}>
              Rechazar solicitud
            </ScaledText>
            <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 10 }}>
              Motivo opcional para el solicitante.
            </ScaledText>
            <TextInput
              value={motivoRechazo}
              onChangeText={setMotivoRechazo}
              multiline
              placeholder="Motivo de rechazo…"
              placeholderTextColor={c.textSoft}
              style={[styles.textarea, { color: c.text, borderColor: c.border, backgroundColor: c.bgAlt }]}
            />
            <View style={{ gap: 8, marginTop: 12 }}>
              <PrimaryButton
                label={procesandoId === rechazoId ? 'Enviando…' : 'Confirmar rechazo'}
                variant="danger"
                disabled={procesandoId === rechazoId}
                onPress={() => void confirmarRechazo()}
                fullWidth
              />
              <PrimaryButton
                label="Cancelar"
                variant="ghost"
                disabled={!!procesandoId}
                onPress={() => setRechazoId(null)}
                fullWidth
              />
            </View>
          </SurfaceCard>
        </View>
      </Modal>
    </View>
  );
}

function estadoStyle(estado: string) {
  const e = String(estado || '').toLowerCase();
  if (e === 'ejecutada') return { backgroundColor: '#dcfce7', color: '#166534' };
  if (e === 'rechazada' || e === 'fallida') return { backgroundColor: '#fee2e2', color: '#991b1b' };
  if (e === 'caducada') return { backgroundColor: '#f1f5f9', color: '#475569' };
  return { backgroundColor: '#fef3c7', color: '#92400e' };
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  pad: { paddingHorizontal: 16, gap: 12, paddingTop: 12 },
  chips: { marginBottom: 4 },
  chipBtn: { marginRight: 8, paddingHorizontal: 4 },
  card: { marginBottom: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  estadoPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: { marginBottom: 8 },
  textarea: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
  },
});
