import { EncuestaJornadaResultados } from '../../core/services/jornada-cap.service';

export interface EvalChartItem {
  label: string;
  value: number;
  pctBar: number;
  pctTotal?: number;
  color: string;
  sublabel?: string;
}

export interface EvalPieSlice {
  label: string;
  value: number;
  pct: number;
  color: string;
  path: string;
  labelX: number;
  labelY: number;
  showLabel: boolean;
}

export interface EvalDashKpis {
  respuestas: number;
  promedioGlobal: number | null;
  capacitaciones: number;
  instructores: number;
}

const PALETTE = [
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
];

const ASPECT_COLORS: Record<string, string> = {
  claridad: '#38bdf8',
  utilidad: '#34d399',
  instructor: '#a78bfa',
  organizacion: '#fbbf24',
  recomendaria: '#fb7185',
};

const SAT_COLORS: Record<string, string> = {
  Excelente: '#34d399',
  Buena: '#38bdf8',
  Regular: '#fbbf24',
  'Necesita mejorar': '#fb7185',
};

function donutSlicePath(cx: number, cy: number, r: number, rInner: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const xi0 = cx + rInner * Math.cos(a1);
  const yi0 = cy + rInner * Math.sin(a1);
  const xi1 = cx + rInner * Math.cos(a0);
  const yi1 = cy + rInner * Math.sin(a0);
  return [
    `M ${x0} ${y0}`,
    `A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`,
    `L ${xi0} ${yi0}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${xi1} ${yi1}`,
    'Z',
  ].join(' ');
}

function etiquetaSatisfaccion(prom: number): string {
  if (prom >= 4.5) return 'Excelente';
  if (prom >= 3.5) return 'Buena';
  if (prom >= 2.5) return 'Regular';
  return 'Necesita mejorar';
}

