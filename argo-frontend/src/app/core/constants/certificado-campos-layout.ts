import { OrientacionCertificado, TipoCertificadoId } from './tipos-certificado';

export type CampoCertificadoId =
  | 'nombre'
  | 'tipoDoc'
  | 'doc'
  | 'curso'
  | 'ciudad'
  | 'horas'
  | 'fecha'
  | 'vence'
  | 'acta'
  | 'folio'
  | 'runt'
  | 'obs'
  | 'certId';

export interface CampoLayoutCert {
  top?: string | null;
  left?: string;
  right?: string;
  bottom?: string | null;
  w?: string;
  align?: 'left' | 'center' | 'right';
  fs?: string;
  fw?: string;
  fontFamily?: string;
  color?: string;
  ls?: string;
  visible?: boolean;
}

export interface QrLayoutCert {
  top?: string | null;
  left?: string | null;
  right?: string | null;
  bottom?: string | null;
  sizePx?: number;
}

export interface LayoutOrientacionCert {
  color?: string;
  campos?: Partial<Record<CampoCertificadoId, CampoLayoutCert>>;
  qr?: QrLayoutCert;
}

export type EditorSeleccion = CampoCertificadoId | 'qr';

export const QR_ESQUINAS = [
  { id: 'inferior_izquierda', label: 'Abajo izquierda' },
  { id: 'inferior_derecha', label: 'Abajo derecha' },
  { id: 'superior_izquierda', label: 'Arriba izquierda' },
  { id: 'superior_derecha', label: 'Arriba derecha' },
] as const;

export type LayoutPorTipoCert = Partial<
  Record<TipoCertificadoId, Partial<Record<OrientacionCertificado, LayoutOrientacionCert>>>
>;

export const CAMPOS_CERTIFICADO_LAYOUT: { id: CampoCertificadoId; label: string }[] = [
  { id: 'nombre', label: 'Nombre del alumno' },
  { id: 'tipoDoc', label: 'Tipo de documento (código)' },
  { id: 'doc', label: 'Número de documento' },
  { id: 'curso', label: 'Nombre del curso / encabezado' },
  { id: 'ciudad', label: 'Ciudad (constancia)' },
  { id: 'horas', label: 'Intensidad horaria' },
  { id: 'fecha', label: 'Fecha de emisión' },
  { id: 'vence', label: 'Válido hasta' },
  { id: 'acta', label: 'Número de acta' },
  { id: 'folio', label: 'Número de folio' },
  { id: 'runt', label: 'Número RUNT' },
  { id: 'obs', label: 'Observaciones' },
  { id: 'certId', label: 'Código del certificado' },
];

/** Tamaño de letra en puntos (pt) en el editor y al imprimir */
export const TAMANO_FUENTE_MIN_PT = 4;
export const TAMANO_FUENTE_MAX_PT = 48;

export const FUENTES_CERTIFICADO = [
  'Arial, Helvetica, sans-serif',
  'Times New Roman, Times, serif',
  'Georgia, serif',
  'Verdana, sans-serif',
  'Tahoma, sans-serif',
  'Courier New, monospace',
];

export interface LayoutDefaultsApi {
  campos: Record<string, string>;
  vertical: Record<string, unknown>;
  horizontal: Record<string, unknown>;
  qr?: {
    vertical: Record<string, Record<string, string>>;
    horizontal: Record<string, Record<string, string>>;
    defaultSizePx: number;
  };
}
