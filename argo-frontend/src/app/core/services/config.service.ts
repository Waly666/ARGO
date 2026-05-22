import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

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
  mensajePie?: string;
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
}
