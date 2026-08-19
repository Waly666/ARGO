import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export type TipoReferidorComercial = 'gestor' | 'empresa';

export interface ReferidorChartItem {
  label: string;
  value: number;
}

export interface ReferidorResumenRow {
  referidorId: string;
  nombre: string;
  matriculas: number;
  totalPagado: number;
  certificados: number;
  pendienteCobro: number;
}

export interface ReferidorInformeDashboard {
  tipo: TipoReferidorComercial;
  periodo: { desde: string | null; hasta: string | null; activo: boolean };
  kpis: {
    totalPagado: number;
    totalCertificados: number;
    matriculasComerciales: number;
    referidoresActivos: number;
    pendienteCobro: number;
  };
  charts: {
    pagosPorMes: ReferidorChartItem[];
    certificadosPorMes: ReferidorChartItem[];
    pagosPorPrograma: ReferidorChartItem[];
    certificadosPorPrograma: ReferidorChartItem[];
  };
  resumen: ReferidorResumenRow[];
  detalle: {
    pagos: {
      fecha: string;
      numDoc: number;
      programa: string;
      referidor: string;
      referidorId: string;
      valor: number;
      numRecibo: string;
    }[];
    certificados: {
      fechaEmision: string;
      numDoc: number;
      nombre: string;
      programa: string;
      tipoCertificado: string;
      codigoCert: string;
      referidor: string;
      referidorId: string;
    }[];
    matriculas: {
      fechaMat: string;
      numDoc: number;
      programa: string;
      referidor: string;
      referidorId: string;
      valorMat: number;
      abonado: number;
      saldo: number;
      tarifa: number;
    }[];
  };
}

export interface ReferidorInformeFiltros {
  tipo: TipoReferidorComercial;
  desde?: string;
  hasta?: string;
  idPrograma?: string;
  idTipCap?: string;
  tipoFormatoCert?: string;
  referidorId?: string;
}

@Injectable({ providedIn: 'root' })
export class ReferidorComercialService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/referidor-comercial`;

  dashboard(filtros: ReferidorInformeFiltros): Observable<ReferidorInformeDashboard> {
    let params = new HttpParams().set('tipo', filtros.tipo);
    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);
    if (filtros.idPrograma) params = params.set('idPrograma', filtros.idPrograma);
    if (filtros.idTipCap) params = params.set('idTipCap', filtros.idTipCap);
    if (filtros.tipoFormatoCert) params = params.set('tipoFormatoCert', filtros.tipoFormatoCert);
    if (filtros.referidorId) params = params.set('referidorId', filtros.referidorId);
    return this.http.get<ReferidorInformeDashboard>(`${this.base}/dashboard`, { params });
  }
}
