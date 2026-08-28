import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import { EmptyState } from '../../components/EmptyState';
import { ProgressBar } from '../../components/ProgressBar';
import { ScaledText } from '../../components/ScaledText';
import { ScreenBody } from '../../components/ScreenBody';
import { SurfaceCard } from '../../components/SurfaceCard';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { AULA_NAVY, AULA_NAVY_SOFT } from '../../config/appBranding';
import { useMisCursos } from '../../hooks/useMisCursos';
import type { CursoVirtual, IntentoEvalVirtual } from '../../api/types';
import { pctCurso } from '../../utils/cursoUtils';
import {
  claseNotaTone,
  clasesDetalle,
  cumpleCompletitud,
  cumpleNotaEval,
  cumpleRequisitosCurso,
  cursosParaPuntajes,
  estadoCursoPuntajes,
  fechaInicioCurso,
  fmtFechaIntento,
  intentosDe,
  intentosMaxEval,
  intentosRestantes,
  labelResultadoIntento,
  leccionesConNotaCount,
  mejorNota,
  notaMinima,
  notaTone,
  pctMinCompletitud,
  promedioLecciones,
  resumenPuntajesGlobal,
  sumaPuntajesLecciones,
  ultimaNotaEval,
  type NotaTone,
} from '../../utils/puntajesUtils';
import { layout, radii } from '../../theme/tokens';
import { space } from '../../theme/spacing';

type IonName = ComponentProps<typeof Ionicons>['name'];

const KPI_ITEMS: {
  key: keyof ReturnType<typeof resumenPuntajesGlobal>;
  label: string;
  icon: IonName;
  format: (v: number, rg: ReturnType<typeof resumenPuntajesGlobal>) => string;
  tint: 'violet' | 'cyan' | 'green' | 'amber' | 'rose';
}[] = [
  { key: 'cursos', label: 'Cursos matriculados', icon: 'library-outline', format: (v) => String(v), tint: 'violet' },
  {
    key: 'promedioAvance',
    label: 'Promedio de avance',
    icon: 'trending-up-outline',
    format: (v) => `${v}%`,
    tint: 'cyan',
  },
  {
    key: 'leccionesAprobadas',
    label: 'Lecciones aprobadas',
    icon: 'checkmark-circle-outline',
    format: (v, rg) => `${v}/${rg.leccionesTotal}`,
    tint: 'green',
  },
  {
    key: 'leccionesConNota',
    label: 'Lecciones con puntaje',
    icon: 'locate-outline',
    format: (v) => String(v),
    tint: 'amber',
  },
  {
    key: 'intentosEval',
    label: 'Intentos evaluación final',
    icon: 'flag-outline',
    format: (v) => String(v),
    tint: 'rose',
  },
];

