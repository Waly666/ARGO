import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { ScaledText } from './ScaledText';
import { SurfaceCard } from './SurfaceCard';
import type { InformeDashboardChartItem } from '../api/types';
import { themeColors } from '../theme/colors';
import { useAccessibility } from '../context/AccessibilityContext';

/** Misma paleta que contrato-informes-dashboard (frontend). */
export const CHART_PALETTE = [
  '#38bdf8',
  '#34d399',
  '#a78bfa',
  '#818cf8',
  '#fb7185',
  '#2dd4bf',
  '#60a5fa',
  '#c084fc',
  '#f472b6',
  '#4ade80',
] as const;

export const CHART_ESTADO: Record<string, string> = {
  Finalizadas: '#34d399',
  'En proceso': '#38bdf8',
  Programadas: '#a78bfa',
};

export function formatPct(n: number): string {
  if (!Number.isFinite(n)) return '0%';
  const rounded = Math.round(n * 10) / 10;
  return `${rounded}%`;
}

type BarItem = InformeDashboardChartItem & {
  value: number;
  pctAltura: number;
  pctTotal: number;
  color: string;
};

type SliceItem = {
  label: string;
  value: number;
  pct: number;
  color: string;
  path: string;
  labelX: number;
  labelY: number;
  showLabel: boolean;
};

function buildBarras(
  items: InformeDashboardChartItem[],
  tone: 'sky' | 'teal' = 'sky',
): { total: number; items: BarItem[] } {
  const list = (items || []).filter((x) => Number(x.value) >= 0).slice(0, 10);
  const values = list.map((x) => Number(x.value) || 0);
  const total = values.reduce((s, n) => s + n, 0);
  const max = Math.max(1, ...values, 0);
  return {
    total,
    items: list.map((it, i) => {
      const value = Number(it.value) || 0;
      return {
        ...it,
        value,
        pctAltura: Math.max(4, Math.round((value / max) * 100)),
        pctTotal: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
        color:
          tone === 'teal'
            ? CHART_PALETTE[(i + 4) % CHART_PALETTE.length]
            : CHART_PALETTE[i % CHART_PALETTE.length],
      };
    }),
  };
}

function donutSlicePath(
  cx: number,
  cy: number,
  r: number,
  rInner: number,
  a0: number,
  a1: number,
): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const xi0 = cx + rInner * Math.cos(a1);
  const yi0 = cy + rInner * Math.sin(a1);
  const xi1 = cx + rInner * Math.cos(a0);
  const yi1 = cy + rInner * Math.sin(a0);
  if (Math.abs(a1 - a0) >= Math.PI * 2 - 1e-6) {
    const mid = a0 + Math.PI;
    const xm = cx + r * Math.cos(mid);
    const ym = cy + r * Math.sin(mid);
    const xim = cx + rInner * Math.cos(mid);
    const yim = cy + rInner * Math.sin(mid);
    return [
      `M ${x0} ${y0}`,
      `A ${r} ${r} 0 1 1 ${xm} ${ym}`,
      `A ${r} ${r} 0 1 1 ${x0} ${y0}`,
      `L ${xi1} ${yi1}`,
      `A ${rInner} ${rInner} 0 1 0 ${xim} ${yim}`,
      `A ${rInner} ${rInner} 0 1 0 ${xi1} ${yi1}`,
      'Z',
    ].join(' ');
  }
  return [
    `M ${x0} ${y0}`,
    `A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`,
    `L ${xi0} ${yi0}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${xi1} ${yi1}`,
    'Z',
  ].join(' ');
}

function buildTorta(
  items: InformeDashboardChartItem[],
  kind: 'estado' | 'programa' = 'programa',
): { total: number; slices: SliceItem[] } {
  const list = (items || []).filter((x) => Number(x.value) > 0).slice(0, 8);
  const totalRaw = list.reduce((s, x) => s + (Number(x.value) || 0), 0);
  const total = totalRaw || 1;
  const cx = 50;
  const cy = 50;
  const r = 36;
  const rInner = 20;
  const rLabel = (r + rInner) / 2;
  let angle = -Math.PI / 2;
  const slices = list.map((it, i) => {
    const value = Number(it.value) || 0;
    const pct = Math.round((value / total) * 1000) / 10;
    const sweep = (value / total) * Math.PI * 2;
    const a0 = angle;
    const a1 = angle + sweep;
    const aMid = a0 + sweep / 2;
    angle = a1;
    const color =
      kind === 'estado'
        ? CHART_ESTADO[it.label] || CHART_PALETTE[i % CHART_PALETTE.length]
        : CHART_PALETTE[i % CHART_PALETTE.length];
    return {
      label: it.label,
      value,
      pct,
      color,
      path: donutSlicePath(cx, cy, r, rInner, a0, a1),
      labelX: cx + rLabel * Math.cos(aMid),
      labelY: cy + rLabel * Math.sin(aMid),
      showLabel: pct >= 8 || sweep >= 0.45,
    };
  });
  return { total: totalRaw, slices };
}

