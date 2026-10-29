/** Valor guardado en BD para un ítem de catálogo */
export function catValor(item: Record<string, unknown>): string {
  const v =
    item['idTipoDoc'] ??
    item['idGenero'] ??
    item['idIdentidadGenero'] ??
    item['idOrientacionSexual'] ??
    item['idDiscapacidad'] ??
    item['idMulti'] ??
    item['idActorVial'] ??
    item['id'] ??
    item['codigo'] ??
    item['_id'];
  return v != null ? String(v) : '';
}

/** Texto visible en select — formato esquema: "1) CEDULA DE CIUDADANÍA" */
export function catEtiqueta(item: Record<string, unknown>): string {
  const d = item['descripcion'] ?? item['nombre'];
  const v = catValor(item);
  if (d) {
    const s = String(d).trim();
    if (/^\d+\)\s/.test(s)) return s;
    if (v && /^\d+$/.test(v)) return `${v}) ${s}`;
    return s;
  }
  return v;
}

export function etiquetaGenero(item: Record<string, unknown>): string {
  const v = catValor(item).toUpperCase();
  if (v === 'M') return 'Masculino (M)';
  if (v === 'F') return 'Femenino (F)';
  if (v === 'I') return 'Intersexual (I)';
  return catEtiqueta(item);
}

export const TIPOS_DOC_FALLBACK: Record<string, unknown>[] = [
  { idTipoDoc: '1', descripcion: '1) CEDULA DE CIUDADANÍA' },
  { idTipoDoc: '2', descripcion: '2) TARJETA DE IDENTIDAD' },
  { idTipoDoc: '3', descripcion: '3) REGISTRO CIVIL' },
  { idTipoDoc: '4', descripcion: '4) CEDULA DE EXTRANJERIA' },
  { idTipoDoc: '5', descripcion: '5) PASAPORTE' },
  { idTipoDoc: '6', descripcion: '6) NUMERO DE IDENTIFICACION TRIBUTARIA' },
];

export const GENEROS_FALLBACK: Record<string, unknown>[] = [
  { idGenero: 'M', descripcion: 'M' },
  { idGenero: 'F', descripcion: 'F' },
];

export const IDENTIDAD_GENERO_FALLBACK: Record<string, unknown>[] = [
  { idIdentidadGenero: 'CISGENERO', descripcion: 'CISGÉNERO' },
  { idIdentidadGenero: 'TRANSGENERO', descripcion: 'TRANSGÉNERO' },
  { idIdentidadGenero: 'NO_BINARIO', descripcion: 'NO BINARIO' },
];

export const ORIENTACION_SEXUAL_FALLBACK: Record<string, unknown>[] = [
  { idOrientacionSexual: 'HETEROSEXUAL', descripcion: 'HETEROSEXUAL' },
  { idOrientacionSexual: 'HOMOSEXUAL', descripcion: 'HOMOSEXUAL' },
  { idOrientacionSexual: 'BISEXUAL', descripcion: 'BISEXUAL' },
  { idOrientacionSexual: 'OTRO', descripcion: 'OTRO' },
];

export const DISCAPACIDAD_FALLBACK: Record<string, unknown>[] = [
  { idDiscapacidad: '1', descripcion: '1) SORDERA PROFUNDA' },
  { idDiscapacidad: '2', descripcion: '2) HIPOACUSIA A BAJA AUDICION' },
  { idDiscapacidad: '3', descripcion: '3) BAJA VISION DIAGNOSTICA' },
  { idDiscapacidad: '4', descripcion: '4) CEGUERA' },
  { idDiscapacidad: '5', descripcion: '5) PARALISIS CEREBRAL' },
  { idDiscapacidad: '6', descripcion: '6) LESION NEUROMUSCULAR' },
  { idDiscapacidad: '7', descripcion: '7) DEFICIENCIA COGNITIVA(RETARDO EN EL DESARROLLO)' },
  { idDiscapacidad: '8', descripcion: '8) MULTIPLE' },
  { idDiscapacidad: '9', descripcion: '9) NO APLICA' },
];

export const MULTICULTURALIDAD_FALLBACK: Record<string, unknown>[] = [
  { id: 'INDIGENA', descripcion: 'INDIGENA' },
  { id: 'AFRODESCENDIENTE', descripcion: 'AFRODESCENDIENTE' },
  { id: 'DESPLAZADO', descripcion: 'DESPLAZADO' },
  { id: 'POBLACION_FRONTERA', descripcion: 'POBLACIÓN DE FRONTERA' },
  { id: 'CABEZA_FAMILIA', descripcion: 'CABEZA DE FAMILIA' },
  { id: 'REINSERTADO', descripcion: 'REINSERTADO' },
  { id: 'POBLACION_ROM', descripcion: 'POBLACIÓN ROM' },
  { id: 'NO_APLICA', descripcion: 'NO APLICA' },
];

/** Predeterminados ficha alumno ERP (jornadas). */
export const PORTAL_ALUMNO_DEFAULTS = {
  identidadGenero: 'CISGENERO',
  orientacionSexual: 'HETEROSEXUAL',
  discapacidad: '9',
  multiCulturalidad: 'NO_APLICA',
  origenJornadaCap: 'operativo',
} as const;

export const ORIGENES_JORNADA_UI: Array<{ key: string; label: string }> = [
  { key: 'colegio', label: 'Institución educativa' },
  { key: 'estamento', label: 'Estamento público' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'operativo', label: 'Operativo / calle' },
];

export const ACTOR_VIAL_FALLBACK: Record<string, unknown>[] = [
  { idActorVial: '1', descripcion: '1) PEATÓN' },
  { idActorVial: '2', descripcion: '2) CONDUCTOR' },
  { idActorVial: '3', descripcion: '3) CICLISTA' },
  { idActorVial: '4', descripcion: '4) MOTOCICLISTA' },
  { idActorVial: '5', descripcion: '5) PASAJERO' },
];
