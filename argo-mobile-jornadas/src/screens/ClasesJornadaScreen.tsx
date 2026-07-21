import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { ClaseIdChip } from '../components/ClaseIdChip';
import { DataChip, estadoChipTone } from '../components/DataChip';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProgramaPicker } from '../components/ProgramaPicker';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import { useAuth } from '../context/AuthContext';
import { puedeGestionarJornadas } from '../utils/permisos';
import { crearClase, listarClases, programasJornadaCap } from '../api/jornadasApi';
import type { ClaseJornada, ProgramaJornada } from '../api/types';
import { UBICACIONES_CLASE } from '../config/appBranding';
import { themeColors } from '../theme/colors';
import { useAccessibility } from '../context/AccessibilityContext';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'ClasesJornada'>;

export default function ClasesJornadaScreen() {
  const route = useRoute<Route>();
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const { jornadaId, jornadaLabel, idContrato } = route.params;
  const user = state.status === 'signedIn' ? state.user : null;
  const esAdmin = puedeGestionarJornadas(user?.permisos, user?.rol, user?.rolNombre);

  const [clases, setClases] = useState<ClaseJornada[]>([]);
  const [programas, setProgramas] = useState<ProgramaJornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNueva, setModalNueva] = useState(false);
  const [progSel, setProgSel] = useState('');
  const [ubicSel, setUbicSel] = useState('Carpa');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [cls, progs] = await Promise.all([
        listarClases(jornadaId),
        programasJornadaCap(),
      ]);
      setClases(cls || []);
      setProgramas(progs || []);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudieron cargar las clases');
    } finally {
      setLoading(false);
    }
  }, [jornadaId]);

  // Recargar al entrar y al volver del detalle (p. ej. tras finalizar).
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  async function onCrearClase() {
    if (!progSel) {
      Alert.alert('Programa', 'Seleccione el programa de capacitación');
      return;
    }
    setGuardando(true);
    try {
      await crearClase({ idJornada: jornadaId, idPrograma: progSel, ubicacion: ubicSel });
      setModalNueva(false);
      setProgSel('');
      setUbicSel('Carpa');
      await cargar();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo crear la clase');
    } finally {
      setGuardando(false);
    }
  }

  if (loading && !clases.length) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        contentContainerStyle={styles.list}
        data={clases}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void cargar()} tintColor={c.primary} />}
        ListHeaderComponent={
          <>
            <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 8 }}>
              {jornadaLabel}
            </ScaledText>
            {!esAdmin ? (
              <ScaledText baseSize={12} style={{ color: c.textSoft, marginBottom: 12 }}>
                Ve clases programadas sin instructor y las que usted operó o finalizó.
              </ScaledText>
            ) : (
              <View style={{ marginBottom: 10 }}>
                <PrimaryButton
                  label="Editar ubicación / GPS de la jornada"
                  icon="navigate-outline"
                  variant="ghost"
                  fullWidth
                  onPress={() => nav.navigate('EditarJornada', { jornadaId })}
                />
              </View>
            )}
            <PrimaryButton
              label="Nueva clase"
              icon="add-circle-outline"
              onPress={() => setModalNueva(true)}
              fullWidth
            />
            <View style={{ height: 16 }} />
          </>
        }
        renderItem={({ item }) => {
          const est = String(item.estado || '').toUpperCase();
          const libre =
            est === 'PROGRAMADA' &&
            item.idEmpleadoInstructor == null &&
            !String(item.idUsuarioInstructor || '').trim();
          const estChip = estadoChipTone(item.estado);
          const finalizada = est === 'FINALIZADO';
          const enCurso = est === 'EN PROCESO';
          const accent = finalizada
            ? c.terminadaAccent
            : enCurso
              ? c.pastelSkyFg
              : libre
                ? c.pastelMintFg
                : c.pastelLavenderFg;
          const metaColor = finalizada
            ? c.terminadaTextSoft
            : enCurso
              ? c.pastelSkyFg
              : libre
                ? c.pastelMintFg
                : c.pastelLavenderFg;
          const titleColor = finalizada ? c.terminadaText : c.text;
          const horaIni = item.horaInicio
            ? new Date(item.horaInicio).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';
          const horaFin = item.horaFin
            ? new Date(item.horaFin).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';
          const horarioLabel =
            horaIni && horaFin ? `${horaIni} – ${horaFin}` : horaIni || null;

          let instructorChip: { label: string; icon: 'hand-left-outline' | 'person-outline' | 'checkmark-done-outline'; tone: 'mint' | 'deep' | 'soft' } | null =
            null;
          if (libre) {
            instructorChip = { label: 'Disponible', icon: 'hand-left-outline', tone: 'mint' };
          } else if (item.instructorNombre) {
            instructorChip = {
              label: item.instructorNombre,
              icon: est === 'FINALIZADO' ? 'checkmark-done-outline' : 'person-outline',
              tone: est === 'FINALIZADO' ? 'soft' : 'deep',
            };
          } else if (est !== 'PROGRAMADA') {
            instructorChip = {
              label: est === 'FINALIZADO' ? 'Cerrada' : 'En operación',
              icon: est === 'FINALIZADO' ? 'checkmark-done-outline' : 'person-outline',
              tone: 'soft',
            };
          }

          return (
            <Pressable
              onPress={() =>
                nav.navigate('ClaseDetalle', {
                  claseId: item._id,
                  jornadaLabel,
                  idContrato,
                })
              }
              style={({ pressed }) => ({
                marginBottom: 12,
                opacity: finalizada ? 0.92 : pressed ? 0.94 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              })}
            >
              <SurfaceCard style={styles.claseCard} terminada={finalizada}>
                <View style={[styles.cardAccent, { backgroundColor: accent }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <DataChip label={estChip.label} icon={estChip.icon} tone={estChip.tone} />
                    <ClaseIdChip id={item._id} />
                  </View>

                  <ScaledText
                    baseSize={17}
                    style={{
                      color: titleColor,
                      fontWeight: '800',
                      marginTop: 12,
                      lineHeight: 22,
                    }}
                    numberOfLines={2}
                  >
                    {item.programaNombre || item.idPrograma || 'Sin programa asignado'}
                  </ScaledText>

                  <View style={styles.metaBlock}>
                    {item.carpaNombre ? (
                      <View style={{ marginBottom: 4 }}>
                        <DataChip
                          label={item.carpaNombre}
                          icon="business-outline"
                          tone="pink"
                        />
                      </View>
                    ) : null}
                    <View style={styles.metaLine}>
                      <Ionicons name="location-outline" size={15} color={metaColor} />
                      <ScaledText baseSize={13} style={[styles.metaText, { color: metaColor }]}>
                        {item.ubicacion || '—'}
                      </ScaledText>
                    </View>
                    {horarioLabel ? (
                      <View style={styles.metaLine}>
                        <Ionicons name="time-outline" size={15} color={metaColor} />
                        <ScaledText baseSize={13} style={[styles.metaText, { color: metaColor }]}>
                          {horarioLabel}
                        </ScaledText>
                      </View>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.cardFooter,
                      {
                        borderTopColor: finalizada ? c.terminadaAccent : c.border,
                      },
                    ]}
                  >
                    {instructorChip ? (
                      <DataChip
                        label={instructorChip.label}
                        icon={instructorChip.icon}
                        tone={instructorChip.tone}
                      />
                    ) : (
                      <View />
                    )}
                    <View
                      style={[
                        styles.openBtn,
                        {
                          backgroundColor: finalizada
                            ? c.terminadaBgAlt
                            : enCurso
                              ? c.pastelSky
                              : libre
                                ? c.pastelMint
                                : c.pastelLavender,
                        },
                      ]}
                    >
                      <ScaledText
                        baseSize={12}
                        style={{
                          color: finalizada
                            ? c.terminadaText
                            : enCurso
                              ? c.pastelSkyFg
                              : libre
                                ? c.pastelMintFg
                                : c.pastelLavenderFg,
                          fontWeight: '800',
                        }}
                      >
                        {finalizada ? 'Ver' : 'Abrir'}
                      </ScaledText>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={
                          finalizada
                            ? c.terminadaText
                            : enCurso
                              ? c.pastelSkyFg
                              : libre
                                ? c.pastelMintFg
                                : c.pastelLavenderFg
                        }
                      />
                    </View>
                  </View>
                </View>
              </SurfaceCard>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="Sin clases visibles"
            hint={
              esAdmin
                ? 'Pulse «Nueva clase» para crear la primera.'
                : 'No hay clases programadas libres ni clases suyas en esta jornada.'
            }
          />
        }
      />

      <Modal visible={!!modalNueva} animationType="slide" transparent={true} onRequestClose={() => setModalNueva(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: c.card }]}>
            <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '800', marginBottom: 12 }}>
              Nueva clase
            </ScaledText>
            <ProgramaPicker
              programas={programas}
              value={progSel}
              onChange={setProgSel}
              disabled={guardando}
            />
            <ScaledText
              baseSize={14}
              style={{ color: c.textSoft, marginTop: 14, marginBottom: 8, fontWeight: '600' }}
            >
              Ubicación
            </ScaledText>
            <View style={styles.chipsWrap}>
              {UBICACIONES_CLASE.map((u) => {
                const sel = ubicSel === u;
                return (
                  <Pressable
                    key={u}
                    onPress={() => setUbicSel(u)}
                    style={[styles.chip, sel && { backgroundColor: c.primary, borderColor: c.primary }]}
                  >
                    <ScaledText baseSize={13} style={{ color: sel ? '#fff' : c.text }}>
                      {u}
                    </ScaledText>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ height: 16 }} />
            <PrimaryButton label="Crear clase" onPress={() => void onCrearClase()} disabled={guardando} fullWidth />
            <View style={{ height: 8 }} />
            <PrimaryButton label="Cancelar" variant="ghost" onPress={() => setModalNueva(false)} fullWidth />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  claseCard: {
    padding: 0,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardAccent: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    padding: 14,
    paddingLeft: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaBlock: {
    marginTop: 10,
    gap: 6,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontWeight: '600',
    flex: 1,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e4e1f0',
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
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e4e1f0',
    marginRight: 8,
    marginBottom: 8,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
