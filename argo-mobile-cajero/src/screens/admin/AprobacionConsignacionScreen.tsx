import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  aprobarSolicitudConsignacion,
  listarSolicitudesConsignacion,
  rechazarSolicitudConsignacion,
  type SolicitudConsignacion,
} from '../../api/consignacionApi';
import { fetchCajaActivaFull } from '../../api/cajaApi';
import { EmptyState } from '../../components/EmptyState';
import { ModuleScreenHero } from '../../components/ModuleScreenHero';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScaledText } from '../../components/ScaledText';
import { SearchField } from '../../components/SearchField';
import { SurfaceCard } from '../../components/SurfaceCard';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { themeColors } from '../../theme/colors';
import type { RootStackParamList } from '../../navigation/types';
import { fmtFecha, fmtMoney, iniciales } from '../../utils/formato';
import { tienePermiso } from '../../utils/permisos';
import { uploadsUrl } from '../../utils/uploadsUrl';

type FiltroEstado = 'pendiente' | 'aprobada' | 'rechazada' | 'todos';

const FILTROS: { id: FiltroEstado; label: string }[] = [
  { id: 'pendiente', label: 'Por revisar' },
  { id: 'aprobada', label: 'Aprobadas' },
  { id: 'rechazada', label: 'Rechazadas' },
  { id: 'todos', label: 'Todas' },
];

function labelEstado(e?: string): string {
  const m: Record<string, string> = {
    pendiente: 'Por revisar',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
  };
  return m[String(e || '')] || e || '—';
}

