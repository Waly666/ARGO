import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export type NivelPesv = 'basico' | 'estandar' | 'avanzado';

export interface PesvConfig {
  vigenciaActiva?: number;
  tipoOrganizacion?: 'cea' | 'empresa';
  razonSocial?: string;
  nit?: string;
}

export interface PesvCampoEmpresaPdf {
  key: string;
  label: string;
}

export type PesvPdfAlineacion = 'left' | 'center' | 'right';

export interface PesvPdfElementoLayout {
  id: string;
  alineacion: PesvPdfAlineacion;
}

export interface PesvPdfTipografiaBloque {
  familia: string;
  tamanoPt: number;
}

export interface PesvPdfLogoCapa {
  anchoMm: number;
  altoMm: number;
  ancla: PesvPdfAlineacion;
  opacidad: number;
}

export interface PesvPdfTipografiaDocumento {
  familia: string;
  tamanoNombrePt: number;
  tamanoTituloPt: number;
  tamanoSubtituloPt: number;
  tamanoVersionPt: number;
  tamanoVigenciaPt: number;
  tamanoMetaPt?: number;
}

export interface PesvPdfFuenteOption {
  id: string;
  label: string;
}

export interface PesvPdfBloqueLayout {
  activo?: boolean;
  alturaMm: number;
  modo: 'datos' | 'imagen' | 'mixto';
  imagenRuta?: string | null;
  camposActivos: string[];
  elementosLayout?: PesvPdfElementoLayout[];
  tipografia?: PesvPdfTipografiaBloque;
  logoCapa?: PesvPdfLogoCapa;
  textoLibre?: string;
  mostrarLineaSeparadora?: boolean;
  mostrarNumeracion?: boolean;
}

export interface PesvPdfDocumentoItemConfig {
  nombre: string;
  titulo: string;
  subtitulo: string;
  versionDocumento: string;
  /** Fecha ISO YYYY-MM-DD (vigencia del documento). */
  vigenciaDocumento: string;
  /** nombre, titulo, subtitulo, versionDocumento, vigenciaDocumento */
  camposEncabezadoDocumentoActivos?: string[];
  portada: {
    activa: boolean;
    imagenRuta?: string | null;
  };
  /** Título, subtítulo, versión, vigencia — bloque en encabezado del PDF. */
  layoutEncabezadoDocumento?: PesvPdfElementoLayout[];
  /** @deprecated use layoutEncabezadoDocumento */
  layoutContenido?: PesvPdfElementoLayout[];
  tipografia?: PesvPdfTipografiaDocumento;
}

export interface PesvPdfDocumentoConfig {
  tamanoHoja: 'letter' | 'legal' | 'a4';
  orientacion: 'portrait' | 'landscape';
  margenesMm: { superior: number; inferior: number; izquierdo: number; derecho: number };
  encabezado: PesvPdfBloqueLayout;
  piePagina: PesvPdfBloqueLayout;
  marcaAgua: {
    activa: boolean;
    usarLogoEmpresa?: boolean;
    imagenRuta?: string | null;
    /** Tamaño del logo en el cuerpo (marca de agua), distinto al del encabezado. */
    logoTamano?: { anchoMm: number; altoMm: number };
    opacidad: number;
    rotacionGrados: number;
  };
  documentosPorItem?: Record<string, PesvPdfDocumentoItemConfig>;
}

export interface PesvPdfCatalogoDocumento {
  itemNo: number;
  capturaKey: string;
  paso40595?: number | null;
  pregunta: string;
  tituloCatalogo: string;
  salida: string;
  modo?: string;
  config: PesvPdfDocumentoItemConfig;
}

export interface PesvPdfConfigDto {
  pdfDocumento: PesvPdfDocumentoConfig;
  camposEmpresaDisponibles: PesvCampoEmpresaPdf[];
  tamanosHoja?: string[];
  orientaciones?: string[];
  catalogoDocumentos?: PesvPdfCatalogoDocumento[];
  alineacionesPdf?: PesvPdfAlineacion[];
  fuentesPdf?: PesvPdfFuenteOption[];
}

export interface PesvAutodiagnostico {
  vigencia?: number;
  misionalidad?: 1 | 2;
  totalVehiculos?: number;
  totalConductores?: number;
  nivelCalculado?: NivelPesv;
  observaciones?: string;
}

export interface PesvDocumentoMeta {
  modo: string;
  tituloDocumento?: string;
  salida?: string;
  nota?: string;
  plantillaId?: string;
  variant?: string;
}

