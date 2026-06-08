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

  abrirHtmlEgreso(idEgreso: string, onError?: (msg: string) => void): boolean {
    if (!idEgreso) {
      onError?.('Comprobante sin identificador.');
      return false;
    }
    return this.abrirHtmlEnVentana(
      `${environment.apiUrl}/egresos/${idEgreso}/recibo/html?v=${Date.now()}`,
      'width=420,height=820',
      onError,
      'No se pudo generar el comprobante de egreso.',
    );
  }

  /** Abre HTML del recibo en nueva ventana (para imprimir / reimprimir). Devuelve false si el popup fue bloqueado. */
  abrirHtml(idIngreso: string, onError?: (msg: string) => void): boolean {
    if (!idIngreso) {
      onError?.('Comprobante sin identificador.');
      return false;
    }
    return this.abrirHtmlEnVentana(
      `${environment.apiUrl}/ingresos/${idIngreso}/recibo/html?v=${Date.now()}`,
      'width=420,height=720',
      onError,
      'No se pudo generar el comprobante.',
    );
  }

  /** Abre la ventana en el mismo gesto del clic; luego carga el HTML (evita bloqueo de popups). */
  private abrirHtmlEnVentana(
    url: string,
    features: string,
    onError: ((msg: string) => void) | undefined,
    mensajeError: string,
  ): boolean {
    const w = window.open('', '_blank', features);
    if (!w) {
      onError?.('El navegador bloqueó la ventana emergente. Permita ventanas emergentes para este sitio.');
      return false;
    }
    try {
      w.document.open();
      w.document.write('<p style="font-family:sans-serif;padding:1rem">Cargando comprobante…</p>');
      w.document.close();
    } catch {
      /* ventana en blanco */
    }

    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (html) => {
        try {
          w.document.open();
          w.document.write(html);
          w.document.close();
        } catch {
          w.close();
          onError?.('No se pudo mostrar el comprobante en la ventana.');
        }
      },
      error: (e) => {
        try {
          w.close();
        } catch {
          /* ignore */
        }
        onError?.(e?.error?.message || mensajeError);
      },
    });
    return true;
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
