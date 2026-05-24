import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { formatNumDoc, parseNumDocForApi } from '../utils/num-doc.helpers';

export interface MatriculaCrearDto {
  numDoc: number | string;
  idPrograma: string;
  idProg?: string;
  tarifa?: 1 | 2 | 3;
  fechaMat?: string;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/matriculas`;

  crear(dto: MatriculaCrearDto): Observable<any> {
    const numDoc = parseNumDocForApi(dto.numDoc);
    return this.http.post(this.base, { ...dto, numDoc: numDoc ?? dto.numDoc });
  }

  listarPorAlumno(numDoc: number | string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/alumno/${encodeURIComponent(formatNumDoc(numDoc))}`);
  }
}
