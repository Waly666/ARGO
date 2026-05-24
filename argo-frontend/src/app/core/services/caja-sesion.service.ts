import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ResumenTipoMovimiento {
  cantidad: number;
  total: number;
  descripcion?: string;
  idTipoPago?: string;
  tipoEgreso?: string;
}

export interface ResumenCaja {
  idSesion: number;
  usuario?: string;
  idUsuario?: string;
  nombreCaja?: string;
  estado?: string;
  fechaApertura: string;
  fechaCierre?: string;
  saldoInicial: number;
  totalIngresos: number;
  totalIngresosEfectivo?: number;
  totalEgresos: number;
  totalEgresosEfectivo?: number;
  saldoTeorico: number;
  ventasBrutas?: number;
  efectivoEsperado?: number;
  totalGastos?: number;
  totalRetiros?: number;
  cantidadRecibos?: number;
  efectivoContado?: number;
  diferencia?: number;
  cantidadIngresos: number;
  cantidadEgresos: number;
  ingresosPorTipo: ResumenTipoMovimiento[];
  egresosPorTipo: ResumenTipoMovimiento[];
}

export interface CajaSesion {
  _id?: string;
  idSesion: number;
  estado: 'abierta' | 'cerrada';
  usuario?: string;
  idUsuario?: string;
  nombreCaja?: string;
  rolCajero?: string;
  fechaApertura: string;
  fechaCierre?: string;
  saldoInicial: number;
  saldoFinal?: number | null;
  efectivoContado?: number | null;
  diferencia?: number | null;
  observacionesApertura?: string;
  observacionesCierre?: string;
  resumen?: ResumenCaja;
}

export interface CajaActivaResponse {
  abierta: boolean;
  sesion: CajaSesion | null;
  resumenParcial?: ResumenCaja;
}

export interface CajaAbiertaItem {
  sesion: CajaSesion;
  resumenParcial: ResumenCaja;
}

export interface CierreCajaResponse {
  sesion: CajaSesion;
  resumen: ResumenCaja;
}

export interface ResumenCierreGeneral {
  periodoDesde: string;
  periodoHasta: string;
  cantidadCajas: number;
  cajasAbiertas: { idSesion: number; usuario?: string }[];
  tieneCajasAbiertas: boolean;
  saldoInicialTotal: number;
  totalIngresos: number;
  totalEgresos: number;
  saldoTeoricoConsolidado: number;
  cantidadIngresos: number;
  cantidadEgresos: number;
  ingresosPorTipo: ResumenTipoMovimiento[];
  egresosPorTipo: ResumenTipoMovimiento[];
  detalleSesiones: ResumenCaja[];
  idsSesiones: number[];
}

export interface CajaCierreGeneral {
  idCierreGeneral: number;
  periodoDesde: string;
  periodoHasta: string;
  fechaRegistro: string;
  usuarioAdmin?: string;
  cantidadCajas?: number;
  resumen?: ResumenCierreGeneral;
}

