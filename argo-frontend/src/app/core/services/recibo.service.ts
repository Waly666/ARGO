import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ConfigRecibo } from './config.service';

export interface ReciboEgresoData {
  config: ConfigRecibo & { mensajeEncabezadoEgreso?: string; mensajePieEgreso?: string };
  egreso: {
    idEgreso: string;
    numRecibo?: string | null;
    fechaEgreso?: string;
    valorEgreso: number;
    pagueA?: string | null;
    numeroDocumento?: string | null;
    empleadoNombre?: string | null;
    empleadoCargo?: string | null;
    concepto: string;
    tipoEgresoDescr?: string | null;
    formaPago?: string | null;
    numTransferencia?: string | null;
    fechaTransferencia?: string | null;
    cuentaOrigenDescr?: string | null;
    cuentaDestino?: string | null;
    bancoDestinoDescr?: string | null;
    urlSoporte?: string | null;
    anticipoNomina?: string | null;
    idPeriodo?: number | null;
    userAddReg?: string;
    autorizadoPor?: string | null;
    nombreAutoriza?: string | null;
    autorizadoEn?: string | null;
  };
  numeroRecibo: string;
  qrDataUrl: string | null;
  qrTexto?: string;
}

export interface ReciboIngresoData {
  config: ConfigRecibo;
  ingreso: Record<string, unknown>;
  esIngresoCaja?: boolean;
  alumno: {
    numDoc: string;
    tipoDoc?: string;
    nombreCompleto: string;
    celular?: string;
    correo?: string;
    tipoPersona?: 'natural' | 'juridica' | null;
  };
  liquidacion: {
    descripcion?: string;
    valor: number;
    abonado: number;
    saldo: number;
    estado?: string;
  } | null;
  numeroRecibo: string;
  qrDataUrl: string | null;
  qrTexto?: string;
}

@Injectable({ providedIn: 'root' })
export class ReciboService {
  private http = inject(HttpClient);

  datos(idIngreso: string): Observable<ReciboIngresoData> {
    return this.http.get<ReciboIngresoData>(`${environment.apiUrl}/ingresos/${idIngreso}/recibo`);
  }

  datosEgreso(idEgreso: string): Observable<ReciboEgresoData> {
    return this.http.get<ReciboEgresoData>(`${environment.apiUrl}/egresos/${idEgreso}/recibo`);
  }

  abrirHtmlEgreso(idEgreso: string, onError?: (msg: string) => void): void {
    if (!idEgreso) {
      onError?.('Comprobante sin identificador.');
      return;
    }
    this.http
      .get(`${environment.apiUrl}/egresos/${idEgreso}/recibo/html`, { responseType: 'text' })
      .subscribe({
        next: (html) => {
          const w = window.open('', '_blank', 'width=420,height=820');
          if (!w) {
            onError?.('El navegador bloqueó la ventana emergente. Permita ventanas emergentes para este sitio.');
            return;
          }
          w.document.open();
          w.document.write(html);
          w.document.close();
        },
        error: (e) => onError?.(e?.error?.message || 'No se pudo generar el comprobante de egreso.'),
      });
  }

  /** Abre HTML del recibo en nueva ventana (para imprimir / reimprimir) */
  abrirHtml(idIngreso: string, onError?: (msg: string) => void): void {
    if (!idIngreso) {
      onError?.('Comprobante sin identificador.');
      return;
    }
    this.http
      .get(`${environment.apiUrl}/ingresos/${idIngreso}/recibo/html`, { responseType: 'text' })
      .subscribe({
        next: (html) => {
          const w = window.open('', '_blank', 'width=420,height=720');
          if (!w) {
            onError?.('El navegador bloqueó la ventana emergente. Permita ventanas emergentes para este sitio.');
            return;
          }
          w.document.open();
          w.document.write(html);
          w.document.close();
        },
        error: (e) => onError?.(e?.error?.message || 'No se pudo generar el comprobante.'),
      });
  }
}

/** ID de ingreso desde documento API (string u ObjectId) */
export function idIngreso(ing: { _id?: unknown; id?: unknown } | null | undefined): string {
  if (!ing) return '';
  const raw = ing._id ?? ing.id;
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null && '$oid' in raw) return String((raw as { $oid: string }).$oid);
  return String(raw);
}
