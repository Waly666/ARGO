import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { formatNumDoc, parseNumDocForApi } from '../utils/num-doc.helpers';

export interface MatriculaCrearDto {
  numDoc: number | string;
  idPrograma: string;
  idProg?: string;
  tarifa?: 1 | 2 | 3 | 4;
  /** Si true, no aplica tarifa 3 automática aunque califique refrendación. */
  tarifaManual?: boolean;
  /** Rebaja sobre valor catálogo (tarifas 1–3). Total del programa; en multisemestre se reparte. */
  ajustarValor?: boolean;
  valorAcordado?: number;
  motivoAjuste?: string;
  fechaMat?: string;
  observaciones?: string;
  crearUsuarioPortal?: boolean;
  email?: string;
  password?: string;
}

export interface RevalidacionPreview {
  califica: boolean;
  admiteRevalidacion: boolean;
  aplicarAuto: boolean;
  tarifaSugerida: number;
  tarifaAplicada?: number;
  aplicadaAuto: boolean;
  tarifa3Disponible: boolean;
  valorSugerido: number;
  mensaje?: string | null;
  certificado?: {
    codigoCert?: string;
    fechaEmision?: string;
    fechaVencimiento?: string | null;
    estado?: string;
  } | null;
}

export interface MatriculaCrearRes {
  matricula?: unknown;
  liquidacion?: unknown;
  liquidaciones?: unknown[];
  revalidacion?: {
    aplica: boolean;
    aplicadaAuto: boolean;
    mensaje?: string | null;
    tarifa: number;
  };
  usuarioPortal?: {
    creado: boolean;
    actualizado: boolean;
    email: string;
    numDoc: number;
    passwordTemporal: string | null;
  } | null;
  ajuste?: {
    valorCatalogo: number;
    valorAcordado: number;
    rebaja: number;
    motivoAjuste: string;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/matriculas`;

  crear(dto: MatriculaCrearDto): Observable<MatriculaCrearRes> {
    const numDoc = parseNumDocForApi(dto.numDoc);
    return this.http.post<MatriculaCrearRes>(this.base, { ...dto, numDoc: numDoc ?? dto.numDoc });
  }

  previewRevalidacion(numDoc: number | string, idPrograma: string): Observable<RevalidacionPreview> {
    const nd = parseNumDocForApi(numDoc) ?? numDoc;
    const params = new URLSearchParams({
      numDoc: String(nd),
      idPrograma: String(idPrograma),
    });
    return this.http.get<RevalidacionPreview>(`${this.base}/revalidacion-preview?${params}`);
  }

  listarPorAlumno(numDoc: number | string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/alumno/${encodeURIComponent(formatNumDoc(numDoc))}`);
  }
}
