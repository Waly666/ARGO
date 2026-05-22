import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface CertificadoCrearDto {
  numDoc: string;
  idLiquidacion: string;
  idPlantilla?: string;
  numActa?: string;
  numFolio?: string;
  numRunt?: string;
  fechaEmision?: string;
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

  elegibles(numDoc: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/elegibles/${encodeURIComponent(numDoc)}`);
  }

  listarPorAlumno(numDoc: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/alumno/${encodeURIComponent(numDoc)}`);
  }

  crear(dto: CertificadoCrearDto): Observable<any> {
    return this.http.post(this.base, dto);
  }

  eliminar(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }

  abrirHtml(id: string, onError?: (msg: string) => void): void {
    this.http.get(`${this.base}/${id}/html`, { responseType: 'text' }).subscribe({
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
