import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Gestor {
  _id?: string;
  nombres: string;
  apellidos: string;
  tipoGestor?: 'persona_natural' | 'empresa';
  tipoDoc?: string;
  numero: string;
  correo?: string;
  celular?: string;
  direccion?: string;
  seudonimo?: string;
  foto?: string;
  activo?: boolean;
  nombreCompleto?: string;
}

export interface GestorCatalogos {
  tiposDoc: { code: string; label: string }[];
  tiposGestor: { code: 'persona_natural' | 'empresa'; label: string }[];
}

export interface GestorArchivosUpload {
  foto?: File;
}

@Injectable({ providedIn: 'root' })
export class GestorService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/gestores`;

  catalogos(): Observable<GestorCatalogos> {
    return this.http.get<GestorCatalogos>(`${this.base}/catalogos`);
  }

  listar(q = ''): Observable<Gestor[]> {
    return this.http.get<Gestor[]>(this.base, { params: q ? { q } : {} });
  }

  obtener(id: string): Observable<Gestor> {
    return this.http.get<Gestor>(`${this.base}/${id}`);
  }

  crear(data: Gestor, files?: GestorArchivosUpload): Observable<Gestor> {
    if (files?.foto) return this.http.post<Gestor>(this.base, this.toForm(data, files));
    return this.http.post<Gestor>(this.base, data);
  }

  actualizar(id: string, data: Gestor, files?: GestorArchivosUpload): Observable<Gestor> {
    if (files?.foto) return this.http.put<Gestor>(`${this.base}/${id}`, this.toForm(data, files));
    return this.http.put<Gestor>(`${this.base}/${id}`, data);
  }

  eliminar(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }

  private toForm(data: Gestor, files?: GestorArchivosUpload): FormData {
    const form = new FormData();
    for (const [k, v] of Object.entries(data)) {
      if (v == null || k === '_id' || k === 'nombreCompleto') continue;
      form.append(k, String(v));
    }
    if (files?.foto) form.append('foto', files.foto);
    return form;
  }
}