export interface PesvCampoDef {
  key: string;
  label: string;
  tipo: string;
  requerido?: boolean;
  opciones?: string[];
  columnas?: { key: string; label: string }[];
}

export interface PesvFormularioDef {
  titulo: string;
  descripcion?: string;
  secciones: { id: string; titulo: string; campos: PesvCampoDef[] }[];
}

export interface PesvCapturaDto {
  vigencia: number;
  itemNo: number;
  capturaKey: string;
  meta: PesvDocumentoMeta;
  formulario: PesvFormularioDef;
  datos: Record<string, unknown>;
  organizacionEmpresa?: {
    razonSocial?: string;
    nit?: string;
    representanteLegal?: string;
    ciudad?: string;
  };
  completitud: { pct: number; total: number; ok: number };
  catalogoItem: { pregunta: string; paso40595?: number | null };
}

export interface PesvCapturaIndiceItem {
  itemNo: number;
  capturaKey: string;
  completitud: { pct: number; total: number; ok: number };
  tieneDatos: boolean;
}

export interface PesvFase1ItemView {
  itemNo: number;
  paso40595: number | null;
  pregunta: string;
  evidenciaHint: string;
  formatoEvidencia: string;
  aplica: boolean;
  documento?: PesvDocumentoMeta;
  respuesta: {
    itemNo?: number;
    existe?: 'si' | 'no' | null;
    motivoCodigo?: string;
    observacion?: string;
    datosCapturados?: Record<string, unknown> | null;
    documentoGeneradoRuta?: string | null;
    documentoGeneradoEn?: string | null;
    adjuntoRuta?: string | null;
    adjuntoNombre?: string | null;
  };
}

export interface PesvFase1Dto {
  vigencia: number;
  nivel: NivelPesv;
  nivelLabel: string;
  enviadoSt: boolean;
  items: PesvFase1ItemView[];
  motivos: { codigo: string; label: string }[];
}

export interface PesvSugerenciasFlota {
  vigencia: number;
  mes: number;
  inspeccionesRegistradas: number;
  registrosPlacaDia: number;
  placasConInspeccionEnMes: number;
  vehiculosEnFlota: number;
  sugerido: Record<string, number>;
  nota?: string;
}

export interface PesvTableroMes {
  mes: number;
  estado: string | null;
  obligado: boolean;
  '6.1'?: number | null;
  '6.2'?: number | null;
  '8.1'?: number | null;
  '8.2'?: number | null;
  '9.1'?: number | null;
  '9.2'?: number | null;
}

export interface PesvTablero {
  vigencia: number;
  meses: PesvTableroMes[];
}

export interface PesvResumen {
  nivel?: NivelPesv;
  nivelLabel?: string;
  autodiagnostico?: PesvAutodiagnostico | null;
  fase1?: {
    aplicables: number;
    conRespuesta: number;
    conCaptura: number;
    enviadoSt: boolean;
  };
  flota?: { vehiculosActivos: number; inspeccionesMesActual: number };
}