export default function AprobacionConsignacionScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { state } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const permisos = state.status === 'signedIn' ? state.user.permisos ?? [] : [];
  const puedeVer = tienePermiso(permisos, 'caja.admin');

  const [estado, setEstado] = useState<FiltroEstado>('pendiente');
  const [q, setQ] = useState('');
  const [filas, setFilas] = useState<SolicitudConsignacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgError, setMsgError] = useState(false);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [modoRechazo, setModoRechazo] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [imgAmpliada, setImgAmpliada] = useState(false);

  const activa = useMemo(
    () => filas.find((f) => f.id === seleccionada) ?? null,
    [filas, seleccionada],
  );

  const cargar = useCallback(async () => {
    if (!puedeVer) return;
    setLoading(true);
    setMsg(null);
    try {
      const [rows, caja] = await Promise.all([
        listarSolicitudesConsignacion(estado, q || undefined),
        fetchCajaActivaFull().catch(() => null),
      ]);
      const list = rows || [];
      setFilas(list);
      setCajaAbierta(!!caja?.abierta && !!caja?.sesion);
      setSeleccionada((prev) => {
        if (prev && list.some((f) => f.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
      setModoRechazo(false);
    } catch {
      setMsgError(true);
      setMsg('No se pudo cargar el panel de consignaciones.');
      setFilas([]);
    } finally {
      setLoading(false);
    }
  }, [estado, q, puedeVer]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  useEffect(() => {
    if (puedeVer) void cargar();
  }, [estado, puedeVer]);

  async function aprobar(id: string) {
    const sol = filas.find((f) => f.id === id);
    if (!cajaAbierta) {
      setMsgError(true);
      setMsg('Debe abrir su caja antes de aprobar pagos del portal.');
      return;
    }
    Alert.alert(
      'Confirmar aprobación',
      sol
        ? `¿El comprobante de ${sol.nombreAlumno || sol.numDoc} por ${fmtMoney(sol.montoCop)} es correcto? Se generará el CI en su caja abierta.`
        : '¿Confirma que el comprobante es válido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: () => {
            void (async () => {
              setProcesando(id);
              setMsg(null);
              try {
                const r = await aprobarSolicitudConsignacion(id);
                setMsgError(false);
                setMsg(r.message || `Aprobado. Recibo ${r.numRecibo || ''}`.trim());
                await cargar();
              } catch (e) {
                setMsgError(true);
                setMsg(e instanceof Error ? e.message : 'No se pudo aprobar.');
              } finally {
                setProcesando(null);
              }
            })();
          },
        },
      ],
    );
  }

  async function confirmarRechazo() {
    const id = seleccionada;
    if (!id) return;
    const motivo = motivoRechazo.trim();
    if (!motivo) {
      setMsgError(true);
      setMsg('Escriba el motivo del rechazo. El alumno lo recibirá por correo.');
      return;
    }
    setProcesando(id);
    try {
      const r = await rechazarSolicitudConsignacion(id, motivo);
      setModoRechazo(false);
      setMotivoRechazo('');
      setMsgError(false);
      setMsg(r.message || 'Solicitud rechazada. Se notificó al alumno.');
      await cargar();
    } catch (e) {
      setMsgError(true);
      setMsg(e instanceof Error ? e.message : 'No se pudo rechazar.');
    } finally {
      setProcesando(null);
    }
  }

  if (!puedeVer) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, paddingTop: 24 }]}>
        <EmptyState
          icon="lock-closed-outline"
          title="Solo administradores de caja"
          subtitle="Necesita el permiso caja.admin para revisar consignaciones del portal aula virtual."
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 24 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pad}>
          <ModuleScreenHero
            title="Consignaciones portal"
            subtitle="Revise comprobantes de alumnos del aula virtual y apruebe o rechace"
            icon="card"
          />

          {!cajaAbierta ? (
            <SurfaceCard
              style={{
                ...styles.banner,
                borderColor: '#f59e0b',
                backgroundColor: highContrast ? c.bgAlt : '#fffbeb',
              }}
            >
              <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '700' }}>
                Abra su caja para aprobar pagos
              </ScaledText>
              <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 4 }}>
                Sin caja abierta solo puede consultar solicitudes.
              </ScaledText>
              <PrimaryButton
                label="Ir a Caja"
                icon="wallet-outline"
                variant="ghost"
                onPress={() => nav.navigate('Caja')}
                style={{ marginTop: 10, alignSelf: 'flex-start' }}
              />
            </SurfaceCard>
          ) : null}

          {msg ? (
            <SurfaceCard
              style={{
                ...styles.banner,
                borderColor: msgError ? c.danger : '#22c55e',
                backgroundColor: msgError ? c.dangerBg : '#f0fdf4',
              }}
            >
              <ScaledText baseSize={14} style={{ color: msgError ? c.danger : '#166534' }}>
                {msg}
              </ScaledText>
            </SurfaceCard>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {FILTROS.map((f) => (
              <Pressable
                key={f.id}
                onPress={() => {
                  if (estado !== f.id) {
                    setEstado(f.id);
                    setSeleccionada(null);
                  }
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: estado === f.id ? c.primary : c.card,
                    borderColor: estado === f.id ? c.primary : c.border,
                  },
                ]}
              >
                <ScaledText
                  baseSize={13}
                  style={{ color: estado === f.id ? '#fff' : c.text, fontWeight: '700' }}
                >
                  {f.label}
                </ScaledText>
              </Pressable>
            ))}
          </ScrollView>

          <SearchField value={q} onChangeText={setQ} placeholder="Documento o referencia…" />
          <PrimaryButton
            label={loading ? 'Buscando…' : 'Buscar / actualizar'}
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
        ) : !filas.length ? (
          <EmptyState
            icon="document-text-outline"
            title="Sin solicitudes"
            subtitle={
              estado === 'pendiente'
                ? 'Cuando un alumno envíe un comprobante desde el portal, aparecerá aquí.'
                : 'Pruebe otro filtro o limpie la búsqueda.'
            }
          />
        ) : (
          <View style={styles.pad}>
            {filas.map((f) => (
              <Pressable
                key={f.id}
                onPress={() => {
                  setSeleccionada(f.id);
                  setModoRechazo(false);
                  setImgAmpliada(false);
                }}
              >
                <SurfaceCard
                  style={{
                    ...styles.rowCard,
                    ...(seleccionada === f.id ? { borderColor: c.primary, borderWidth: 2 } : {}),
                  }}
                >
                  <View style={styles.rowTop}>
                    <View style={[styles.avatar, { backgroundColor: c.primary }]}>
                      <ScaledText baseSize={14} style={{ color: '#fff', fontWeight: '800' }}>
                        {iniciales(f.nombreAlumno, f.numDoc)}
                      </ScaledText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '700' }}>
                        {f.nombreAlumno || `Alumno ${f.numDoc}`}
                      </ScaledText>
                      <ScaledText baseSize={12} style={{ color: c.textSoft }}>
                        {f.nombreCurso}
                      </ScaledText>
                    </View>
                    <View style={[styles.estadoPill, estadoPillStyle(f.estado)]}>
                      <ScaledText baseSize={11} style={{ fontWeight: '700', color: estadoPillStyle(f.estado).color }}>
                        {labelEstado(f.estado)}
                      </ScaledText>
                    </View>
                  </View>
                  <ScaledText baseSize={13} style={{ color: c.text, marginTop: 8 }}>
                    {fmtMoney(f.montoCop)} · Ref. {f.referenciaBancaria || '—'}
                  </ScaledText>
                </SurfaceCard>
              </Pressable>
            ))}

            {activa ? (
              <SurfaceCard style={{ marginTop: 8 }}>
                <ScaledText baseSize={17} style={{ color: c.text, fontWeight: '800', marginBottom: 8 }}>
                  Detalle
                </ScaledText>
                <ScaledText baseSize={22} style={{ color: c.primary, fontWeight: '800', marginBottom: 12 }}>
                  {fmtMoney(activa.montoCop)}
                </ScaledText>

                {activa.urlComprobante ? (
                  <Pressable onPress={() => setImgAmpliada(true)}>
                    <Image
                      source={{ uri: uploadsUrl(activa.urlComprobante) }}
                      style={styles.comprobante}
                      resizeMode="contain"
                    />
                    <ScaledText baseSize={12} style={{ color: c.primary, marginTop: 6, textAlign: 'center' }}>
                      Tocar para ampliar
                    </ScaledText>
                  </Pressable>
                ) : (
                  <ScaledText baseSize={13} style={{ color: c.textSoft, marginBottom: 8 }}>
                    Sin imagen de comprobante.
                  </ScaledText>
                )}

                <View style={styles.dl}>
                  <DlRow label="Curso" value={activa.nombreCurso} c={c} />
                  <DlRow label="Medio" value={activa.medioEtiqueta} c={c} />
                  <DlRow label="Banco" value={activa.bancoNombre} c={c} />
                  <DlRow label="Referencia" value={activa.referenciaBancaria} c={c} />
                  <DlRow label="Enviado" value={fmtFecha(activa.fechaCreacion)} c={c} />
                  {activa.motivoRechazo ? (
                    <DlRow label="Motivo rechazo" value={activa.motivoRechazo} c={c} />
                  ) : null}
                </View>

                {activa.estado === 'pendiente' ? (
                  modoRechazo ? (
                    <View style={{ marginTop: 12, gap: 10 }}>
                      <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '700' }}>
                        Motivo del rechazo
                      </ScaledText>
                      <TextInput
                        value={motivoRechazo}
                        onChangeText={setMotivoRechazo}
                        multiline
                        placeholder="Explique al alumno qué está mal…"
                        placeholderTextColor={c.textSoft}
                        style={[
                          styles.textarea,
                          { color: c.text, borderColor: c.border, backgroundColor: c.bgAlt },
                        ]}
                      />
                      <PrimaryButton
                        label={procesando === activa.id ? 'Enviando…' : 'Confirmar rechazo'}
                        variant="danger"
                        disabled={procesando === activa.id}
                        onPress={() => void confirmarRechazo()}
                        fullWidth
                      />
                      <PrimaryButton
                        label="Cancelar"
                        variant="ghost"
                        disabled={!!procesando}
                        onPress={() => {
                          setModoRechazo(false);
                          setMotivoRechazo('');
                        }}
                        fullWidth
                      />
                    </View>
                  ) : (
                    <View style={{ marginTop: 14, gap: 10 }}>
                      <PrimaryButton
                        label={procesando === activa.id ? 'Procesando…' : 'Aprobar y generar recibo'}
                        icon="checkmark-circle"
                        disabled={procesando === activa.id || !cajaAbierta}
                        onPress={() => void aprobar(activa.id)}
                        fullWidth
                      />
                      <PrimaryButton
                        label="Rechazar"
                        variant="ghost"
                        disabled={!!procesando}
                        onPress={() => setModoRechazo(true)}
                        fullWidth
                      />
                    </View>
                  )
                ) : null}
              </SurfaceCard>
            ) : null}
          </View>
        )}
      </ScrollView>

      <Modal visible={imgAmpliada} transparent animationType="fade" onRequestClose={() => setImgAmpliada(false)}>
        <Pressable style={styles.lightbox} onPress={() => setImgAmpliada(false)}>
          <Pressable style={styles.lightboxClose} onPress={() => setImgAmpliada(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {activa?.urlComprobante ? (
            <Image
              source={{ uri: uploadsUrl(activa.urlComprobante) }}
              style={styles.lightboxImg}
              resizeMode="contain"
            />
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

function DlRow({ label, value, c }: { label: string; value?: string | null; c: ReturnType<typeof themeColors> }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <ScaledText baseSize={11} style={{ color: c.textSoft, fontWeight: '600' }}>
        {label}
      </ScaledText>
      <ScaledText baseSize={14} style={{ color: c.text }}>
        {value || '—'}
      </ScaledText>
    </View>
  );
}

function estadoPillStyle(estado?: string) {
  const e = String(estado || '');
  if (e === 'aprobada') return { backgroundColor: '#dcfce7', color: '#166534' };
  if (e === 'rechazada') return { backgroundColor: '#fee2e2', color: '#991b1b' };
  return { backgroundColor: '#fef3c7', color: '#92400e' };
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  pad: { paddingHorizontal: 16, gap: 12 },
  banner: { marginBottom: 4 },
  chips: { marginVertical: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  rowCard: { marginBottom: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comprobante: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  dl: { marginTop: 12 },
  textarea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
  },
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  lightboxClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 2,
  },
  lightboxImg: { width: '100%', height: '80%' },
});
