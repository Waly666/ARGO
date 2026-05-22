import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface LiquidacionItem {
  _id: string;
  numDoc: string;
  idMat?: string | null;
  idServ?: string | null;
  idProg?: string | null;
  descripcion?: string;
  valor: number;
  abonado: number;
  saldo: number;
  estado?: string;
  fechaCreacion?: string;
}

export interface LiquidacionResumen {
  items: LiquidacionItem[];
  totales: { valor: number; abonado: number; saldo: number };
}

export interface LiquidacionCrearDto {
  numDoc: string;
  idServ: string;
  descripcion?: string;
  valor: number;
}

@Injectable({ providedIn: 'root' })
export class LiquidacionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/liquidacion`;

  listarPorAlumno(numDoc: string): Observable<LiquidacionResumen> {
    return this.http.get<LiquidacionResumen>(`${this.base}/alumno/${encodeURIComponent(numDoc)}`);
  }

  obtener(id: string): Observable<LiquidacionItem> {
    return this.http.get<LiquidacionItem>(`${this.base}/${id}`);
  }

  crear(dto: LiquidacionCrearDto): Observable<LiquidacionItem> {
    return this.http.post<LiquidacionItem>(this.base, dto);
  }

  eliminar(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }
}