@Injectable({ providedIn: 'root' })
export class PesvService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/pesv`;

  config(): Observable<PesvConfig> {
    return this.http.get<PesvConfig>(`${this.base}/config`);
  }

  guardarConfig(body: PesvConfig): Observable<PesvConfig> {
    return this.http.put<PesvConfig>(`${this.base}/config`, body);
  }

  configPdf(): Observable<PesvPdfConfigDto> {
    return this.http.get<PesvPdfConfigDto>(`${this.base}/config/pdf`);
  }

  guardarConfigPdf(pdfDocumento: PesvPdfDocumentoConfig): Observable<PesvPdfConfigDto> {
    return this.http.put<PesvPdfConfigDto>(`${this.base}/config/pdf`, { pdfDocumento });
  }

  subirImagenPdfLayout(
    zona: 'encabezado' | 'pie' | 'marcaAgua',
    file: File,
  ): Observable<PesvPdfConfigDto & { imagenRuta?: string }> {
    const fd = new FormData();
    fd.append('archivo', file);
    return this.http.post<PesvPdfConfigDto & { imagenRuta?: string }>(
      `${this.base}/config/pdf/imagen/${zona}`,
      fd,
    );
  }

  subirPortadaPdfDocumento(
    itemNo: number,
    file: File,
  ): Observable<PesvPdfConfigDto & { imagenRuta?: string }> {
    const fd = new FormData();
    fd.append('archivo', file);
    return this.http.post<PesvPdfConfigDto & { imagenRuta?: string }>(
      `${this.base}/config/pdf/documento/${itemNo}/portada`,
      fd,
    );
  }

  autodiagnostico(vigencia?: number): Observable<{ vigencia: number; registro: PesvAutodiagnostico | null }> {
    const q = vigencia != null ? `?vigencia=${vigencia}` : '';
    return this.http.get<{ vigencia: number; registro: PesvAutodiagnostico | null }>(
      `${this.base}/autodiagnostico${q}`,
    );
  }

  guardarAutodiagnostico(body: PesvAutodiagnostico & { vigencia: number }): Observable<PesvAutodiagnostico> {
    return this.http.put<PesvAutodiagnostico>(`${this.base}/autodiagnostico`, body);
  }

  fase1(vigencia?: number): Observable<PesvFase1Dto> {
    const q = vigencia != null ? `?vigencia=${vigencia}` : '';
    return this.http.get<PesvFase1Dto>(`${this.base}/fase1${q}`);
  }

  capturaIndice(vigencia?: number): Observable<{ vigencia: number; items: PesvCapturaIndiceItem[] }> {
    const q = vigencia != null ? `?vigencia=${vigencia}` : '';
    return this.http.get<{ vigencia: number; items: PesvCapturaIndiceItem[] }>(
      `${this.base}/captura/indice${q}`,
    );
  }

  getCaptura(vigencia: number | undefined, itemNo: number): Observable<PesvCapturaDto> {
    const v = vigencia != null ? `vigencia=${vigencia}&` : '';
    return this.http.get<PesvCapturaDto>(`${this.base}/captura?${v}itemNo=${itemNo}`);
  }

  guardarCaptura(body: {
    vigencia: number;
    itemNo: number;
    datos: Record<string, unknown>;
  }): Observable<{ ok: boolean; completitud: { pct: number; total: number; ok: number } }> {
    return this.http.put<{ ok: boolean; completitud: { pct: number; total: number; ok: number } }>(
      `${this.base}/captura`,
      body,
    );
  }

  guardarFase1(body: {
    vigencia: number;
    items: PesvFase1ItemView['respuesta'][];
    enviadoSt?: boolean;
  }): Observable<unknown> {
    return this.http.put(`${this.base}/fase1`, body);
  }

  /** PDF firmado — certificación del representante legal (ítems 1–2). */
  subirAdjuntoFase1(vigencia: number, itemNo: number, file: File): Observable<{ adjuntoRuta: string }> {
    const fd = new FormData();
    fd.append('archivo', file);
    return this.http.post<{ adjuntoRuta: string }>(
      `${this.base}/fase1/${vigencia}/items/${itemNo}/adjunto`,
      fd,
    );
  }

  generarDocumentoFase1(
    vigencia: number,
    itemNo: number,
  ): Observable<{ ok?: boolean; message?: string; code?: string }> {
    return this.http.post<{ ok?: boolean; message?: string; code?: string }>(
      `${this.base}/fase1/${vigencia}/items/${itemNo}/generar`,
      {},
    );
  }

  fase2(vigencia: number, mes: number): Observable<unknown> {
    return this.http.get(`${this.base}/fase2?vigencia=${vigencia}&mes=${mes}`);
  }

  guardarFase2(body: unknown): Observable<unknown> {
    return this.http.put(`${this.base}/fase2`, body);
  }

  subirAdjuntoFase2(
    vigencia: number,
    mes: number,
    tab: string,
    evidenciaId: string,
    file: File,
  ): Observable<{ adjuntoRuta: string; adjuntoNombre: string }> {
    const fd = new FormData();
    fd.append('archivo', file);
    return this.http.post<{ adjuntoRuta: string; adjuntoNombre: string }>(
      `${this.base}/fase2/${vigencia}/${mes}/adjunto/${tab}/${evidenciaId}`,
      fd,
    );
  }

  sugerenciasFlota(vigencia: number, mes: number): Observable<PesvSugerenciasFlota> {
    return this.http.get<PesvSugerenciasFlota>(
      `${this.base}/flota/sugerencias?vigencia=${vigencia}&mes=${mes}`,
    );
  }

  tablero(vigencia?: number): Observable<PesvTablero> {
    const q = vigencia != null ? `?vigencia=${vigencia}` : '';
    return this.http.get<PesvTablero>(`${this.base}/tablero${q}`);
  }

  resumen(vigencia?: number): Observable<PesvResumen> {
    const q = vigencia != null ? `?vigencia=${vigencia}` : '';
    return this.http.get<PesvResumen>(`${this.base}/resumen${q}`);
  }

  urlUploads(relative?: string | null): string | null {
    if (!relative) return null;
    const base = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}/uploads/${relative.replace(/^\/+/, '')}`;
  }
}