function truncLabel(text: string, max = 42): string {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function buildEvalDashKpis(res: EncuestaJornadaResultados | null): EvalDashKpis {
  if (!res) return { respuestas: 0, promedioGlobal: null, capacitaciones: 0, instructores: 0 };
  const proms: number[] = [];
  const instructores = new Set<string>();
  for (const f of res.filas || []) {
    for (const c of f.calificacionesCarpa || []) {
      if (c.promedio != null && Number.isFinite(Number(c.promedio))) {
        proms.push(Number(c.promedio));
      }
      if (c.instructorNombre) instructores.add(c.instructorNombre.trim());
    }
  }
  const promedioGlobal = proms.length
    ? Math.round((proms.reduce((a, b) => a + b, 0) / proms.length) * 100) / 100
    : null;
  return {
    respuestas: res.totalRespuestas ?? 0,
    promedioGlobal,
    capacitaciones: res.promediosCarpa?.length ?? 0,
    instructores: instructores.size,
  };
}

export function buildEvalAspectosChart(
  res: EncuestaJornadaResultados | null,
  aspectosDefault: Array<{ key: string; label: string }>,
): { items: EvalChartItem[]; max: number } {
  const aspectos = res?.aspectos?.length ? res.aspectos : aspectosDefault;
  if (!res?.filas?.length) return { items: [], max: 5 };

  const acum = new Map<string, { sum: number; n: number; label: string }>();
  for (const asp of aspectos) {
    acum.set(asp.key, { sum: 0, n: 0, label: asp.label });
  }
  for (const f of res.filas) {
    for (const c of f.calificacionesCarpa || []) {
      for (const asp of aspectos) {
        const v = Number(c.aspectos?.[asp.key]);
        if (v >= 1 && v <= 5) {
          const row = acum.get(asp.key)!;
          row.sum += v;
          row.n += 1;
        }
      }
    }
  }

  const items: EvalChartItem[] = aspectos.map((asp) => {
    const row = acum.get(asp.key)!;
    const value = row.n ? Math.round((row.sum / row.n) * 100) / 100 : 0;
    return {
      label: row.label,
      value,
      pctBar: Math.max(value > 0 ? 8 : 0, Math.round((value / 5) * 100)),
      color: ASPECT_COLORS[asp.key] || PALETTE[0],
    };
  });
  return { items, max: 5 };
}

export function buildEvalRankingChart(res: EncuestaJornadaResultados | null): {
  items: EvalChartItem[];
  max: number;
} {
  const rows = (res?.promediosCarpa || [])
    .filter((c) => c.promedioGeneral != null && Number.isFinite(Number(c.promedioGeneral)))
    .sort((a, b) => Number(b.promedioGeneral) - Number(a.promedioGeneral))
    .slice(0, 12);

  const max = 5;
  const items = rows.map((c, i) => {
    const value = Number(c.promedioGeneral);
    const prog = c.programaNombre || c.nombre || 'Programa';
    const inst = c.instructorNombre || 'Sin instructor';
    return {
      label: truncLabel(prog, 36),
      sublabel: inst,
      value,
      pctBar: Math.max(8, Math.round((value / max) * 100)),
      color: PALETTE[i % PALETTE.length],
    };
  });
  return { items, max };
}

export function buildEvalSatisfaccionPie(res: EncuestaJornadaResultados | null): {
  total: number;
  slices: EvalPieSlice[];
} {
  const counts = new Map<string, number>([
    ['Excelente', 0],
    ['Buena', 0],
    ['Regular', 0],
    ['Necesita mejorar', 0],
  ]);
  for (const f of res?.filas || []) {
    for (const c of f.calificacionesCarpa || []) {
      if (c.promedio == null || !Number.isFinite(Number(c.promedio))) continue;
      const bucket = etiquetaSatisfaccion(Number(c.promedio));
      counts.set(bucket, (counts.get(bucket) || 0) + 1);
    }
  }
  const list = [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .filter((x) => x.value > 0);
  const totalRaw = list.reduce((s, x) => s + x.value, 0);
  const total = totalRaw || 1;
  const cx = 50;
  const cy = 50;
  const r = 36;
  const rInner = 20;
  const rLabel = (r + rInner) / 2;
  let angle = -Math.PI / 2;
  const slices: EvalPieSlice[] = list.map((it, i) => {
    const pct = Math.round((it.value / total) * 1000) / 10;
    const sweep = (it.value / total) * Math.PI * 2;
    const a0 = angle;
    const a1 = angle + sweep;
    const aMid = a0 + sweep / 2;
    angle = a1;
    return {
      label: it.label,
      value: it.value,
      pct,
      color: SAT_COLORS[it.label] || PALETTE[i % PALETTE.length],
      path: donutSlicePath(cx, cy, r, rInner, a0, a1),
      labelX: cx + rLabel * Math.cos(aMid),
      labelY: cy + rLabel * Math.sin(aMid),
      showLabel: pct >= 10 || sweep >= 0.45,
    };
  });
  return { total: totalRaw, slices };
}

export interface EvalRadarPoint {
  key: string;
  label: string;
  value: number;
  x: number;
  y: number;
  axisX: number;
  axisY: number;
}

export function buildEvalRadar(
  res: EncuestaJornadaResultados | null,
  aspectosDefault: Array<{ key: string; label: string }>,
): { points: EvalRadarPoint[]; polygon: string; grid: string[] } {
  const { items } = buildEvalAspectosChart(res, aspectosDefault);
  const cx = 50;
  const cy = 50;
  const r = 38;
  const n = items.length || 1;
  const points: EvalRadarPoint[] = items.map((it, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const dist = (it.value / 5) * r;
    return {
      key: `asp-${i}`,
      label: it.label,
      value: it.value,
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
      axisX: cx + r * Math.cos(angle),
      axisY: cy + r * Math.sin(angle),
    };
  });
  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');
  const grid: string[] = [0.25, 0.5, 0.75, 1].map((scale) => {
    const ring = items.map((_, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const dist = scale * r;
      return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
    });
    return ring.join(' ');
  });
  return { points, polygon, grid };
}

export function formatEvalPct(n: number): string {
  if (!Number.isFinite(n)) return '0%';
  return `${Math.round(n * 10) / 10}%`;
}

export function formatEvalNota(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  return String(Math.round(Number(n) * 100) / 100);
}