export default function PuntajesPanel() {
  const c = useTheme();
  const { cursos, loading, reload } = useMisCursos();
  const resumen = useMemo(() => resumenPuntajesGlobal(cursos), [cursos]);
  const lista = useMemo(() => cursosParaPuntajes(cursos), [cursos]);

  return (
    <ScreenBody onRefresh={reload} refreshing={loading}>
      <LinearGradient
        colors={[AULA_NAVY, AULA_NAVY_SOFT, '#1A2240']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <ScaledText baseSize={11} style={styles.kicker}>
          HISTORIAL ACADÉMICO
        </ScaledText>
        <ScaledText baseSize={22} style={styles.heroTitle}>
          Mis puntajes
        </ScaledText>
        <ScaledText baseSize={13} style={styles.heroSub}>
          Avance, notas por lección y evaluación final de cada programa matriculado
        </ScaledText>
      </LinearGradient>

      {!loading && cursos.length === 0 ? (
        <EmptyState
          title="Sin cursos matriculados"
          subtitle="Matricúlese en un programa para ver su avance y puntajes"
          icon="stats-chart-outline"
        />
      ) : (
        <>
          <ScaledText baseSize={14} style={{ color: c.text, fontWeight: '800', marginBottom: space.sm }}>
            Resumen general
          </ScaledText>
          <View style={styles.kpiGrid}>
            {KPI_ITEMS.map((item) => (
              <KpiCard
                key={item.key}
                icon={item.icon}
                label={item.label}
                value={item.format(resumen[item.key] as number, resumen)}
                tint={item.tint}
              />
            ))}
          </View>

          {lista.map((curso, idx) => (
            <CursoPuntajesCard key={String(curso.idPrograma)} curso={curso} index={idx} />
          ))}
        </>
      )}
    </ScreenBody>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: IonName;
  label: string;
  value: string;
  tint: 'violet' | 'cyan' | 'green' | 'amber' | 'rose';
}) {
  const c = useTheme();
  const palette = kpiPalette(tint, c);
  return (
    <View style={[styles.kpiCard, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <View style={[styles.kpiIcon, { backgroundColor: palette.iconBg }]}>
        <Ionicons name={icon} size={18} color={palette.icon} />
      </View>
      <ScaledText baseSize={18} style={{ color: palette.value, fontWeight: '800', marginTop: 8 }}>
        {value}
      </ScaledText>
      <ScaledText baseSize={11} style={{ color: c.textSoft, marginTop: 4, lineHeight: 15 }}>
        {label}
      </ScaledText>
    </View>
  );
}

function CursoPuntajesCard({ curso, index }: { curso: CursoVirtual; index: number }) {
  const c = useTheme();
  const pct = pctCurso(curso);
  const minPct = pctMinCompletitud(curso);
  const prom = promedioLecciones(curso);
  const mn = mejorNota(curso);
  const un = ultimaNotaEval(curso);
  const clases = clasesDetalle(curso);
  const intentos = intentosDe(curso);
  const cardTint = index % 4;

  return (
    <SurfaceCard style={{ marginBottom: space.lg }} padding="md">
      <View style={styles.cardHead}>
        <View style={[styles.cardEmoji, { backgroundColor: cardAccent(cardTint, c).soft }]}>
          <ScaledText baseSize={20}>🎓</ScaledText>
        </View>
        <View style={{ flex: 1 }}>
          <ScaledText baseSize={16} style={{ color: c.text, fontWeight: '800' }} numberOfLines={2}>
            {curso.nombreProg}
          </ScaledText>
          <Capsule label={`Matriculado · ${fechaInicioCurso(curso)}`} tone="soft" />
        </View>
      </View>

      <View style={styles.badgeRow}>
        <Capsule label={estadoCursoPuntajes(curso)} tone={estadoTone(curso)} />
        {curso.progreso?.aprobado ? <Capsule label="Aprobado" tone="ok" /> : null}
        {curso.progreso?.certificadoEmitido ? <Capsule label="Certificado" tone="primary" /> : null}
      </View>

      <View style={[styles.block, { backgroundColor: c.accentSoft }]}>
        <View style={styles.blockHead}>
          <ScaledText baseSize={13} style={{ color: c.text, fontWeight: '700' }}>
            📊 Avance general del curso
          </ScaledText>
          <Capsule label={`${Math.round(pct)}%`} tone="primary" />
        </View>
        <ProgressBar pct={pct} showPct={false} height={10} />
        <View style={styles.hintRow}>
          <ScaledText baseSize={12} style={{ color: c.textSoft, flex: 1 }}>
            Mínimo exigido: {Math.round(minPct)}%
          </ScaledText>
          <Capsule label={cumpleCompletitud(curso) ? 'Cumple avance' : 'Falta avance'} tone={cumpleCompletitud(curso) ? 'ok' : 'warn'} />
        </View>
      </View>

      <ScaledText baseSize={13} style={{ color: c.text, fontWeight: '700', marginTop: space.md, marginBottom: space.sm }}>
        Indicadores del curso
      </ScaledText>
      <View style={styles.metricsGrid}>
        <Metric icon="checkmark-circle-outline" label="Lecciones aprobadas" value={`${curso.progreso?.clasesAprobadas ?? 0}/${curso.progreso?.totalClases ?? clases.length}`} tone="ok" />
        <Metric icon="locate-outline" label="Con puntaje" value={String(leccionesConNotaCount(curso))} tone="primary" />
        <Metric icon="trending-up-outline" label="Promedio lecciones" value={prom != null ? `${Math.round(prom)}%` : '—'} tone="primary" />
        <Metric icon="star-outline" label="Suma lecciones" value={`${Math.round(sumaPuntajesLecciones(curso))} pts`} tone="warn" />
        <Metric icon="trophy-outline" label="Mejor evaluación" value={mn != null ? `${Math.round(mn)}%` : '—'} tone={mn != null ? notaTone(mn, notaMinima(curso)) : 'soft'} />
        <Metric icon="create-outline" label="Última evaluación" value={un != null ? `${Math.round(un)}%` : '—'} tone={un != null ? notaTone(un, notaMinima(curso)) : 'soft'} />
        <Metric icon="refresh-outline" label="Intentos evaluación" value={`${curso.progreso?.intentosEval ?? intentos.length}/${intentosMaxEval(curso)}`} tone="primary" />
        <Metric icon="school-outline" label="Nota mínima" value={`${Math.round(notaMinima(curso))}%`} tone="soft" />
      </View>

      <View style={[styles.block, { backgroundColor: c.bgSoft, marginTop: space.md }]}>
        <ScaledText baseSize={13} style={{ color: c.text, fontWeight: '700', marginBottom: space.sm }}>
          ✔️ Requisitos para aprobar
        </ScaledText>
        <CheckRow
          left={`Avance ≥ ${Math.round(minPct)}%`}
          right={cumpleCompletitud(curso) ? '✓ Cumple' : `Actual ${Math.round(pct)}%`}
          ok={cumpleCompletitud(curso)}
        />
        <CheckRow
          left={`Evaluación ≥ ${Math.round(notaMinima(curso))}%`}
          right={
            cumpleNotaEval(curso)
              ? '✓ Cumple'
              : mn != null
                ? `Mejor ${Math.round(mn)}%`
                : 'Sin intentos'
          }
          ok={cumpleNotaEval(curso)}
          warn={!cumpleNotaEval(curso) && mn != null}
        />
        <CheckRow
          left="Intentos restantes"
          right={
            cumpleRequisitosCurso(curso)
              ? 'Cumple requisitos'
              : curso.reglas?.puedeReintentar
                ? 'Puede reintentar'
                : intentosRestantes(curso) <= 0
                  ? 'Agotados'
                  : String(intentosRestantes(curso))
          }
          ok={cumpleRequisitosCurso(curso)}
          warn={intentosRestantes(curso) <= 0 && !cumpleRequisitosCurso(curso)}
        />
      </View>

      <View style={{ marginTop: space.md }}>
        <ScaledText baseSize={13} style={{ color: c.text, fontWeight: '700', marginBottom: space.sm }}>
          📚 Detalle por lección
        </ScaledText>
        {clases.map((cl) => (
          <View key={cl.numero} style={[styles.lessonRow, { borderColor: c.border }]}>
            <ScaledText baseSize={12} style={{ color: c.textSoft, width: 72 }}>
              Lección {cl.numero}
            </ScaledText>
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <View style={[styles.lessonTrack, { backgroundColor: c.borderLight }]}>
                <View
                  style={[
                    styles.lessonFill,
                    {
                      width: `${Math.min(100, cl.pct)}%`,
                      backgroundColor: toneColor(claseNotaTone(cl.pct), c).text,
                    },
                  ]}
                />
              </View>
            </View>
            <Capsule
              label={cl.pct > 0 ? `${Math.round(cl.pct)}%` : '—'}
              tone={cl.pct > 0 ? claseNotaTone(cl.pct) : 'soft'}
              small
            />
            <View style={{ width: 78, alignItems: 'flex-end' }}>
              {cl.aprobada ? (
                <Capsule label="Aprobada" tone="ok" small />
              ) : cl.pct > 0 ? (
                <Capsule label="En proceso" tone="warn" small />
              ) : (
                <Capsule label="Sin intentar" tone="soft" small />
              )}
            </View>
          </View>
        ))}
        <View style={[styles.lessonFooter, { backgroundColor: c.accentSoft }]}>
          <Capsule label={`${curso.progreso?.clasesAprobadas ?? 0} aprobadas`} tone="ok" small />
          <Capsule label={`${leccionesConNotaCount(curso)} con nota`} tone="warn" small />
          <Capsule label={`${Math.round(sumaPuntajesLecciones(curso))} pts`} tone="low" small />
        </View>
      </View>

      {intentos.length > 0 ? (
        <View style={{ marginTop: space.md }}>
          <ScaledText baseSize={13} style={{ color: c.text, fontWeight: '700', marginBottom: space.sm }}>
            🏁 Evaluación final — historial
          </ScaledText>
          {intentos.map((it, i) => (
            <IntentoRow key={`${it.numero ?? i}-${it.fecha ?? i}`} curso={curso} intento={it} index={i} />
          ))}
        </View>
      ) : null}
    </SurfaceCard>
  );
}

function IntentoRow({ curso, intento, index }: { curso: CursoVirtual; intento: IntentoEvalVirtual; index: number }) {
  const c = useTheme();
  const label = labelResultadoIntento(curso, intento);
  const ok = intento.aprobado;
  return (
    <View style={[styles.intentoRow, { borderColor: c.border }]}>
      <ScaledText baseSize={12} style={{ color: c.textSoft, width: 28 }}>
        #{intento.numero ?? index + 1}
      </ScaledText>
      <Capsule label={`${Math.round(intento.nota)}%`} tone={notaTone(intento.nota, notaMinima(curso))} small />
      <ScaledText baseSize={12} style={{ color: c.textSoft, width: 52, textAlign: 'center' }}>
        {intento.pctCompletitud != null ? `${Math.round(intento.pctCompletitud)}%` : '—'}
      </ScaledText>
      <Capsule label={label} tone={ok ? 'ok' : label.includes('Avance') ? 'warn' : 'low'} small />
      <ScaledText baseSize={11} style={{ color: c.textSoft, flex: 1, textAlign: 'right' }} numberOfLines={1}>
        {fmtFechaIntento(intento.fecha)}
      </ScaledText>
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: IonName;
  label: string;
  value: string;
  tone: NotaTone | 'soft' | 'primary' | 'warn' | 'ok' | 'low';
}) {
  const c = useTheme();
  const pal = toneColor(tone, c);
  return (
    <View style={[styles.metric, { backgroundColor: pal.bg }]}>
      <Ionicons name={icon} size={16} color={pal.text} />
      <ScaledText baseSize={10} style={{ color: c.textSoft, marginTop: 6, lineHeight: 13 }}>
        {label}
      </ScaledText>
      <ScaledText baseSize={14} style={{ color: pal.text, fontWeight: '800', marginTop: 2 }}>
        {value}
      </ScaledText>
    </View>
  );
}

function CheckRow({
  left,
  right,
  ok,
  warn,
}: {
  left: string;
  right: string;
  ok?: boolean;
  warn?: boolean;
}) {
  const c = useTheme();
  return (
    <View style={styles.checkRow}>
      <Capsule label={left} tone="soft" small />
      <Capsule label={right} tone={ok ? 'ok' : warn ? 'warn' : 'low'} small />
    </View>
  );
}

function Capsule({
  label,
  tone,
  small,
}: {
  label: string;
  tone: NotaTone | 'soft' | 'primary' | 'warn' | 'ok' | 'low';
  small?: boolean;
}) {
  const c = useTheme();
  const pal = toneColor(tone, c);
  return (
    <View style={[styles.capsule, { backgroundColor: pal.bg, borderColor: pal.border }, small && styles.capsuleSm]}>
      <ScaledText baseSize={small ? 10 : 11} style={{ color: pal.text, fontWeight: '700' }} numberOfLines={1}>
        {label}
      </ScaledText>
    </View>
  );
}

function estadoTone(curso: CursoVirtual): NotaTone | 'soft' | 'primary' | 'ok' | 'warn' {
  if (curso.progreso?.certificadoEmitido) return 'primary';
  if (curso.progreso?.aprobado) return 'ok';
  if (pctCurso(curso) > 0) return 'warn';
  return 'soft';
}

function cardAccent(i: number, c: ThemeColors) {
  const list = [
    { soft: c.accentSoft, main: c.primary },
    { soft: '#EDE9FE', main: '#6366F1' },
    { soft: c.warnSoft, main: c.warn },
    { soft: c.dangerSoft, main: c.danger },
  ];
  return list[i % list.length];
}

function kpiPalette(tint: 'violet' | 'cyan' | 'green' | 'amber' | 'rose', c: ThemeColors) {
  const map = {
    violet: { bg: c.accentSoft, border: `${c.primary}33`, iconBg: `${c.primary}22`, icon: c.primary, value: c.primary },
    cyan: { bg: '#ECFEFF', border: '#22D3EE44', iconBg: '#22D3EE22', icon: '#0891B2', value: '#0891B2' },
    green: { bg: c.okSoft, border: `${c.ok}33`, iconBg: `${c.ok}22`, icon: c.ok, value: c.ok },
    amber: { bg: c.warnSoft, border: `${c.warn}44`, iconBg: `${c.warn}22`, icon: c.warn, value: c.warn },
    rose: { bg: c.dangerSoft, border: `${c.danger}33`, iconBg: `${c.danger}22`, icon: c.danger, value: c.danger },
  };
  return map[tint];
}

function toneColor(tone: NotaTone | 'soft' | 'primary' | 'warn' | 'ok' | 'low', c: ThemeColors) {
  switch (tone) {
    case 'ok':
      return { bg: c.okSoft, border: `${c.ok}44`, text: c.ok };
    case 'mid':
    case 'warn':
      return { bg: c.warnSoft, border: `${c.warn}44`, text: c.warn };
    case 'low':
      return { bg: c.dangerSoft, border: `${c.danger}44`, text: c.danger };
    case 'primary':
      return { bg: c.accentSoft, border: `${c.primary}44`, text: c.primary };
    default:
      return { bg: c.bgSoft, border: c.border, text: c.textSoft };
  }
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii.xl,
    padding: layout.screen,
    marginBottom: space.lg,
  },
  kicker: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroTitle: { color: '#fff', fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.88)', marginTop: 8, lineHeight: 20 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: space.lg },
  kpiCard: {
    width: '47%',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: space.md,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHead: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  cardEmoji: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.md },
  block: { borderRadius: radii.md, padding: space.md, marginTop: space.md },
  blockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space.sm, flexWrap: 'wrap' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: {
    width: '47%',
    borderRadius: radii.md,
    padding: space.sm,
    minHeight: 78,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lessonTrack: { height: 6, borderRadius: 99, overflow: 'hidden' },
  lessonFill: { height: 6, borderRadius: 99 },
  lessonFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: space.sm,
    borderRadius: radii.md,
    marginTop: space.sm,
  },
  intentoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
  },
  capsule: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  capsuleSm: { paddingHorizontal: 8, paddingVertical: 3, marginTop: 0 },
});
