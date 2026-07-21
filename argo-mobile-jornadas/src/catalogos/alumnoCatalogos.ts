export type CatalogOption = { value: string; label: string };

export const TIPOS_DOC: CatalogOption[] = [
  { value: '1', label: '1) CÉDULA DE CIUDADANÍA' },
  { value: '2', label: '2) TARJETA DE IDENTIDAD' },
  { value: '3', label: '3) REGISTRO CIVIL' },
  { value: '4', label: '4) CÉDULA DE EXTRANJERÍA' },
  { value: '5', label: '5) PASAPORTE' },
  { value: '6', label: '6) NIT' },
];

export const GENEROS: CatalogOption[] = [
  { value: 'M', label: 'M' },
  { value: 'F', label: 'F' },
];

export const TIPOS_SANGRE: CatalogOption[] = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

export const JORNADAS_ESTUDIO: CatalogOption[] = [
  { value: '1', label: '1) DIURNA' },
  { value: '2', label: '2) NOCTURNA' },
  { value: '3', label: '3) FIN DE SEMANA' },
];

export const ESTADOS_CIVIL: CatalogOption[] = [
  { value: '1', label: '1) SOLTERO' },
  { value: '2', label: '2) CASADO' },
  { value: '3', label: '3) UNIÓN LIBRE' },
  { value: '4', label: '4) SEPARADO' },
  { value: '5', label: '5) VIUDO' },
  { value: '6', label: '6) DIVORCIADO' },
  { value: '7', label: '7) SIN INFORMACIÓN' },
];

export const ESTRATOS: CatalogOption[] = [
  { value: '1', label: '1) 1' },
  { value: '2', label: '2) 2' },
  { value: '3', label: '3) 3' },
  { value: '4', label: '4) 4' },
  { value: '5', label: '5) 5' },
  { value: '6', label: '6) 6' },
  { value: '99', label: '7) 99' },
];

export const REGIMEN_SALUD: CatalogOption[] = [
  { value: '1', label: '1) CONTRIBUTIVO' },
  { value: '2', label: '2) SUBSIDIADO' },
  { value: '3', label: '3) ESPECIAL' },
  { value: '4', label: '4) NO AFILIADO' },
];

export const NIVEL_FORMACION: CatalogOption[] = [
  { value: '1', label: '1) PREESCOLAR' },
  { value: '2', label: '2) BÁSICA PRIMARIA' },
  { value: '3', label: '3) BÁSICA SECUNDARIA' },
  { value: '4', label: '4) MEDIA' },
  { value: '5', label: '5) PREGRADO' },
  { value: '6', label: '6) POSTGRADO' },
  { value: '7', label: '7) SIN ESTUDIOS' },
  { value: '8', label: '8) TÉCNICO LABORAL' },
];

export const OCUPACIONES: CatalogOption[] = [
  { value: '1', label: '1) EMPLEADO' },
  { value: '2', label: '2) ESTUDIANTE BÁSICA / MEDIA' },
  { value: '3', label: '3) ESTUDIANTE SUPERIOR' },
  { value: '4', label: '4) DESEMPLEADO' },
  { value: '5', label: '5) INDEPENDIENTE' },
];

export const DISCAPACIDADES: CatalogOption[] = [
  { value: '1', label: '1) SORDERA PROFUNDA' },
  { value: '2', label: '2) HIPOACUSIA / BAJA AUDICIÓN' },
  { value: '3', label: '3) BAJA VISIÓN' },
  { value: '4', label: '4) CEGUERA' },
  { value: '5', label: '5) PARÁLISIS CEREBRAL' },
  { value: '6', label: '6) LESIÓN NEUROMUSCULAR' },
  { value: '7', label: '7) DEFICIENCIA COGNITIVA' },
  { value: '8', label: '8) MÚLTIPLE' },
  { value: '9', label: '9) NO APLICA' },
];

export const MULTICULTURALIDAD: CatalogOption[] = [
  { value: 'INDIGENA', label: 'INDÍGENA' },
  { value: 'AFRODESCENDIENTE', label: 'AFRODESCENDIENTE' },
  { value: 'DESPLAZADO', label: 'DESPLAZADO' },
  { value: 'POBLACION_FRONTERA', label: 'POBLACIÓN DE FRONTERA' },
  { value: 'CABEZA_FAMILIA', label: 'CABEZA DE FAMILIA' },
  { value: 'REINSERTADO', label: 'REINSERTADO' },
  { value: 'POBLACION_ROM', label: 'POBLACIÓN ROM' },
  { value: 'NO_APLICA', label: 'NO APLICA' },
];

export function labelCatalogo(opts: CatalogOption[], value?: string | null): string {
  const v = String(value || '').trim();
  if (!v) return '';
  return opts.find((o) => o.value === v)?.label || v;
}