export interface FiltrosSesiones {
  limit?: number;
  estado?: string;
  usuario?: string;
  desde?: string;
  hasta?: string;
  todas?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CajaSesionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/caja`;

  activa(): Observable<CajaActivaResponse> {
    return this.http.get<CajaActivaResponse>(`${this.base}/sesiones/activa`);
  }

  listar(f: FiltrosSesiones = {}): Observable<CajaSesion[]> {
    let params = new HttpParams();
    if (f.limit) params = params.set('limit', String(f.limit));
    if (f.estado) params = params.set('estado', f.estado);
    if (f.usuario) params = params.set('usuario', f.usuario);
    if (f.desde) params = params.set('desde', f.desde);
    if (f.hasta) params = params.set('hasta', f.hasta);
    if (f.todas) params = params.set('todas', '1');
    return this.http.get<CajaSesion[]>(`${this.base}/sesiones`, { params });
  }

  listarAbiertas(): Observable<CajaAbiertaItem[]> {
    return this.http.get<CajaAbiertaItem[]>(`${this.base}/sesiones/abiertas`);
  }

  abrir(saldoInicial: number, observaciones?: string): Observable<CajaSesion> {
    return this.http.post<CajaSesion>(`${this.base}/sesiones/abrir`, { saldoInicial, observaciones });
  }

  cerrar(
    idSesion: number,
    opts?: { observaciones?: string; efectivoContado?: number },
  ): Observable<CierreCajaResponse> {
    return this.http.post<CierreCajaResponse>(`${this.base}/sesiones/${idSesion}/cerrar`, opts ?? {});
  }

  resumen(idSesion: number): Observable<{ sesion: CajaSesion; resumen: ResumenCaja }> {
    return this.http.get<{ sesion: CajaSesion; resumen: ResumenCaja }>(
      `${this.base}/sesiones/${idSesion}/resumen`,
    );
  }

  previewCierreGeneral(desde: string, hasta: string, soloCerradas = false): Observable<ResumenCierreGeneral> {
    let params = new HttpParams().set('desde', desde).set('hasta', hasta);
    if (soloCerradas) params = params.set('soloCerradas', '1');
    return this.http.get<ResumenCierreGeneral>(`${this.base}/cierre-general/preview`, { params });
  }

  registrarCierreGeneral(body: {
    desde: string;
    hasta: string;
    observaciones?: string;
    forzar?: boolean;
  }): Observable<{ cierre: CajaCierreGeneral; resumen: ResumenCierreGeneral }> {
    return this.http.post<{ cierre: CajaCierreGeneral; resumen: ResumenCierreGeneral }>(
      `${this.base}/cierre-general`,
      body,
    );
  }

  listarCierresGenerales(limit = 15): Observable<CajaCierreGeneral[]> {
    return this.http.get<CajaCierreGeneral[]>(`${this.base}/cierre-general`, {
      params: { limit: String(limit) },
    });
  }

  ingresosSesionActiva(): Observable<CajaIngresoItem[]> {
    return this.http.get<CajaIngresoItem[]>(`${this.base}/sesiones/activa/ingresos`);
  }

  egresosSesionActiva(): Observable<CajaEgresoItem[]> {
    return this.http.get<CajaEgresoItem[]>(`${this.base}/sesiones/activa/egresos`);
  }

  ingresosPorSesion(idSesion: number): Observable<CajaIngresoItem[]> {
    return this.http.get<CajaIngresoItem[]>(`${this.base}/sesiones/${idSesion}/ingresos`);
  }

  egresosPorSesion(idSesion: number): Observable<CajaEgresoItem[]> {
    return this.http.get<CajaEgresoItem[]>(`${this.base}/sesiones/${idSesion}/egresos`);
  }
}

export interface CajaIngresoItem {
  _id: string;
  numDoc?: number | null;
  numRecibo?: string;
  valor: number;
  fecha: string;
  tipoPagoDescr?: string;
  liquidacionDescr?: string;
  tipoAbonoDescr?: string;
  cuentaBancariaDescr?: string;
  tipoAbono?: string;
  idTipoPago?: string;
  idSesion?: number;
  esIngresoCaja?: boolean;
  tipoIngresoDescr?: string;
  tipoIngreso?: string;
  concepto?: string;
  recibidoDe?: string;
  recibiDe?: string;
  pagadorDescr?: string;
  documentoTercero?: string;
  formaPago?: string;
  numComprobante?: string;
  numTransferencia?: string;
  cuentaRecibe?: string;
}

export interface CajaEgresoItem {
  idEgreso: string;
  numRecibo?: string;
  fechaEgreso: string;
  valorEgreso: number;
  concepto: string;
  pagueA?: string;
  formaPago?: string;
  tipoEgresoDescr?: string;
  urlSoporte?: string | null;
  idSesion?: number;
}
