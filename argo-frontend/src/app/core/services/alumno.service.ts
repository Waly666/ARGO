import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

/** Esquema datosAlumnos — _id es idAlumno en Mongo */
export interface AlumnoDto {
  _id?: string;
  fechaReg?: string | Date;
  tipoDoc?: string;
  numDoc: string;
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
  fechaAudi?: string;
  userAddReg?: string;
  userChangeRecord?: string;
  fechaMod?: string;
}

export interface AlumnoListItem {
  _id: string;
  numDoc: string;
  tipoDoc?: string;
  nombre1?: string;
  nombre2?: string;
  apellido1?: string;
  apellido2?: string;
  nombres?: string;
  apellidos?: string;
  nombreCompleto?: string;
  urlFoto?: string;
  fechaMod?: string;
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
  numDoc?: string;
  nombres?: string;
  apellidos?: string;
  nombreCompleto?: string;
  message?: string;
  existingId?: string;
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

  porDocumento(numDoc: string): Observable<AlumnoDto> {
    return this.http.get<AlumnoDto>(`${this.base}/doc/${encodeURIComponent(numDoc)}`);
  }

  porId(id: string): Observable<AlumnoDto> {
    return this.http.get<AlumnoDto>(`${this.base}/${id}`);
  }

  verificarDocumento(numDoc: string, excludeId?: string): Observable<DocDuplicadoRes> {
    let params = new HttpParams();
    if (excludeId) params = params.set('excludeId', excludeId);
    return this.http.get<DocDuplicadoRes>(`${this.base}/verificar-doc/${encodeURIComponent(numDoc)}`, { params });
  }

  crear(data: AlumnoDto, files?: { foto?: File }): Observable<AlumnoDto> {
    return this.http.post<AlumnoDto>(this.base, this.toForm(data, files));
  }

  actualizar(id: string, data: AlumnoDto, files?: { foto?: File }): Observable<AlumnoDto> {
    return this.http.put<AlumnoDto>(`${this.base}/${id}`, this.toForm(data, files));
  }

  eliminar(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }

  private toForm(data: AlumnoDto, files?: { foto?: File }): FormData {
    const form = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || k === '_id') return;
      form.append(k, String(v));
    });
    if (files?.foto) form.append('foto', files.foto);
    return form;
  }
}
