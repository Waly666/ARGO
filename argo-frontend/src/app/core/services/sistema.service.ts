import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface RespaldoMeta {
  archivo: string;
  fecha: string;
  tipo: 'manual' | 'auto' | 'pre-reset' | 'pre-restauracion' | string;
  usuario?: string | null;
  nota?: string;
  tamano: number;
  sha256?: string;
  cifrado?: boolean;
  colecciones?: number;
  totalDocs?: number;
  duracionMs?: number;
}

export interface ConfigRespaldos {
  autoHabilitado: boolean;
  horaAuto: string;
  retencionDias: number;
  cifradoActivo: boolean;
}

export interface CredencialesOperacion {
  password: string;
  codigoMfa?: string;
  confirmacion: string;
}

export interface ResultadoRestauracion {
  colecciones: number;
  docsRestaurados: number;
  archivosRestaurados: number;
  respaldoSeguridad: string | null;
  mensaje?: string;
}

export interface ResultadoReset {
  respaldoPrevio: string;
  coleccionesLimpiadas: number;
  coleccionesConservadas: number;
  usuariosEliminados: number;
  mensaje?: string;
}

export interface ErrorMigracion {
  hoja: string;
  fila: number;
  mensaje: string;
}

export type HojaMigracion = 'programas' | 'alumnos' | 'matriculas' | 'pagos' | 'certificados';

export interface ReporteValidacion {
  hojas: HojaMigracion[];
  ignoradas: string[];
  totales: Record<string, number>;
  validos: Record<string, number>;
  errores: ErrorMigracion[];
}

export interface ResultadoImportacion {
  lote: string;
  hojas: HojaMigracion[];
  ignoradas?: string[];
  programas: { creados: number; omitidos: number };
  alumnos: { creados: number; actualizados: number; omitidos: number };
  matriculas: { creadas: number; omitidas: number };
  pagos: { creados: number; omitidos: number };
  certificados: { creados: number; omitidos: number };
  filasConError: number;
  errores: ErrorMigracion[];
}

export interface LoteMigracion {
  lote: string;
  fecha: string;
  usuario: string;
  archivo: string;
  resultado?: Partial<ResultadoImportacion>;
}

@Injectable({ providedIn: 'root' })
export class SistemaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/sistema`;

  // ----- Respaldos -----
  listarRespaldos(): Observable<{ respaldos: RespaldoMeta[]; config: ConfigRespaldos }> {
    return this.http.get<{ respaldos: RespaldoMeta[]; config: ConfigRespaldos }>(`${this.base}/respaldos`);
  }

  crearRespaldo(nota = ''): Observable<RespaldoMeta> {
    return this.http.post<RespaldoMeta>(`${this.base}/respaldos`, { nota });
  }

  descargarRespaldo(archivo: string): Observable<Blob> {
    return this.http.get(`${this.base}/respaldos/${encodeURIComponent(archivo)}/descargar`, {
      responseType: 'blob',
    });
  }

  eliminarRespaldo(archivo: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/respaldos/${encodeURIComponent(archivo)}`);
  }

  restaurarRespaldo(archivo: string, cred: CredencialesOperacion): Observable<ResultadoRestauracion> {
    return this.http.post<ResultadoRestauracion>(
      `${this.base}/respaldos/${encodeURIComponent(archivo)}/restaurar`,
      cred,
    );
  }

  restaurarSubido(file: File, cred: CredencialesOperacion): Observable<ResultadoRestauracion> {
    const fd = new FormData();
    fd.append('archivo', file);
    fd.append('password', cred.password);
    fd.append('codigoMfa', cred.codigoMfa || '');
    fd.append('confirmacion', cred.confirmacion);
    return this.http.post<ResultadoRestauracion>(`${this.base}/respaldos/restaurar-subido`, fd);
  }

  guardarConfigRespaldos(cfg: Partial<ConfigRespaldos>): Observable<ConfigRespaldos> {
    return this.http.put<ConfigRespaldos>(`${this.base}/respaldos/config`, cfg);
  }

  // ----- Puesta en cero -----
  infoReset(): Observable<{ fraseConfirmacion: string }> {
    return this.http.get<{ fraseConfirmacion: string }>(`${this.base}/reset-empresa`);
  }

  resetEmpresa(cred: CredencialesOperacion): Observable<ResultadoReset> {
    return this.http.post<ResultadoReset>(`${this.base}/reset-empresa`, cred);
  }

  // ----- Migración -----
  descargarPlantilla(hojas: HojaMigracion[]): Observable<Blob> {
    return this.http.get(`${this.base}/migracion/plantilla`, {
      responseType: 'blob',
      params: { hojas: hojas.join(',') },
    });
  }

  validarMigracion(file: File, hojas: HojaMigracion[]): Observable<ReporteValidacion> {
    const fd = new FormData();
    fd.append('archivo', file);
    fd.append('hojas', hojas.join(','));
    return this.http.post<ReporteValidacion>(`${this.base}/migracion/validar`, fd);
  }

  importarMigracion(
    file: File,
    hojas: HojaMigracion[],
    actualizarExistentes: boolean,
  ): Observable<ResultadoImportacion> {
    const fd = new FormData();
    fd.append('archivo', file);
    fd.append('hojas', hojas.join(','));
    fd.append('actualizarExistentes', String(actualizarExistentes));
    return this.http.post<ResultadoImportacion>(`${this.base}/migracion/importar`, fd);
  }

  lotesMigracion(): Observable<LoteMigracion[]> {
    return this.http.get<LoteMigracion[]>(`${this.base}/migracion/lotes`);
  }
}
