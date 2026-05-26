import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface UsuarioActivo {
  idUsuario: string;
  usuario?: string;
  nombreUsuario?: string;
  rol?: string;
  ultimaActividad?: string;
  ultimaRuta?: string;
  ultimoMetodo?: string;
  ultimoCodigo?: number;
  ultimaFecha?: string;
  peticionesRecientes?: number;
  enLinea?: boolean;
}

export interface ActivosResponse {
  minutosVentana: number;
  cantidad: number;
  usuarios: UsuarioActivo[];
}

export interface RegistroActividadHttp {
  idActividad: number;
  fecha: string;
  idUsuario?: string;
  usuario?: string;
  nombreUsuario?: string;
  rol?: string;
  metodo?: string;
  ruta?: string;
  rutaBase?: string;
  codigoHttp?: number;
  duracionMs?: number;
  actividad?: string;
  ip?: string;
}

export interface HistorialActividadResponse {
  items: RegistroActividadHttp[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FiltrosHistorialActividad {
  desde?: string;
  hasta?: string;
  usuario?: string;
  idUsuario?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/actividad`;

  activos(minutos = 10): Observable<ActivosResponse> {
    const params = new HttpParams().set('minutos', String(minutos));
    return this.http.get<ActivosResponse>(`${this.base}/activos`, { params });
  }

  historial(f: FiltrosHistorialActividad = {}): Observable<HistorialActividadResponse> {
    let params = new HttpParams();
    if (f.desde) params = params.set('desde', f.desde);
    if (f.hasta) params = params.set('hasta', f.hasta);
    if (f.usuario) params = params.set('usuario', f.usuario);
    if (f.idUsuario) params = params.set('idUsuario', f.idUsuario);
    if (f.page) params = params.set('page', String(f.page));
    if (f.limit) params = params.set('limit', String(f.limit));
    return this.http.get<HistorialActividadResponse>(`${this.base}/historial`, { params });
  }
}
