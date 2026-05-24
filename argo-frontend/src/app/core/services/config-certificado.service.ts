import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LayoutDefaultsApi, LayoutPorTipoCert } from '../constants/certificado-campos-layout';
import {
  OrientacionCertificado,
  TipoCertificadoId,
} from '../constants/tipos-certificado';

export interface PlantillaPorTipoSlot {
  orientacion: OrientacionCertificado;
  id: string | null;
}

export interface ConfigCertificado {
  nombreInstitucion?: string;
  ciudad?: string;
  nombreDirector?: string;
  nombreInstructor?: string;
  urlFirmaDirector?: string;
  urlFirmaInstructor?: string;
  prefijoCertificado?: string;
  consecutivoCertificado?: number;
  plantillaPorTipo?: Partial<Record<TipoCertificadoId, PlantillaPorTipoSlot>>;
  /** Posición y estilo de campos por tipo y orientación */
  layoutPorTipo?: LayoutPorTipoCert;
  /** Incluir QR en todos los certificados (global) */
  mostrarQr?: boolean;
  qrPosicion?: 'inferior_izquierda' | 'inferior_derecha' | 'superior_derecha' | 'superior_izquierda';
  qrTamanoPx?: number;
}

export const QR_POSICIONES_CERT = [
  { id: 'inferior_izquierda' as const, label: 'Inferior izquierda' },
  { id: 'inferior_derecha' as const, label: 'Inferior derecha' },
  { id: 'superior_derecha' as const, label: 'Superior derecha' },
  { id: 'superior_izquierda' as const, label: 'Superior izquierda' },
];

export interface PlantillaCertificado {
  _id: string;
  nombre: string;
  tipoCertificado: TipoCertificadoId;
  orientacion: OrientacionCertificado;
  urlFondo?: string;
  activa?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfigCertificadoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/config/certificado`;
  private plantillasBase = `${environment.apiUrl}/certificados/plantillas`;

  obtener(): Observable<ConfigCertificado> {
    return this.http.get<ConfigCertificado>(this.base);
  }

  guardar(data: ConfigCertificado): Observable<ConfigCertificado> {
    return this.http.put<ConfigCertificado>(this.base, data);
  }

  layoutDefaults(): Observable<LayoutDefaultsApi> {
    return this.http.get<LayoutDefaultsApi>(`${this.base}/layout-defaults`);
  }

  vistaPrevia(body: {
    tipo: TipoCertificadoId;
    orientacion: OrientacionCertificado;
    layoutPorTipo?: LayoutPorTipoCert;
    urlFondo?: string;
  }): Observable<string> {
    return this.http.post(`${this.base}/vista-previa`, body, { responseType: 'text' });
  }

  guardarFirmas(form: FormData): Observable<ConfigCertificado> {
    return this.http.put<ConfigCertificado>(`${this.base}/firmas`, form);
  }

  listarPlantillas(tipo?: TipoCertificadoId): Observable<PlantillaCertificado[]> {
    const q = tipo ? `?tipo=${encodeURIComponent(tipo)}` : '';
    return this.http.get<PlantillaCertificado[]>(`${this.plantillasBase}${q}`);
  }

  listarPlantillasTodas(): Observable<PlantillaCertificado[]> {
    return this.http.get<PlantillaCertificado[]>(`${this.plantillasBase}/todas`);
  }

  crearPlantilla(form: FormData): Observable<PlantillaCertificado> {
    return this.http.post<PlantillaCertificado>(`${this.plantillasBase}`, form);
  }

  actualizarPlantilla(id: string, form: FormData): Observable<PlantillaCertificado> {
    return this.http.put<PlantillaCertificado>(`${this.plantillasBase}/${id}`, form);
  }

  eliminarPlantilla(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.plantillasBase}/${id}`);
  }

  urlFondo(path?: string): string {
    if (!path) return '';
    const p = path.replace(/^\//, '');
    return `${environment.uploadsUrl}/${p}`;
  }
}