export function VerticalBarsChart({
  title,
  hint,
  items,
  unit,
  tone = 'sky',
}: {
  title: string;
  hint: string;
  items: InformeDashboardChartItem[];
  unit: string;
  tone?: 'sky' | 'teal';
}) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const chart = useMemo(() => buildBarras(items, tone), [items, tone]);

  return (
    <SurfaceCard style={styles.card}>
      <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800' }}>
        {title}
      </ScaledText>
      <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 4, marginBottom: 12, lineHeight: 17 }}>
        {hint} Total del gráfico: {chart.total} {unit}.
      </ScaledText>
      {chart.items.length === 0 ? (
        <ScaledText baseSize={13} style={{ color: c.textSoft }}>
          Sin datos
        </ScaledText>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.vbars}>
              {chart.items.map((it) => {
                const barH = Math.max(4, Math.round((TRACK_H * it.pctAltura) / 100));
                return (
                  <View key={it.label} style={styles.vbarCol}>
                    <View style={styles.vbarVal}>
                      <ScaledText baseSize={12} style={{ color: c.text, fontWeight: '800' }}>
                        {it.value}
                      </ScaledText>
                      <ScaledText baseSize={10} style={{ color: c.textSoft, fontWeight: '600' }}>
                        {formatPct(it.pctTotal)}
                      </ScaledText>
                    </View>
                    <View
                      style={[
                        styles.vbarTrack,
                        {
                          height: TRACK_H,
                          backgroundColor: highContrast ? c.border : '#e2e8f0',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.vbarFill,
                          { height: barH, backgroundColor: it.color },
                        ]}
                      />
                    </View>
                    <ScaledText
                      baseSize={10}
                      style={{ color: c.textSoft, fontWeight: '600', textAlign: 'center' }}
                      numberOfLines={2}
                    >
                      {it.label}
                    </ScaledText>
                  </View>
                );
              })}
            </View>
          </ScrollView>
          <View style={[styles.table, { borderTopColor: c.border }]}>
            {chart.items.map((it) => (
              <View key={`row-${it.label}`} style={styles.tableRow}>
                <View style={[styles.dot, { backgroundColor: it.color }]} />
                <ScaledText baseSize={12} style={{ color: c.text, flex: 1, fontWeight: '600' }} numberOfLines={1}>
                  {it.label}
                </ScaledText>
                <ScaledText baseSize={12} style={{ color: c.text, fontWeight: '800', width: 36, textAlign: 'right' }}>
                  {it.value}
                </ScaledText>
                <ScaledText
                  baseSize={12}
                  style={{ color: c.textSoft, fontWeight: '700', width: 48, textAlign: 'right' }}
                >
                  {formatPct(it.pctTotal)}
                </ScaledText>
              </View>
            ))}
            <View style={[styles.tableRow, styles.tableFoot, { borderTopColor: c.border }]}>
              <ScaledText baseSize={12} style={{ color: c.text, flex: 1, fontWeight: '800' }}>
                Total
              </ScaledText>
              <ScaledText baseSize={12} style={{ color: c.text, fontWeight: '800', width: 36, textAlign: 'right' }}>
                {chart.total}
              </ScaledText>
              <ScaledText
                baseSize={12}
                style={{ color: c.textSoft, fontWeight: '700', width: 48, textAlign: 'right' }}
              >
                100%
              </ScaledText>
            </View>
          </View>
        </>
      )}
    </SurfaceCard>
  );
}

