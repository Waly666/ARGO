import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface IngresoCrearDto {
  numDoc: string;
  idLiquidacion: string;
  valor: number;
  idTipoPago: string;
  idBanco?: string;
  numComprobante?: string;
  fecha?: string;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class IngresoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ingresos`;

  crear(dto: IngresoCrearDto): Observable<any> {
    return this.http.post(this.base, dto);
  }

  listarPorAlumno(numDoc: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/alumno/${encodeURIComponent(numDoc)}`);
  }

  listarPorLiquidacion(idLiquidacion: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/liquidacion/${idLiquidacion}`);
  }

  eliminar(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }
}
