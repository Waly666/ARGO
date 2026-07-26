import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Tercero {
  _id?: string;
  identificationDocumentCode?: string;
  identificacion: string;
  dv?: string;
  legalOrganizationCode?: string;
  razonSocial?: string;
  nombreComercial?: string;
  nombres?: string;
  tributeCode?: string;
  responsabilidadFiscal?: string;
  direccion?: string;
  correo?: string;
  telefono?: string;
  municipioCodigo?: string;
  municipioNombre?: string;
  activo?: boolean;
  nombre?: string;
}

export interface TerceroCatalogos {
  tiposIdentificacion: { code: string; label: string }[];
  organizacionesLegales: { code: string; label: string }[];
  tributos: { code: string; label: string }[];
  responsabilidadesFiscales: { code: string; label: string }[];
}

@Injectable({ providedIn: 'root' })
export class TerceroService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/terceros`;

  catalogos(): Observable<TerceroCatalogos> {
    return this.http.get<TerceroCatalogos>(`${this.base}/catalogos`);
  }

  listar(q = ''): Observable<Tercero[]> {
    return this.http.get<Tercero[]>(this.base, { params: q ? { q } : {} });
  }

  obtener(id: string): Observable<Tercero> {
    return this.http.get<Tercero>(`${this.base}/${id}`);
  }

  crear(data: Tercero): Observable<Tercero> {
    return this.http.post<Tercero>(this.base, data);
  }

  actualizar(id: string, data: Tercero): Observable<Tercero> {
    return this.http.put<Tercero>(`${this.base}/${id}`, data);
  }

  eliminar(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }
}
