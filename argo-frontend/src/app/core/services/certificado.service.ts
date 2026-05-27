import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { formatNumDoc, parseNumDocForApi } from '../utils/num-doc.helpers';

export interface CertificadoCrearDto {
  numDoc: number | string;
  idLiquidacion: string;
  idPlantilla?: string;
  numActa?: string;
  numFolio?: string;
  numRunt?: string;
  fechaEmision?: string;
  observaciones?: string;
}

export interface CertificadoActualizarDto {
  /** Regular | Jornada Capacitacion */
  tipoCertificado?: string;
  encabezado?: string;
  numActa?: string;
  numFolio?: string;
  numRunt?: string;
  fechaEmision?: string;
  fechaVencimiento?: string | null;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class CertificadoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/certificados`;

  tiposCertificado(): Observable<{ id: string; label: string }[]> {
    return this.http.get<{ id: string; label: string }[]>(`${this.base}/tipos`);
  }

  plantillas(tipo?: string): Observable<any[]> {
    const q = tipo ? `?tipo=${encodeURIComponent(tipo)}` : '';
    return this.http.get<any[]>(`${this.base}/plantillas${q}`);
  }

  elegibles(numDoc: number | string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/elegibles/${encodeURIComponent(formatNumDoc(numDoc))}`);
  }

  listarPorAlumno(numDoc: number | string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/alumno/${encodeURIComponent(formatNumDoc(numDoc))}`);
  }

  /** Todos los certificados emitidos desde una fecha (alertas globales). */
  listarRecientes(desde: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/recientes`, {
      params: { desde },
    });
  }

  crear(dto: CertificadoCrearDto): Observable<any> {
    const numDoc = parseNumDocForApi(dto.numDoc);
    return this.http.post(this.base, { ...dto, numDoc: numDoc ?? dto.numDoc });
  }

  actualizar(id: string, dto: CertificadoActualizarDto): Observable<any> {
    return this.http.put(`${this.base}/${id}`, dto);
  }

  eliminar(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }

  abrirHtml(id: string, onError?: (msg: string) => void): void {
    const url = `${this.base}/${id}/html?v=${Date.now()}`;
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (html) => {
        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) {
          onError?.('Permita ventanas emergentes para imprimir el certificado.');
          return;
        }
        w.document.open();
        w.document.write(html);
        w.document.close();
      },
      error: (e) => onError?.(e?.error?.message || 'No se pudo generar el certificado.'),
    });
  }
}
