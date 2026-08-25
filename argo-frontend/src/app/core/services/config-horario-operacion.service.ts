import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface VentanaHorario {
  id: string;
  dias: number[];
  horaInicio: string;
  horaFin: string;
}

export interface ReglaHorarioRol extends VentanaHorario {
  rol: string;
}

export interface ConfigHorarioOperacion {
  activo: boolean;
  zonaHoraria: string;
  minutosGracia: number;
  extenderSiCajaAbierta: boolean;
  mensajeFueraHorario: string;
  mensajeGracia: string;
  reglasGenerales: VentanaHorario[];
  reglasPorRol: ReglaHorarioRol[];
}

export interface HorarioOperacionEstado {
  estado: 'permitido' | 'gracia' | 'bloqueado' | 'inactivo';
  mensaje?: string;
  minutosGraciaRestantes?: number;
  graciaFinIso?: string;
  cajaAbierta?: boolean;
  proximaApertura?: string | null;
  code?: string;
}

export interface HorarioOperacionCatalogos {
  dias: { id: number; label: string }[];
  roles: { codigo: string; nombre: string }[];
}

@Injectable({ providedIn: 'root' })
export class ConfigHorarioOperacionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/config/horario-operacion`;

  catalogos(): Observable<HorarioOperacionCatalogos> {
    return this.http.get<HorarioOperacionCatalogos>(`${this.base}/catalogos`);
  }

  obtener(): Observable<ConfigHorarioOperacion> {
    return this.http.get<ConfigHorarioOperacion>(this.base);
  }

  guardar(body: ConfigHorarioOperacion): Observable<ConfigHorarioOperacion> {
    return this.http.put<ConfigHorarioOperacion>(this.base, body);
  }

  estado(): Observable<HorarioOperacionEstado> {
    return this.http.get<HorarioOperacionEstado>(`${this.base}/estado`);
  }
}
