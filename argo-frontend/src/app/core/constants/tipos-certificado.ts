export type TipoCertificadoId =
  | 'curso'
  | 'tecnico'
  | 'competencias'
  | 'diplomado'
  | 'licencia'
  | 'mercancias_peligrosas'
  | 'jornada_capacitacion';

export type OrientacionCertificado = 'vertical' | 'horizontal';

export const ORIENTACIONES_CERTIFICADO: { id: OrientacionCertificado; label: string }[] = [
  { id: 'vertical', label: 'Vertical' },
  { id: 'horizontal', label: 'Horizontal' },
];

export const TIPOS_CERTIFICADO: { id: TipoCertificadoId; label: string }[] = [
  { id: 'curso', label: 'Cursos' },
  { id: 'tecnico', label: 'Técnico' },
  { id: 'competencias', label: 'Capacitación por competencias' },
  { id: 'diplomado', label: 'Diplomados' },
  { id: 'licencia', label: 'Certificación licencia' },
  { id: 'jornada_capacitacion', label: 'Jornada Capacitacion' },
  { id: 'mercancias_peligrosas', label: 'Mercancías peligrosas' },
];

/** Tipos con bloque de configuración (excluye mercancías peligrosas, sección aparte) */
export const TIPOS_CERTIFICADO_PRINCIPALES = TIPOS_CERTIFICADO.filter(
  (t) => t.id !== 'mercancias_peligrosas',
);

export function labelTipoCert(id?: string): string {
  return TIPOS_CERTIFICADO.find((t) => t.id === id)?.label || id || '—';
}

export function labelOrientacion(id?: string): string {
  return ORIENTACIONES_CERTIFICADO.find((o) => o.id === id)?.label || id || '—';
}

/** Clase CSS del banner de alerta según tipo de formato del programa. */
export function certAlertToneClass(tipo?: string | null): string {
  const t = String(tipo || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  if (t === 'jornada_capacitacion') return 'cert-tone-jornada';
  if (t === 'tecnico') return 'cert-tone-tecnico';
  if (t === 'competencias') return 'cert-tone-competencias';
  if (t === 'diplomado') return 'cert-tone-diplomado';
  if (t === 'licencia') return 'cert-tone-licencia';
  if (t === 'mercancias_peligrosas') return 'cert-tone-mercancias';
  if (t === 'curso') return 'cert-tone-curso';
  return 'cert-tone-default';
}
