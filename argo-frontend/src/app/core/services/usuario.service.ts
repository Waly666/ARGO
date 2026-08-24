import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CanalConexionUsuario } from '../utils/canal-conexion.util';

export interface Usuario {
  _id: string;
  username: string;
  nickName?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  rol?: string;
  activo?: boolean;
  idEmpleado?: number | null;
  numero?: number | null;
  numeroDocumento?: string;
  /** 2FA TOTP activo (sin exponer secretos). */
  totpEnabled?: boolean;
  sedesPermitidas?: string[];
  canalConexion?: CanalConexionUsuario;
}

export interface UsuarioDto {
  username?: string;
  password?: string;
  nombres?: string;
  apellidos?: string;
  email?: string;
  rol?: string;
  activo?: boolean;
  numeroDocumento?: string;
  numero?: number;
  sedesPermitidas?: string[];
  canalConexion?: CanalConexionUsuario;
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

  resetearMfa(id: string): Observable<{ ok: boolean; message?: string; usuario?: Usuario }> {
    return this.http.post<{ ok: boolean; message?: string; usuario?: Usuario }>(
      `${this.base}/${id}/reset-mfa`,
      {},
    );
  }

  roles(): Observable<{ id: string; label: string }[]> {
    return this.http.get<{ id: string; label: string }[]>(`${this.base}/roles`);
  }
}
