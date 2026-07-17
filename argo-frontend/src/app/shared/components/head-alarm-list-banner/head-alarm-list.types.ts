export interface HeadAlarmListRow {
  id: string;
  title: string;
  meta?: string;
  /** Clase de tono por fila (certificado, comprobante, etc.) */
  rowClass?: string;
  /** Etiqueta corta opcional (p. ej. origen del certificado). */
  badge?: string;
  /** Clase de estilo para la etiqueta. */
  badgeClass?: string;
  routerLink?: string | string[];
  queryParams?: Record<string, string | number | boolean | null | undefined>;
}
