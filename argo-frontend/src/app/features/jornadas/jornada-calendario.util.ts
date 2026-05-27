/** Utilidades de calendario para jornadas (mes) y clases (semana por horas). */

export interface CeldaMes {
  fecha: Date | null;
  key: string;
  otroMes: boolean;
}

export interface DiaSemana {
  fecha: Date;
  key: string;
}

export interface LayoutHorario {
  topPct: number;
  heightPct: number;
  sinHorario: boolean;
}

const HORA_INICIO = 6;
const HORA_FIN = 21;
const HORAS_TOTAL = HORA_FIN - HORA_INICIO;

export function ymdLocal(iso?: string | Date | null): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** ¿La fecha cae en el día calendario actual del equipo? */
export function esFechaHoy(iso?: string | Date | null, hoy = ymdLocal(new Date())): boolean {
  const key = ymdLocal(iso);
  return !!key && key === hoy;
}

/** Día civil YYYY-MM-DD sin desfase UTC (fechas de contrato/jornada). */
export function ymdCalendario(iso?: string | Date | null): string {
  if (!iso) return '';
  if (typeof iso === 'string') {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(iso.trim());
    if (m) return m[1];
  }
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getUTCHours();
  if ((h === 0 || h === 12) && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    return d.toISOString().slice(0, 10);
  }
  return ymdLocal(d);
}

export function fmtFechaCalendario(iso?: string | Date | null): string {
  const ymd = ymdCalendario(iso);
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-');
  return `${Number(d)}/${Number(m)}/${y}`;
}

export function inicioMes(anio: number, mes: number): Date {
  return new Date(anio, mes, 1, 0, 0, 0, 0);
}

export function finMes(anio: number, mes: number): Date {
  return new Date(anio, mes + 1, 0, 23, 59, 59, 999);
}

/** Cuadrícula mensual empezando en lunes (incluye días visibles del mes anterior/siguiente). */
export function celdasMes(anio: number, mes: number): CeldaMes[] {
  const lastDay = new Date(anio, mes + 1, 0).getDate();
  const pad = (new Date(anio, mes, 1).getDay() + 6) % 7;
  const cells: CeldaMes[] = [];

  const prevLast = new Date(anio, mes, 0).getDate();
  for (let i = pad - 1; i >= 0; i--) {
    const fecha = new Date(anio, mes - 1, prevLast - i);
    cells.push({ fecha, key: ymdLocal(fecha), otroMes: true });
  }
  for (let d = 1; d <= lastDay; d++) {
    const fecha = new Date(anio, mes, d);
    cells.push({ fecha, key: ymdLocal(fecha), otroMes: false });
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    const fecha = new Date(anio, mes + 1, next++);
    cells.push({ fecha, key: ymdLocal(fecha), otroMes: true });
  }
  return cells;
}

/** Rango YYYY-MM-DD que cubre toda la cuadrícula visible del mes. */
export function rangoVisibleMes(anio: number, mes: number): { desde: string; hasta: string } {
  const cells = celdasMes(anio, mes).filter((c) => c.fecha);
  if (!cells.length) {
    return { desde: ymdLocal(inicioMes(anio, mes)), hasta: ymdLocal(finMes(anio, mes)) };
  }
  return { desde: ymdLocal(cells[0].fecha!), hasta: ymdLocal(cells[cells.length - 1].fecha!) };
}

export function agruparPorFecha<T>(items: T[], fn: (item: T) => string | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = fn(item);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

export function inicioSemana(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

export function finSemana(inicio: Date): Date {
  const d = new Date(inicio);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function diasSemana(inicio: Date): DiaSemana[] {
  const out: DiaSemana[] = [];
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(inicio);
    fecha.setDate(inicio.getDate() + i);
    out.push({ fecha, key: ymdLocal(fecha) });
  }
  return out;
}

export function horasSlots(): number[] {
  const slots: number[] = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) slots.push(h);
  return slots;
}

function minutosDesdeMedianoche(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

export function layoutHorarioClase(
  horaInicio?: string | null,
  horaFin?: string | null,
): LayoutHorario {
  const iniMin = minutosDesdeMedianoche(horaInicio);
  if (iniMin == null) {
    return { topPct: 0, heightPct: 0, sinHorario: true };
  }
  const finMin = minutosDesdeMedianoche(horaFin) ?? iniMin + 60;
  const start = HORA_INICIO * 60;
  const end = HORA_FIN * 60;
  const top = Math.max(0, iniMin - start);
  const bottom = Math.min(end - start, Math.max(iniMin + 30, finMin) - start);
  return {
    topPct: (top / (HORAS_TOTAL * 60)) * 100,
    heightPct: Math.max(((bottom - top) / (HORAS_TOTAL * 60)) * 100, 4),
    sinHorario: false,
  };
}

export function fmtMesAnio(anio: number, mes: number): string {
  return new Date(anio, mes, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export function fmtRangoSemana(inicio: Date): string {
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const a = inicio.toLocaleDateString('es-CO', opts);
  const b = fin.toLocaleDateString('es-CO', { ...opts, year: 'numeric' });
  return `${a} – ${b}`;
}

export function fmtDiaSemanaCorto(fecha: Date): string {
  return fecha.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Posición vertical (%) de la hora actual en la rejilla semanal, o null si fuera del rango. */
export function ahoraLineaTopPct(now = new Date()): number | null {
  const mins = now.getHours() * 60 + now.getMinutes();
  const start = HORA_INICIO * 60;
  const end = HORA_FIN * 60;
  if (mins < start || mins >= end) return null;
  return ((mins - start) / (HORAS_TOTAL * 60)) * 100;
}

export function esFinDeSemana(fecha: Date): boolean {
  const d = fecha.getDay();
  return d === 0 || d === 6;
}

export const DIAS_SEMANA_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
