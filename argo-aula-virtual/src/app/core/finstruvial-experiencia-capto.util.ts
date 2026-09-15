/** Texto estructurado de actividades experienciales CAPTO (carpas interactivas). */
export interface ExperienciaCaptoParsed {
  actividad: string;
  descripcion: string;
  sede: string;
  instructores: string;
  capacidad: string;
  duracion: string;
  /** Texto original cuando no coincide el formato esperado. */
  rawFallback: string;
}

const ACTIVIDAD_RE = /^Actividad:\s*([^.]+)\.\s*/i;
const META_RE = /\s+En la\s+/i;

export function parseExperienciaCaptoTexto(texto: string): ExperienciaCaptoParsed {
  const rawFallback = String(texto || '').trim();
  const empty: ExperienciaCaptoParsed = {
    actividad: '',
    descripcion: '',
    sede: '',
    instructores: '',
    capacidad: '',
    duracion: '',
    rawFallback,
  };
  if (!rawFallback) return empty;

  const actividadMatch = rawFallback.match(ACTIVIDAD_RE);
  if (!actividadMatch) return empty;

  const actividad = actividadMatch[1].trim();
  let rest = rawFallback.slice(actividadMatch[0].length).trim();

  const metaIdx = rest.search(META_RE);
  let descripcion = rest;
  let meta = '';

  if (metaIdx >= 0) {
    descripcion = rest.slice(0, metaIdx).trim().replace(/\.\s*$/, '');
    meta = rest.slice(metaIdx).trim();
  } else {
    descripcion = rest.replace(/\.\s*$/, '');
  }

  const sede = meta.match(/^En la\s+([^·]+)/i)?.[1]?.trim() || '';
  const instructores = meta.match(/(\d+\s+instructores?)/i)?.[1]?.trim() || '';
  const capacidad = meta.match(/Capacidad:\s*([^·]+)/i)?.[1]?.trim() || '';
  const duracion =
    meta.match(/Duraci[oó]n(?:\s+promedio)?:\s*([^·.]+)/i)?.[1]?.trim() || '';

  return {
    actividad,
    descripcion,
    sede,
    instructores,
    capacidad,
    duracion,
    rawFallback: '',
  };
}

export function experienciaCaptoTieneFormato(texto: string): boolean {
  return ACTIVIDAD_RE.test(String(texto || '').trim());
}
