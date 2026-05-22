import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ConfigRecibo } from './config.service';

export interface ReciboIngresoData {
  config: ConfigRecibo;
  ingreso: Record<string, unknown>;
  alumno: {
    numDoc: string;
    tipoDoc?: string;
    nombreCompleto: string;
    celular?: string;
    correo?: string;
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
