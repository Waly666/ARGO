import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ConfigPasarela {
  activo?: boolean;
  ambiente?: 'sandbox' | 'production';
  publicKey?: string;
  privateKey?: string;
  integritySecret?: string;
  eventsSecret?: string;
  idSedeVirtual?: string;
  idCuentaBancaria?: string;
  idTipoPago?: string;
  redirectUrlBase?: string;
  webhookUrl?: string;
  webhookUrlSugerida?: string;
  updatedAt?: string | null;
}

export interface MedioPagoConsignacion {
  id: string;
  etiqueta: string;
  idCuentaBancaria: string;
  urlQr?: string;
  activo?: boolean;
  orden?: number;
  instruccionesExtra?: string;
}

export interface TextosPagoConsignacion {
  tituloElegirMedio?: string;
  instruccionesPago?: string;
  textoReferenciaSugerida?: string;
  mensajeEnRevision?: string;
  mensajeAprobado?: string;
  mensajeRechazado?: string;
  plazoRevision?: string;
}

export interface ConfigPagoConsignacion {
  activo?: boolean;
  idSedeVirtual?: string;
  idTipoPago?: string;
  /** Envía correo al alumno al aprobar/rechazar (remitente = emailConfirmacion del portal). */
  enviarCorreosAlumno?: boolean;
  medios?: MedioPagoConsignacion[];
  textos?: TextosPagoConsignacion;
  updatedAt?: string | null;
}

export interface SolicitudConsignacionAdmin {
  id: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  numDoc: number | string;
  nombreAlumno?: string;
  correo?: string;
  nombreCurso?: string;
  referenciaBancaria?: string;
  bancoNombre?: string;
  medioEtiqueta?: string;
  montoCop?: number;
  motivoRechazo?: string | null;
  fechaCreacion?: string;
  fechaRevision?: string | null;
  urlComprobante?: string;
  idIngreso?: string | null;
}

export interface InformeMatriculasVirtuales {
  resumen: {
    totalMatriculas: number;
    pagadas: number;
    pendientes: number;
    valorTotal: number;
    saldoPendiente: number;
  };
  filas: Array<{
    idMatricula: string;
    numDoc: number | string;
    idPrograma?: string;
    fechaMatricula?: string;
    valorMatricula: number;
    pagada: string;
    saldo: number;
    abonado: number;
  }>;
  desde?: string | null;
  hasta?: string | null;
}

export interface InformeIngresosEnLinea {
  resumen: { cantidad: number; total: number };
  porDia: Array<{ dia: string; total: number }>;
  filas: Array<{
    idIngreso: string;
    numDoc: number | string;
    numRecibo?: string;
    valor: number;
    fecha?: string;
    concepto?: string;
    recibiDe?: string | null;
    wompiTransactionId?: string | null;
    pagoEnLineaReference?: string | null;
    idSesion?: number | null;
  }>;
  desde?: string | null;
  hasta?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PasarelaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/pasarela`;

  obtenerConfig(): Observable<ConfigPasarela> {
    return this.http.get<ConfigPasarela>(`${this.base}/config`);
  }

  guardarConfig(dto: ConfigPasarela): Observable<ConfigPasarela> {
    return this.http.put<ConfigPasarela>(`${this.base}/config`, dto);
  }

  informeMatriculas(desde?: string, hasta?: string): Observable<InformeMatriculasVirtuales> {
    const p = new URLSearchParams();
    if (desde) p.set('desde', desde);
    if (hasta) p.set('hasta', hasta);
    const q = p.toString();
    return this.http.get<InformeMatriculasVirtuales>(
      `${this.base}/informes/matriculas${q ? `?${q}` : ''}`,
    );
  }

  informeIngresos(
    desde?: string,
    hasta?: string,
    extra?: { q?: string; numDoc?: string; numRecibo?: string; referencia?: string },
  ): Observable<InformeIngresosEnLinea> {
    const p = new URLSearchParams();
    if (desde) p.set('desde', desde);
    if (hasta) p.set('hasta', hasta);
    if (extra?.q) p.set('q', extra.q);
    if (extra?.numDoc) p.set('numDoc', extra.numDoc);
    if (extra?.numRecibo) p.set('numRecibo', extra.numRecibo);
    if (extra?.referencia) p.set('referencia', extra.referencia);
    const q = p.toString();
    return this.http.get<InformeIngresosEnLinea>(`${this.base}/informes/ingresos${q ? `?${q}` : ''}`);
  }

  exportMatriculas(desde?: string, hasta?: string): Observable<Blob> {
    const p = new URLSearchParams();
    if (desde) p.set('desde', desde);
    if (hasta) p.set('hasta', hasta);
    const q = p.toString();
    return this.http.get(`${this.base}/informes/matriculas/export${q ? `?${q}` : ''}`, {
      responseType: 'blob',
    });
  }

  exportIngresos(
    desde?: string,
    hasta?: string,
    extra?: { q?: string; numDoc?: string; numRecibo?: string; referencia?: string },
  ): Observable<Blob> {
    const p = new URLSearchParams();
    if (desde) p.set('desde', desde);
    if (hasta) p.set('hasta', hasta);
    if (extra?.q) p.set('q', extra.q);
    if (extra?.numDoc) p.set('numDoc', extra.numDoc);
    if (extra?.numRecibo) p.set('numRecibo', extra.numRecibo);
    if (extra?.referencia) p.set('referencia', extra.referencia);
    const q = p.toString();
    return this.http.get(`${this.base}/informes/ingresos/export${q ? `?${q}` : ''}`, {
      responseType: 'blob',
    });
  }

  obtenerConfigConsignacion(): Observable<ConfigPagoConsignacion> {
    return this.http.get<ConfigPagoConsignacion>(`${this.base}/consignacion/config`);
  }

  guardarConfigConsignacion(dto: ConfigPagoConsignacion): Observable<ConfigPagoConsignacion> {
    return this.http.put<ConfigPagoConsignacion>(`${this.base}/consignacion/config`, dto);
  }

  subirQrConsignacion(medioId: string, file: File): Observable<{ config: ConfigPagoConsignacion; urlQr: string }> {
    const fd = new FormData();
    fd.append('qr', file);
    return this.http.post<{ config: ConfigPagoConsignacion; urlQr: string }>(
      `${this.base}/consignacion/medios/${encodeURIComponent(medioId)}/qr`,
      fd,
    );
  }

  listarSolicitudesConsignacion(estado = 'pendiente', q?: string): Observable<SolicitudConsignacionAdmin[]> {
    const p = new URLSearchParams();
    if (estado) p.set('estado', estado);
    if (q) p.set('q', q);
    const qs = p.toString();
    return this.http.get<SolicitudConsignacionAdmin[]>(
      `${this.base}/consignacion/solicitudes${qs ? `?${qs}` : ''}`,
    );
  }

  aprobarSolicitudConsignacion(id: string): Observable<{ message?: string; numRecibo?: string }> {
    return this.http.post<{ message?: string; numRecibo?: string }>(
      `${this.base}/consignacion/solicitudes/${encodeURIComponent(id)}/aprobar`,
      {},
    );
  }

  rechazarSolicitudConsignacion(id: string, motivoRechazo: string): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(
      `${this.base}/consignacion/solicitudes/${encodeURIComponent(id)}/rechazar`,
      { motivoRechazo },
    );
  }
}
