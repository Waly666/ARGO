import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { formatNumDoc, parseNumDocForApi } from '../utils/num-doc.helpers';
import type { DocumentosRequeridosRes, ValidacionDocumentosRes } from './config-requisitos-documentos.service';

/** Esquema datosAlumnos — _id es idAlumno en Mongo */
export interface AlumnoDto {
  _id?: string;
  fechaReg?: string | Date;
  tipoDoc?: string;
  /** En BD/API es número; en formulario de edición suele mostrarse como string */
  numDoc: number | string;
  expedida?: string;
  apellido1: string;
  apellido2?: string;
  nombre1: string;
  nombre2?: string;
  fechaNac?: string | null;
  observaciones?: string;
  genero?: string;
  tipoSangre?: string;
  jornada?: string;
  estadoCivil?: string;
  estrato?: string;
  regimenSalud?: string;
  nivelFormacion?: string;
  ocupacion?: string;
  discapacidad?: string;
  munOrigen?: string;
  /** Código divipola; debe coincidir con munOrigen */
  codMunicipio?: string;
  correo?: string;
  direccion?: string;
  celular?: string;
  multiCulturalidad?: string;
  urlFoto?: string;
  urlCedula?: string;
  urlLicencia?: string;
  docsAlumno?: Record<string, string>;
  fechaAudi?: string;
  userAddReg?: string;
  userChangeRecord?: string;
  fechaMod?: string;
}

export interface AlumnoListItem {
  _id: string;
  /** En BD/API es número; en formulario de edición suele mostrarse como string */
  numDoc: number | string;
  tipoDoc?: string;
  expedida?: string;
  nombre1?: string;
  nombre2?: string;
  apellido1?: string;
  apellido2?: string;
  nombres?: string;
  apellidos?: string;
  nombreCompleto?: string;
  fechaNac?: string | Date | null;
  genero?: string;
  tipoSangre?: string;
  jornada?: string;
  jornadaLabel?: string;
  estadoCivil?: string;
  estadoCivilLabel?: string;
  estrato?: string;
  celular?: string;
  correo?: string;
  direccion?: string;
  munOrigen?: string;
  codMunicipio?: string;
  munOrigenLabel?: string;
  nombreMunicipio?: string;
  nombreDepto?: string;
  urlFoto?: string;
  urlCedula?: string;
  urlLicencia?: string;
  docsAlumno?: Record<string, string>;
  fechaMod?: string;
  indicadores?: {
    docsPendientes: number;
    saldosPendientes: number;
    saldoTotal: number;
    itemsSaldo?: { id: string; descripcion: string; saldo: number }[];
  };
}

export interface AlumnoListResponse {
  items: AlumnoListItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface DocDuplicadoRes {
  existe: boolean;
  _id?: string;
  numDoc?: number | string;
  nombres?: string;
  apellidos?: string;
  nombreCompleto?: string;
  message?: string;
  existingId?: string;
}

export interface CedulaOcrSugerido {
  tipoDoc?: string;
  numDoc?: number | string;
  expedida?: string;
  apellido1?: string;
  apellido2?: string;
  nombre1?: string;
  nombre2?: string;
  fechaNac?: string;
  genero?: string;
  tipoSangre?: string;
}

export interface AlumnoArchivosUpload {
  foto?: File;
  cedula?: File;
  licencia?: File;
}

export interface CedulaOcrResponse {
  sugerido: CedulaOcrSugerido;
  meta: {
    tieneRespaldo: boolean;
    advertencias: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class AlumnoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/alumnos`;

  listar(opts: { q?: string; limit?: number; skip?: number } = {}): Observable<AlumnoListResponse> {
    let params = new HttpParams();
    if (opts.q != null) params = params.set('q', opts.q);
    if (opts.limit != null) params = params.set('limit', opts.limit);
    if (opts.skip != null) params = params.set('skip', opts.skip);
    return this.http.get<AlumnoListResponse>(this.base, { params });
  }

  porDocumento(numDoc: number | string): Observable<AlumnoDto> {
    const nd = formatNumDoc(numDoc);
    return this.http.get<AlumnoDto>(`${this.base}/doc/${encodeURIComponent(nd)}`);
  }

  porId(id: string): Observable<AlumnoDto> {
    return this.http.get<AlumnoDto>(`${this.base}/${id}`);
  }

  verificarDocumento(numDoc: number | string, excludeId?: string): Observable<DocDuplicadoRes> {
    const nd = parseNumDocForApi(numDoc);
    if (nd == null) return of({ existe: false });
    let params = new HttpParams();
    if (excludeId) params = params.set('excludeId', excludeId);
    return this.http.get<DocDuplicadoRes>(`${this.base}/verificar-doc/${encodeURIComponent(String(nd))}`, {
      params,
    });
  }

  escanearCedula(imagen: File): Observable<CedulaOcrResponse> {
    const form = new FormData();
    form.append('imagen', imagen);
    return this.http.post<CedulaOcrResponse>(`${this.base}/escanear-cedula`, form);
  }

  crear(data: AlumnoDto, files?: AlumnoArchivosUpload): Observable<AlumnoDto> {
    return this.http.post<AlumnoDto>(this.base, this.toForm(data, files));
  }

  actualizar(id: string, data: AlumnoDto, files?: AlumnoArchivosUpload): Observable<AlumnoDto> {
    return this.http.put<AlumnoDto>(`${this.base}/${id}`, this.toForm(data, files));
  }

  eliminar(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }

  documentosRequeridos(id: string): Observable<DocumentosRequeridosRes> {
    return this.http.get<DocumentosRequeridosRes>(`${this.base}/${id}/documentos-requeridos`);
  }

  validarDocumentos(id: string, idPrograma?: string): Observable<ValidacionDocumentosRes> {
    let params = new HttpParams();
    if (idPrograma) params = params.set('idPrograma', idPrograma);
    return this.http.get<ValidacionDocumentosRes>(`${this.base}/${id}/documentos-validacion`, { params });
  }

  subirDocumentoRequerido(
    id: string,
    idDoc: string,
    archivo: File,
  ): Observable<DocumentosRequeridosRes & { alumno: AlumnoDto }> {
    const form = new FormData();
    form.append('archivo', archivo);
    return this.http.put<DocumentosRequeridosRes & { alumno: AlumnoDto }>(
      `${this.base}/${id}/documentos/${encodeURIComponent(idDoc)}`,
      form,
    );
  }

  private toForm(data: AlumnoDto, files?: AlumnoArchivosUpload): FormData {
    const form = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || k === '_id') return;
      if (k === 'numDoc') {
        const n = parseNumDocForApi(v);
        if (n != null) form.append(k, String(n));
        return;
      }
      form.append(k, String(v));
    });
    if (files?.foto) form.append('foto', files.foto);
    if (files?.cedula) form.append('cedula', files.cedula);
    if (files?.licencia) form.append('licencia', files.licencia);
    return form;
  }
}
