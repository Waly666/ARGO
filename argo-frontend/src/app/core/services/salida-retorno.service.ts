import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export type EstadoSalida = 'programado' | 'autorizado' | 'en_curso' | 'finalizado' | 'cancelado';
export type MotivoSalida = 'clase' | 'mantenimiento' | 'diligencia' | 'otro';

export interface RegistroSalida {
  _id: string;
  numeroRegistro: string;
  placa: string;
  idEmpleadoConductor: number;
  nombreConductor: string;
  motivo: MotivoSalida;
  claseId?: string | null;
  claseResumen?: string;
  alumnoNumDoc?: number | null;
  alumnoNombre?: string;
  origen?: string;
  destino?: string;
  fechaHoraSalida?: string | null;
  kilometrajeInicial?: number | null;
  inspeccionId?: string | null;
  inspeccionResultado?: string;
  fechaHoraRegreso?: string | null;
  kilometrajeFinal?: number | null;
  kilometrosRecorridos?: number | null;
  observaciones?: string;
  incidente?: string;
  estado: EstadoSalida;
  creadoPor?: string;
  cerradoPor?: string;
  cerradoEn?: string | null;
  createdAt?: string;
}

export interface ApoyosSalida {
  vehiculos: { id: string; placa: string; label: string }[];
  conductores: { idEmpleado: number; nombre: string }[];
  clases: { id: string; resumen: string; estado: string }[];
  inspecciones: { id: string; label: string; resultado: string }[];
  alumnos: { numDoc: number; nombre: string; estado: string }[];
}

@Injectable({ providedIn: 'root' })
export class SalidaRetornoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/vehiculos/salidas`;

  listar(estado = '', placa = ''): Observable<{ items: RegistroSalida[] }> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    if (placa) params = params.set('placa', placa);
    return this.http.get<{ items: RegistroSalida[] }>(this.base, { params });
  }

  apoyos(placa = '', fecha = '', claseId = ''): Observable<ApoyosSalida> {
    let params = new HttpParams();
    if (placa) params = params.set('placa', placa);
    if (fecha) params = params.set('fecha', fecha);
    if (claseId) params = params.set('claseId', claseId);
    return this.http.get<ApoyosSalida>(`${this.base}/apoyos`, { params });
  }

  crear(body: Record<string, unknown>): Observable<{ item: RegistroSalida }> {
    return this.http.post<{ item: RegistroSalida }>(this.base, body);
  }

  actualizar(id: string, body: Record<string, unknown>): Observable<{ item: RegistroSalida }> {
    return this.http.put<{ item: RegistroSalida }>(`${this.base}/${id}`, body);
  }
}
