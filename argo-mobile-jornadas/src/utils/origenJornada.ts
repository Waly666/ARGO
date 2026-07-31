/** Orígenes de participantes en jornadas (alineado al backend). */

export const ORIGENES_JORNADA = ['colegio', 'estamento', 'empresa', 'operativo'] as const;
export type OrigenJornadaKey = (typeof ORIGENES_JORNADA)[number];

export const ORIGEN_JORNADA_LABELS: Record<OrigenJornadaKey, string> = {
  colegio: 'Institución educativa',
  estamento: 'Estamento público',
  empresa: 'Empresa',
  operativo: 'Operativo / calle',
};

export function normalizarOrigenJornada(raw?: string | null): OrigenJornadaKey | '' {
  const t = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if ((ORIGENES_JORNADA as readonly string[]).includes(t)) return t as OrigenJornadaKey;
  if (
    t.includes('coleg') ||
    t.includes('instituc') ||
    t.includes('universidad') ||
    t.includes('instituto') ||
    t === 'ies'
  ) {
    return 'colegio';
  }
  if (t.includes('estament') || t.includes('autoridad') || t.includes('publico')) return 'estamento';
  if (t.includes('empres') || t.includes('cliente')) return 'empresa';
  if (t.includes('operativ') || t.includes('calle')) return 'operativo';
  return '';
}

/** Sin origen en ficha se trata como operativo (legado). */
export function origenAlumnoEfectivo(raw?: string | null): OrigenJornadaKey {
  return normalizarOrigenJornada(raw) || 'operativo';
}

export function labelOrigenJornada(raw?: string | null): string {
  const k = origenAlumnoEfectivo(raw);
  return ORIGEN_JORNADA_LABELS[k] || k;
}

export function mensajeOrigenNoCoincide(origenAlumno: string, origenFiltro: string): string {
  return (
    `Este alumno es de «${labelOrigenJornada(origenAlumno)}». ` +
    `El filtro activo es «${labelOrigenJornada(origenFiltro)}». ` +
    'Cambie el origen seleccionado o use un alumno de ese origen.'
  );
}
