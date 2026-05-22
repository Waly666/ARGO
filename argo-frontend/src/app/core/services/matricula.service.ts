import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface MatriculaCrearDto {
  numDoc: string;
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
    return this.http.post(this.base, dto);
  }

  listarPorAlumno(numDoc: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/alumno/${encodeURIComponent(numDoc)}`);
  }
}
