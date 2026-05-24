import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface FspTramo {
  desdeSmmlv: number;
  hastaSmmlv: number | null;
  pct: number;
}

export interface RetencionTramo {
  hastaUvt: number | null;
  baseUvt: number;
  pct: number;
}

export interface ConfigNomina {
  vigenciaAno?: number;
  vigenciaLabel?: string;
  smlmv?: number;
  uvt?: number;
  auxilioTransporteMensual?: number;
  saludEmpleadoPct?: number;
  pensionEmpleadoPct?: number;
  saludEmpleadorPct?: number;
  pensionEmpleadorPct?: number;
  senaPct?: number;
  icbfPct?: number;
  ccfPct?: number;
  arlRiesgoPct?: Record<string, number>;
  arlRiesgoDefault?: number;
  multiploSalarioAuxilio?: number;
  retencionUmbralExentoSmmlv?: number;
  provisionCesantiasPct?: number;
  provisionPrimaPct?: number;
  provisionVacacionesPct?: number;
  provisionIntCesantiasPct?: number;
  fspTramos?: FspTramo[];
  retencionTramos?: RetencionTramo[];
  _fuente?: string;
  _actualizadoEn?: string | null;
}

export interface ConfigRecibo {
  _id?: string;
  clave?: string;
  nombreEmpresa?: string;
  nit?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  urlLogo?: string;
  prefijoFactura?: string;
  consecutivoFactura?: number;
  prefijoComprobanteIngreso?: string;
  consecutivoComprobanteIngreso?: number;
  prefijoComprobanteEgreso?: string;
  consecutivoComprobanteEgreso?: number;
  slogan1?: string;
  mensajeEncabezado?: string;
  mensajeEncabezadoEgreso?: string;
  mensajePie?: string;
  mensajePieEgreso?: string;
  mensajeCreacionAlumnoTitulo?: string;
  mensajeCreacionAlumno?: string;
  anchoReciboMm?: number;
  mostrarQr?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);

  obtenerRecibo(): Observable<ConfigRecibo> {
    return this.http.get<ConfigRecibo>(`${environment.apiUrl}/config/recibo`);
  }

  guardarRecibo(data: ConfigRecibo): Observable<ConfigRecibo> {
    return this.http.put<ConfigRecibo>(`${environment.apiUrl}/config/recibo`, data);
  }

  obtenerNomina(): Observable<ConfigNomina> {
    return this.http.get<ConfigNomina>(`${environment.apiUrl}/config/nomina`);
  }

  guardarNomina(data: ConfigNomina): Observable<ConfigNomina> {
    return this.http.put<ConfigNomina>(`${environment.apiUrl}/config/nomina`, data);
  }

  restaurarNominaDefaults(): Observable<ConfigNomina> {
    return this.http.post<ConfigNomina>(`${environment.apiUrl}/config/nomina/restaurar`, {});
  }
}
