import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Usuario {
  _id: string;
  username: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  rol?: string;
  activo?: boolean;
}

export interface UsuarioDto {
  username?: string;
  password?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  rol?: string;
  activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.base);
  }

  obtener(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/${id}`);
  }

  crear(dto: UsuarioDto): Observable<Usuario> {
    return this.http.post<Usuario>(this.base, dto);
  }

  actualizar(id: string, dto: UsuarioDto): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.base}/${id}`, dto);
  }

  desactivar(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }

  borrar(id: string): Observable<{ ok: boolean; message?: string }> {
    return this.http.delete<{ ok: boolean; message?: string }>(`${this.base}/${id}/permanente`);
  }

  roles(): Observable<{ id: string; label: string }[]> {
    return this.http.get<{ id: string; label: string }[]>(`${this.base}/roles`);
  }
}
