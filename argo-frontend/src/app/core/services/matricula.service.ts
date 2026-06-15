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
  fechaMat?: string;
  observaciones?: string;
  crearUsuarioPortal?: boolean;
  email?: string;
  password?: string;
}

export interface MatriculaCrearRes {
  matricula?: unknown;
  liquidacion?: unknown;
  usuarioPortal?: {
    creado: boolean;
    actualizado: boolean;
    email: string;
    numDoc: number;
    passwordTemporal: string | null;
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

  listarPorAlumno(numDoc: number | string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/alumno/${encodeURIComponent(formatNumDoc(numDoc))}`);
  }
}
