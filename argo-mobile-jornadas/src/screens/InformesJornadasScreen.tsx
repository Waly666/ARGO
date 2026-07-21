import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { CatalogPickerField } from '../components/CatalogPickerField';
import { EmptyState } from '../components/EmptyState';
import { IconInput } from '../components/IconInput';
import {
  DonutChart,
  KPI_TONES,
  VerticalBarsChart,
} from '../components/InformeCharts';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScaledText } from '../components/ScaledText';
import { SurfaceCard } from '../components/SurfaceCard';
import {
  descargarInformeContratoPdf,
  informeDashboardContrato,
  listarContratos,
  type InformeContratoAlcance,
} from '../api/jornadasApi';
import type { CatalogOption } from '../catalogos/alumnoCatalogos';
import type { InformeDashboardDto } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { compartirArchivoBytes } from '../services/fileShare';
import { puedeGestionarJornadas, tienePermiso } from '../utils/permisos';
import { themeColors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

export default function InformesJornadasScreen() {
  const nav = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { state } = useAuth();
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const user = state.status === 'signedIn' ? state.user : null;
  const puede =
    puedeGestionarJornadas(user?.permisos, user?.rol, user?.rolNombre) ||
    tienePermiso(user?.permisos, ['jornadas.ver', 'jornadas.gestionar', '*']);

  const [contratosOpts, setContratosOpts] = useState<CatalogOption[]>([]);
  const [idContrato, setIdContrato] = useState('');
  const [idJornada, setIdJornada] = useState('');
  const [idClase, setIdClase] = useState('');
  const [idPrograma, setIdPrograma] = useState('');
  const [idInstructor, setIdInstructor] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [data, setData] = useState<InformeDashboardDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const skipFilterEffect = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (!puede) {
        Alert.alert('Sin permiso', 'No tiene acceso a informes de jornadas.');
        nav.goBack();
        return;
      }
      void (async () => {
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
          /* opcional */
        }
      })();
    }, [puede, nav]),
  );

  const cargarCon = useCallback(
    async (args: {
      idContrato: string;
      idJornada?: string;
      idClase?: string;
      idPrograma?: string;
      idInstructor?: string;
      desde?: string;
      hasta?: string;
    }) => {
      const id = args.idContrato.trim();
      if (!id) {
        setData(null);
        setErr('Seleccione un contrato para ver el dashboard e imprimir PDF.');
        return;
      }
      setLoading(true);
      setErr(null);
      try {
        const r = await informeDashboardContrato(id, {
          idJornada: args.idJornada || undefined,
          idClase: args.idClase || undefined,
          idPrograma: args.idPrograma || undefined,
          idInstructor: args.idInstructor || undefined,
          desde: args.desde?.trim() || undefined,
          hasta: args.hasta?.trim() || undefined,
        });
        setData(r);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'No se pudo cargar el dashboard');
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (skipFilterEffect.current) {
      skipFilterEffect.current = false;
      return;
    }
    if (!idContrato) return;
    void cargarCon({
      idContrato,
      idJornada,
      idClase,
      idPrograma,
      idInstructor,
      desde,
      hasta,
    });
    // Fechas se aplican con el botón; aquí solo reaccionamos a pickers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idJornada, idClase, idPrograma, idInstructor]);

  function onContratoChange(v: string) {
    skipFilterEffect.current = true;
    setIdContrato(v);
    setIdJornada('');
    setIdClase('');
    setIdPrograma('');
    setIdInstructor('');
    setDesde('');
    setHasta('');
    setData(null);
    if (v) void cargarCon({ idContrato: v });
  }

  function limpiarFiltros() {
    skipFilterEffect.current = true;
    setIdJornada('');
    setIdClase('');
    setIdPrograma('');
    setIdInstructor('');
    setDesde('');
    setHasta('');
    if (idContrato) void cargarCon({ idContrato });
  }

  function aplicarFechas() {
    if (desde && hasta && desde > hasta) {
      Alert.alert('Fechas', 'La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }
    if (!idContrato) return;
    void cargarCon({
      idContrato,
      idJornada,
      idClase,
      idPrograma,
      idInstructor,
      desde,
      hasta,
    });
  }

  const optsJornada = useMemo<CatalogOption[]>(
    () => [
      { value: '', label: 'Todas las jornadas' },
      ...(data?.opciones?.jornadas || []).map((o) => ({ value: o.value, label: o.label })),
    ],
    [data],
  );

  const optsClase = useMemo<CatalogOption[]>(() => {
    const list = (data?.opciones?.clases || []).filter(
      (o) => !idJornada || o.idJornada === idJornada,
    );
    return [
      { value: '', label: 'Todas las clases' },
      ...list.map((o) => ({ value: o.value, label: o.label })),
    ];
  }, [data, idJornada]);

  const optsPrograma = useMemo<CatalogOption[]>(
    () => [
      { value: '', label: 'Todos los programas' },
      ...(data?.opciones?.programas || []).map((o) => ({ value: o.value, label: o.label })),
    ],
    [data],
  );

  const optsInstructor = useMemo<CatalogOption[]>(
    () => [
      { value: '', label: 'Todos los instructores' },
      ...(data?.opciones?.instructores || []).map((o) => ({ value: o.value, label: o.label })),
    ],
    [data],
  );

  async function exportarPdf(
    alcance: InformeContratoAlcance,
    opts?: {
      idJornada?: string;
      idClase?: string;
      idPrograma?: string;
      idInstructor?: string | number | null;
    },
  ) {
    const id = idContrato.trim();
    if (!id) {
      Alert.alert('Contrato', 'Seleccione un contrato.');
      return;
    }
    const idJ = opts?.idJornada ?? (idJornada || undefined);
    const idC = opts?.idClase ?? (idClase || undefined);
    const idP = opts?.idPrograma ?? (idPrograma || undefined);
    const idI =
      opts?.idInstructor !== undefined ? opts.idInstructor : idInstructor || undefined;

    if (alcance === 'jornada' && !idJ) {
      Alert.alert('PDF', 'Elija una jornada (filtro o fila) para generar ese PDF.');
      return;
    }
    if (alcance === 'clase' && !idC) {
      Alert.alert('PDF', 'Elija una clase (filtro o fila) para generar ese PDF.');
      return;
    }
    if (alcance === 'programa' && !idP) {
      Alert.alert('PDF', 'Elija un programa (filtro o fila) para generar ese PDF.');
      return;
    }

    setExportando(true);
    try {
      const { bytes, contentType, fileName } = await descargarInformeContratoPdf(id, {
        alcance,
        idJornada: idJ || undefined,
        idClase: idC || undefined,
        idPrograma: idP || undefined,
        idInstructor: idI ?? undefined,
        desde: desde.trim() || undefined,
        hasta: hasta.trim() || undefined,
      });
      const nombre =
        fileName && /\.pdf$/i.test(fileName)
          ? fileName
          : `informe_${alcance}_${new Date().toISOString().slice(0, 10)}.pdf`;
      await compartirArchivoBytes(bytes, nombre, contentType || 'application/pdf');
    } catch (e) {
      Alert.alert('PDF', e instanceof Error ? e.message : 'No se pudo generar el PDF');
    } finally {
      setExportando(false);
    }
  }

  if (!puede) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const kpis = data?.kpis;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <ScaledText baseSize={14} style={{ color: c.textSoft, marginBottom: 12 }}>
        Igual que en APP Jornadas → pestaña Informes del contrato: dashboard, filtros y PDF.
      </ScaledText>

      <SurfaceCard>
        <CatalogPickerField
          label="Contrato *"
          required
          options={contratosOpts}
          value={idContrato}
          onChange={onContratoChange}
          placeholder="Seleccione contrato…"
        />
        {data?.contrato ? (
          <ScaledText
            baseSize={13}
            style={{ color: c.primaryDark, marginTop: 8, fontWeight: '700' }}
          >
            {data.contrato.codContrato || '—'} · {data.contrato.cliente || 'Empresa contratante'}
          </ScaledText>
        ) : null}
      </SurfaceCard>

      {idContrato ? (
        <SurfaceCard style={{ marginTop: 12 }}>
          <View style={styles.headRow}>
            <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800', flex: 1 }}>
              Filtros del dashboard
            </ScaledText>
            <PrimaryButton label="Limpiar" variant="ghost" onPress={limpiarFiltros} />
          </View>
          <CatalogPickerField
            label="Jornada"
            options={optsJornada}
            value={idJornada}
            onChange={(v) => {
              setIdJornada(v);
              setIdClase('');
            }}
          />
          <View style={{ height: 8 }} />
          <CatalogPickerField label="Clase" options={optsClase} value={idClase} onChange={setIdClase} />
          <View style={{ height: 8 }} />
          <CatalogPickerField
            label="Programa"
            options={optsPrograma}
            value={idPrograma}
            onChange={setIdPrograma}
          />
          <View style={{ height: 8 }} />
          <CatalogPickerField
            label="Instructor"
            options={optsInstructor}
            value={idInstructor}
            onChange={setIdInstructor}
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Fecha inicial (AAAA-MM-DD)"
            icon="calendar-outline"
            value={desde}
            onChangeText={setDesde}
            autoCapitalize="none"
            placeholder="Opcional"
          />
          <View style={{ height: 8 }} />
          <IconInput
            label="Fecha final (AAAA-MM-DD)"
            icon="calendar-outline"
            value={hasta}
            onChangeText={setHasta}
            autoCapitalize="none"
            placeholder="Opcional"
          />
          <View style={{ height: 10 }} />
          <PrimaryButton
            label={loading ? 'Actualizando…' : 'Aplicar fechas / actualizar'}
            icon="refresh-outline"
            fullWidth
            disabled={loading || exportando}
            onPress={aplicarFechas}
          />
        </SurfaceCard>
      ) : null}

      {idContrato && data ? (
        <SurfaceCard style={{ marginTop: 12 }}>
          <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800', marginBottom: 10 }}>
            Exportar PDF
          </ScaledText>
          <PrimaryButton
            label={exportando ? 'Generando…' : 'PDF del contrato'}
            icon="document-outline"
            fullWidth
            disabled={loading || exportando}
            onPress={() => void exportarPdf('contrato')}
          />
          <View style={{ height: 8 }} />
          <PrimaryButton
            label={exportando ? 'Generando…' : 'Desarrollo general'}
            icon="layers-outline"
            variant="ghost"
            fullWidth
            disabled={loading || exportando}
            onPress={() => void exportarPdf('desarrollo-general', { idInstructor: null })}
          />
          <View style={{ height: 8 }} />
          <PrimaryButton
            label={
              exportando
                ? 'Generando…'
                : idInstructor
                  ? 'Desarrollo del instructor'
                  : 'Desarrollo por instructores'
            }
            icon="people-outline"
            variant="ghost"
            fullWidth
            disabled={loading || exportando}
            onPress={() => void exportarPdf('instructor')}
          />
        </SurfaceCard>
      ) : null}

      {err ? (
        <ScaledText baseSize={14} style={{ color: c.danger, marginTop: 12 }}>
          {err}
        </ScaledText>
      ) : null}

      {loading && !data ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 24 }} />
      ) : null}

      {!idContrato && !loading ? (
        <EmptyState
          icon="stats-chart-outline"
          title="Seleccione un contrato"
          hint="Igual que en APP Jornadas → Informes: elija el contrato para ver cifras y PDF."
        />
      ) : null}

      {kpis ? (
        <View style={styles.kpiGrid}>
          {(
            [
              {
                l: 'Jornadas',
                v: String(kpis.jornadas),
                s: kpis.metaJornadas > 0 ? `meta ${kpis.metaJornadas}` : undefined,
                tone: 'sky' as const,
              },
              {
                l: 'Clases dictadas',
                v: `${kpis.clasesDictadas}/${kpis.clasesTotales}`,
                s: kpis.clasesEnProceso > 0 ? `${kpis.clasesEnProceso} en proceso` : undefined,
                tone: 'amber' as const,
              },
              {
                l: 'Alumnos capacitados',
                v: String(kpis.alumnosCapacitados),
                s: kpis.metaAlumnos > 0 ? `meta ${kpis.metaAlumnos}` : undefined,
                tone: 'emerald' as const,
              },
              {
                l: 'Alumnos certificados',
                v: String(kpis.alumnosCertificados),
                s: `${kpis.certificadosEmitidos} cert. emitidos`,
                tone: 'violet' as const,
              },
            ] as const
          ).map((k) => {
            const tone = KPI_TONES[k.tone];
            return (
              <View
                key={k.l}
                style={[
                  styles.kpi,
                  {
                    backgroundColor: highContrast ? c.accentSoft : tone.bg,
                    borderColor: highContrast ? c.border : tone.border,
                  },
                ]}
              >
                <ScaledText baseSize={11} style={{ color: c.textSoft, fontWeight: '700' }}>
                  {k.l}
                </ScaledText>
                <ScaledText
                  baseSize={18}
                  style={{
                    color: highContrast ? c.primaryDark : tone.fg,
                    fontWeight: '800',
                    marginTop: 4,
                  }}
                >
                  {k.v}
                </ScaledText>
                {k.s ? (
                  <ScaledText baseSize={11} style={{ color: c.textSoft, marginTop: 2 }}>
                    {k.s}
                  </ScaledText>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {data?.charts ? (
        <View style={{ marginTop: 4 }}>
          <VerticalBarsChart
            title="Alumnos por jornada"
            hint="Participación sobre el total del gráfico."
            items={data.charts.alumnosPorJornada || []}
            unit="alumnos"
            tone="sky"
          />
          <DonutChart
            title="Clases por estado"
            hint="Distribución de clases."
            items={data.charts.clasesPorEstado || []}
            unit="clases"
            kind="estado"
          />
          <DonutChart
            title="Alumnos por programa"
            hint="Capacitados por programa."
            items={data.charts.alumnosPorPrograma || []}
            unit="alumnos"
            kind="programa"
          />
          <VerticalBarsChart
            title="Clases por instructor"
            hint="Clases finalizadas por instructor."
            items={data.charts.clasesPorInstructor || []}
            unit="clases"
            tone="teal"
          />
        </View>
      ) : null}

      {data ? (
        <>
          <SurfaceCard style={{ marginBottom: 12 }}>
            <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800' }}>
              Por jornada
            </ScaledText>
            <ScaledText baseSize={12} style={{ color: c.textSoft, marginBottom: 8 }}>
              Capacitados y certificados · PDF por fila
            </ScaledText>
            {(data.porJornada || []).length === 0 ? (
              <ScaledText baseSize={13} style={{ color: c.textSoft }}>
                Sin jornadas con el filtro actual.
              </ScaledText>
            ) : (
              data.porJornada.map((j) => (
                <View key={j._id} style={[styles.rowCard, { borderColor: c.border }]}>
                  <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '800' }}>
                    {j.fechaLabel} · {j.municipio || '—'}
                  </ScaledText>
                  <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
                    {j.estado || '—'} · {j.numClases} clases · {j.alumnosCapacitados} capacitados ·{' '}
                    {j.alumnosCertificados} cert.
                  </ScaledText>
                  <View style={{ marginTop: 8 }}>
                    <PrimaryButton
                      label="PDF jornada"
                      icon="download-outline"
                      variant="ghost"
                      disabled={exportando}
                      onPress={() => void exportarPdf('jornada', { idJornada: j._id })}
                    />
                  </View>
                </View>
              ))
            )}
          </SurfaceCard>

          <SurfaceCard style={{ marginBottom: 12 }}>
            <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800' }}>
              Por clase
            </ScaledText>
            <ScaledText baseSize={12} style={{ color: c.textSoft, marginBottom: 8 }}>
              Programa, instructor y alumnos · PDF por fila
            </ScaledText>
            {(data.porClase || []).length === 0 ? (
              <ScaledText baseSize={13} style={{ color: c.textSoft }}>
                Sin clases con el filtro actual.
              </ScaledText>
            ) : (
              data.porClase.map((cl) => (
                <View key={cl._id} style={[styles.rowCard, { borderColor: c.border }]}>
                  <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '800' }}>
                    {cl.fechaLabel || '—'} · {cl.programaNombre || 'Programa'}
                  </ScaledText>
                  <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
                    {cl.instructorNombre || '—'} · {cl.estado || '—'} · {cl.alumnosInscritos ?? 0}{' '}
                    alumnos · {cl.alumnosCertificados ?? 0} cert.
                  </ScaledText>
                  <View style={{ marginTop: 8 }}>
                    <PrimaryButton
                      label="PDF clase"
                      icon="download-outline"
                      variant="ghost"
                      disabled={exportando}
                      onPress={() =>
                        void exportarPdf('clase', { idClase: cl._id, idJornada: cl.idJornada })
                      }
                    />
                  </View>
                </View>
              ))
            )}
          </SurfaceCard>

          <SurfaceCard style={{ marginBottom: 12 }}>
            <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800' }}>
              Por programa
            </ScaledText>
            {(data.porPrograma || []).length === 0 ? (
              <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 8 }}>
                Sin programas.
              </ScaledText>
            ) : (
              data.porPrograma.map((p) => (
                <View
                  key={p.idPrograma || p.programaNombre}
                  style={[styles.rowCard, { borderColor: c.border }]}
                >
                  <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '800' }}>
                    {p.programaNombre}
                  </ScaledText>
                  <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
                    {p.clasesDictadas}/{p.numClases} dictadas · {p.alumnosCapacitados} capacitados ·{' '}
                    {p.alumnosCertificados} cert.
                  </ScaledText>
                  <View style={{ marginTop: 8 }}>
                    <PrimaryButton
                      label="PDF programa"
                      icon="download-outline"
                      variant="ghost"
                      disabled={exportando || !p.idPrograma}
                      onPress={() => void exportarPdf('programa', { idPrograma: p.idPrograma })}
                    />
                  </View>
                </View>
              ))
            )}
          </SurfaceCard>

          <SurfaceCard style={{ marginBottom: 24 }}>
            <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800' }}>
              Por instructor
            </ScaledText>
            {(data.porInstructor || []).length === 0 ? (
              <ScaledText baseSize={13} style={{ color: c.textSoft, marginTop: 8 }}>
                Sin instructores.
              </ScaledText>
            ) : (
              data.porInstructor.map((i) => (
                <View
                  key={`${i.instructorNombre}-${i.idEmpleadoInstructor ?? ''}`}
                  style={[styles.rowCard, { borderColor: c.border }]}
                >
                  <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '800' }}>
                    {i.instructorNombre}
                  </ScaledText>
                  <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 2 }}>
                    {i.clasesDictadas}/{i.numClases} dictadas · {i.alumnosCapacitados} capacitados
                  </ScaledText>
                  <View style={{ marginTop: 8 }}>
                    <PrimaryButton
                      label="PDF instructor"
                      icon="download-outline"
                      variant="ghost"
                      disabled={exportando || i.idEmpleadoInstructor == null}
                      onPress={() =>
                        void exportarPdf('instructor', {
                          idInstructor: i.idEmpleadoInstructor,
                        })
                      }
                    />
                  </View>
                </View>
              ))
            )}
          </SurfaceCard>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  headRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  kpiGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpi: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  rowCard: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 10,
  },
});
