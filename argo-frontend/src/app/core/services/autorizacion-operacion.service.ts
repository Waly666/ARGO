import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ModuloCrud } from '../utils/crud-permiso.util';

export type EstadoSolicitudAutorizacion =
  | 'pendiente'
  | 'autorizada'
  | 'rechazada'
  | 'ejecutada'
  | 'fallida'
  | 'caducada';

export interface SolicitudAutorizacion {
  idSolicitud: number;
  modulo: ModuloCrud | string;
  accion: string;
  entidad?: string;
  idEntidad: string;
  idSede?: string | null;
  resumen?: string;
  detalle?: Record<string, unknown>;
  motivo?: string | null;
  estado: EstadoSolicitudAutorizacion;
  idUsuarioSolicita?: string | null;
  usuarioSolicita?: string | null;
  nombreSolicita?: string | null;
  fechaSolicitud?: string;
  idUsuarioResuelve?: string | null;
  usuarioResuelve?: string | null;
  nombreResuelve?: string | null;
  fechaResolucion?: string;
  motivoRechazo?: string | null;
  resultadoEjecucion?: unknown;
  errorEjecucion?: string | null;
}

export interface SolicitarEliminacionDto {
  modulo: ModuloCrud;
  idEntidad: string;
  resumen: string;
  motivo?: string | null;
  detalle?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class AutorizacionOperacionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/autorizaciones`;

  listar(opts?: { estado?: string; modulo?: string; limit?: number }): Observable<SolicitudAutorizacion[]> {
    let params = new HttpParams();
    if (opts?.estado) params = params.set('estado', opts.estado);
    if (opts?.modulo) params = params.set('modulo', opts.modulo);
    if (opts?.limit) params = params.set('limit', String(opts.limit));
    return this.http.get<SolicitudAutorizacion[]>(this.base, { params });
  }

  contarPendientes(): Observable<{ pendientes: number }> {
    return this.http.get<{ pendientes: number }>(`${this.base}/pendientes/count`);
  }

  listarAlertasAdmin(): Observable<SolicitudAutorizacion[]> {
    return this.http.get<SolicitudAutorizacion[]>(`${this.base}/alertas/admin`);
  }

  listarMisAlertas(): Observable<SolicitudAutorizacion[]> {
    return this.http.get<SolicitudAutorizacion[]>(`${this.base}/alertas/mias`);
  }

  marcarVista(idSolicitud: number): Observable<SolicitudAutorizacion> {
    return this.http.post<SolicitudAutorizacion>(`${this.base}/${idSolicitud}/marcar-vista`, {});
  }

  obtener(idSolicitud: number): Observable<SolicitudAutorizacion> {
    return this.http.get<SolicitudAutorizacion>(`${this.base}/${idSolicitud}`);
  }

  solicitar(dto: SolicitarEliminacionDto): Observable<SolicitudAutorizacion> {
    return this.http.post<SolicitudAutorizacion>(`${this.base}/solicitar`, dto);
  }

  rechazar(idSolicitud: number, motivoRechazo?: string): Observable<SolicitudAutorizacion> {
    return this.http.post<SolicitudAutorizacion>(`${this.base}/${idSolicitud}/rechazar`, {
      motivoRechazo,
    });
  }

  autorizar(idSolicitud: number): Observable<{ solicitud: SolicitudAutorizacion; resultado: unknown }> {
    return this.http.post<{ solicitud: SolicitudAutorizacion; resultado: unknown }>(
      `${this.base}/${idSolicitud}/autorizar`,
      {},
    );
  }
}
