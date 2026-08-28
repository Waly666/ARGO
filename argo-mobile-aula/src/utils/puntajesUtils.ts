import type { ClaseProgresoVirtual, CursoVirtual, IntentoEvalVirtual } from '../api/types';
import { pctCurso } from './cursoUtils';

export type ResumenPuntajesGlobal = {
  cursos: number;
  cursosConActividad: number;
  promedioAvance: number;
  leccionesAprobadas: number;
  leccionesTotal: number;
  leccionesConNota: number;
  intentosEval: number;
};

export type NotaTone = 'ok' | 'mid' | 'low';

export function intentosDe(c: CursoVirtual): IntentoEvalVirtual[] {
  return c.progreso?.intentos ?? [];
}

export function clasesDetalle(c: CursoVirtual): ClaseProgresoVirtual[] {
  const total = Math.max(
    c.progreso?.totalClases ?? 0,
    ...(c.progreso?.clases ?? []).map((cl) => cl.numero),
    7,
  );
  const map = new Map((c.progreso?.clases ?? []).map((cl) => [cl.numero, cl]));
  const out: ClaseProgresoVirtual[] = [];
  for (let i = 1; i <= total; i++) {
    out.push(map.get(i) ?? { numero: i, pct: 0, aprobada: false });
  }
  return out;
}

export function clasesConNota(c: CursoVirtual): ClaseProgresoVirtual[] {
  return clasesDetalle(c).filter((cl) => cl.pct > 0);
}

export function leccionesConNotaCount(c: CursoVirtual): number {
  return clasesConNota(c).length;
}

export function promedioLecciones(c: CursoVirtual): number | null {
  const p = c.progreso?.promedioClases;
  return p != null ? p : null;
}

export function sumaPuntajesLecciones(c: CursoVirtual): number {
  return clasesDetalle(c).reduce((acc, cl) => acc + cl.pct, 0);
}

export function pctMinCompletitud(c: CursoVirtual): number {
  return c.reglas?.pctMinCompletitud ?? c.pctMinCompletitud ?? 80;
}

export function notaMinima(c: CursoVirtual): number {
  return c.reglas?.pctMinEvaluaciones ?? c.pctMinEvaluaciones ?? 60;
}

export function intentosMaxEval(c: CursoVirtual): number {
  return c.reglas?.intentosMaxEval ?? c.intentosMaxEval ?? 3;
}

export function intentosRestantes(c: CursoVirtual): number {
  return c.reglas?.intentosRestantes ?? Math.max(0, intentosMaxEval(c) - (c.progreso?.intentosEval ?? 0));
}

export function mejorNota(c: CursoVirtual): number | null {
  const p = c.progreso;
  if (p?.mejorNotaEval != null) return p.mejorNotaEval;
  const intentos = intentosDe(c);
  if (!intentos.length) return null;
  return Math.max(...intentos.map((i) => i.nota));
}

export function ultimaNotaEval(c: CursoVirtual): number | null {
  const p = c.progreso;
  if (p?.ultimaNotaEval != null && p.ultimaNotaEval > 0) return p.ultimaNotaEval;
  const intentos = intentosDe(c);
  if (!intentos.length) return null;
  return intentos[intentos.length - 1].nota;
}

export function tieneHistorialPuntajes(c: CursoVirtual): boolean {
  return (
    intentosDe(c).length > 0 ||
    clasesConNota(c).length > 0 ||
    c.progreso?.mejorNotaEval != null ||
    (c.progreso?.ultimaNotaEval != null && c.progreso.ultimaNotaEval > 0)
  );
}

export function cumpleCompletitud(c: CursoVirtual): boolean {
  if (c.reglas?.cumpleCompletitud != null) return c.reglas.cumpleCompletitud;
  return pctCurso(c) >= pctMinCompletitud(c);
}

export function cumpleNotaEval(c: CursoVirtual): boolean {
  if (c.reglas?.cumpleNota != null) return c.reglas.cumpleNota;
  const mn = mejorNota(c);
  return mn != null && mn >= notaMinima(c);
}

export function cumpleRequisitosCurso(c: CursoVirtual): boolean {
  if (c.progreso?.aprobado) return true;
  return cumpleCompletitud(c) && cumpleNotaEval(c);
}

export function estadoCursoPuntajes(c: CursoVirtual): string {
  if (c.progreso?.certificadoEmitido) return 'Certificado emitido';
  if (c.progreso?.aprobado) return 'Aprobado';
  if (pctCurso(c) > 0 || tieneHistorialPuntajes(c)) return 'En progreso';
  return 'Sin iniciar';
}

export function notaClaseAprobada(): number {
  return 70;
}

export function notaTone(nota: number, min = 60): NotaTone {
  if (nota >= min) return 'ok';
  if (nota >= min - 15) return 'mid';
  return 'low';
}

export function claseNotaTone(pct: number): NotaTone {
  if (pct >= notaClaseAprobada()) return 'ok';
  if (pct >= 50) return 'mid';
  return 'low';
}

export function labelResultadoIntento(c: CursoVirtual, it: IntentoEvalVirtual): string {
  if (it.aprobado) return 'Aprobó';
  if (it.motivoNoAprobado === 'avance_insuficiente') return 'Avance insuficiente';
  if (it.motivoNoAprobado === 'nota_insuficiente') return 'Nota insuficiente';
  if (it.motivoNoAprobado === 'nota_y_avance') return 'Nota y avance bajos';
  const minNota = notaMinima(c);
  const minAvance = pctMinCompletitud(c);
  const pct = it.pctCompletitud ?? 0;
  if (it.nota >= minNota && pct < minAvance) return 'Avance insuficiente';
  return 'No aprobó';
}

export function fmtFechaIntento(f?: string | null): string {
  if (!f) return '—';
  const d = new Date(f);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

export function fechaInicioCurso(c: CursoVirtual): string {
  const f = c.matricula?.fechaMat;
  if (!f) return '—';
  const d = new Date(f);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

export function resumenPuntajesGlobal(cursos: CursoVirtual[]): ResumenPuntajesGlobal {
  let leccionesAprobadas = 0;
  let leccionesTotal = 0;
  let leccionesConNota = 0;
  let intentosEval = 0;
  let sumaAvance = 0;
  let cursosConActividad = 0;

  for (const c of cursos) {
    sumaAvance += pctCurso(c);
    if (pctCurso(c) > 0 || tieneHistorialPuntajes(c)) cursosConActividad++;
    leccionesAprobadas += c.progreso?.clasesAprobadas ?? 0;
    leccionesTotal += c.progreso?.totalClases ?? clasesDetalle(c).length;
    leccionesConNota += leccionesConNotaCount(c);
    intentosEval += c.progreso?.intentosEval ?? intentosDe(c).length;
  }

  return {
    cursos: cursos.length,
    cursosConActividad,
    promedioAvance: cursos.length ? Math.round(sumaAvance / cursos.length) : 0,
    leccionesAprobadas,
    leccionesTotal,
    leccionesConNota,
    intentosEval,
  };
}

export function cursosParaPuntajes(cursos: CursoVirtual[]): CursoVirtual[] {
  return [...cursos].sort(
    (a, b) => pctCurso(b) - pctCurso(a) || String(a.nombreProg).localeCompare(String(b.nombreProg), 'es'),
  );
}