export function DonutChart({
  title,
  hint,
  items,
  unit,
  kind = 'programa',
}: {
  title: string;
  hint: string;
  items: InformeDashboardChartItem[];
  unit: string;
  kind?: 'estado' | 'programa';
}) {
  const { highContrast } = useAccessibility();
  const c = themeColors(highContrast);
  const chart = useMemo(() => buildTorta(items, kind), [items, kind]);

  return (
    <SurfaceCard style={styles.card}>
      <ScaledText baseSize={15} style={{ color: c.text, fontWeight: '800' }}>
        {title}
      </ScaledText>
      <ScaledText baseSize={12} style={{ color: c.textSoft, marginTop: 4, marginBottom: 12, lineHeight: 17 }}>
        {hint} Total: {chart.total} {unit}.
      </ScaledText>
      {chart.slices.length === 0 ? (
        <ScaledText baseSize={13} style={{ color: c.textSoft }}>
          Sin datos
        </ScaledText>
      ) : (
        <>
          <View style={styles.pieWrap}>
            <View style={styles.pieVisual}>
              <Svg viewBox="0 0 100 100" width={160} height={160}>
                {chart.slices.map((s) => (
                  <Path key={s.label} d={s.path} fill={s.color} />
                ))}
                {chart.slices.map((s) =>
                  s.showLabel ? (
                    <SvgText
                      key={`${s.label}-lbl`}
                      x={s.labelX}
                      y={s.labelY}
                      fill="#0f172a"
                      fontSize="6.5"
                      fontWeight="700"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {formatPct(s.pct)}
                    </SvgText>
                  ) : null,
                )}
              </Svg>
              <View style={styles.pieCenter} pointerEvents="none">
                <ScaledText baseSize={18} style={{ color: c.text, fontWeight: '800' }}>
                  {chart.total}
                </ScaledText>
                <ScaledText baseSize={11} style={{ color: c.textSoft, fontWeight: '600' }}>
                  {unit}
                </ScaledText>
              </View>
            </View>
            <View style={styles.legend}>
              {chart.slices.map((s) => (
                <View key={`leg-${s.label}`} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: s.color }]} />
                  <ScaledText
                    baseSize={12}
                    style={{ color: c.text, flex: 1, fontWeight: '600' }}
                    numberOfLines={2}
                  >
                    {s.label}
                  </ScaledText>
                  <ScaledText baseSize={12} style={{ color: c.text, fontWeight: '800' }}>
                    {s.value}
                  </ScaledText>
                  <ScaledText baseSize={11} style={{ color: c.textSoft, fontWeight: '700', marginLeft: 6 }}>
                    {formatPct(s.pct)}
                  </ScaledText>
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.table, { borderTopColor: c.border }]}>
            {chart.slices.map((s) => (
              <View key={`t-${s.label}`} style={styles.tableRow}>
                <View style={[styles.dot, { backgroundColor: s.color }]} />
                <ScaledText baseSize={12} style={{ color: c.text, flex: 1, fontWeight: '600' }} numberOfLines={1}>
                  {s.label}
                </ScaledText>
                <ScaledText baseSize={12} style={{ color: c.text, fontWeight: '800', width: 36, textAlign: 'right' }}>
                  {s.value}
                </ScaledText>
                <ScaledText
                  baseSize={12}
                  style={{ color: c.textSoft, fontWeight: '700', width: 48, textAlign: 'right' }}
                >
                  {formatPct(s.pct)}
                </ScaledText>
              </View>
            ))}
            <View style={[styles.tableRow, styles.tableFoot, { borderTopColor: c.border }]}>
              <ScaledText baseSize={12} style={{ color: c.text, flex: 1, fontWeight: '800' }}>
                Total
              </ScaledText>
              <ScaledText baseSize={12} style={{ color: c.text, fontWeight: '800', width: 36, textAlign: 'right' }}>
                {chart.total}
              </ScaledText>
              <ScaledText
                baseSize={12}
                style={{ color: c.textSoft, fontWeight: '700', width: 48, textAlign: 'right' }}
              >
                100%
              </ScaledText>
            </View>
          </View>
        </>
      )}
    </SurfaceCard>
  );
}

/** KPIs con acentos sky / amber / emerald / violet como en el frontend. */
export const KPI_TONES = {
  sky: { bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.35)', fg: '#0284c7' },
  amber: { bg: 'rgba(251,191,36,0.14)', border: 'rgba(251,191,36,0.4)', fg: '#b45309' },
  emerald: { bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)', fg: '#047857' },
  violet: { bg: 'rgba(167,139,250,0.14)', border: 'rgba(167,139,250,0.4)', fg: '#6d28d9' },
} as const;

const TRACK_H = 110;

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  vbars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 4,
    paddingHorizontal: 2,
  },
  vbarCol: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  vbarVal: { alignItems: 'center', gap: 1, minHeight: 32 },
  vbarTrack: {
    width: 28,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  vbarFill: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  table: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tableFoot: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pieWrap: { alignItems: 'center', gap: 12 },
  pieVisual: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  pieCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: { width: '100%', gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
