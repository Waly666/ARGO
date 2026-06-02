import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Programa {
  _id?: string;
  idPrograma: number | string;
  codigoProg?: string;
  nombreProg: string;
  nomCert?: string;
  idTipCap?: string | number;
  semestres?: number | null;
  horas?: number | null;
  horasTeoria?: number | null;
  horasPractica?: number | null;
  horasTaller?: number | null;
  valorMatricula?: number;
  descripcion?: string | null;
  estado?: string;
  requistos?: string | null;
  diasVencimiento?: number;
  /** Tipo de plantilla de certificado (Config. Certificados). Vacío = automático */
  tipoCertificado?: string | null;
  fechaAudi?: string | Date;
  userAddReg?: string;
  userChangeRecord?: string;
  fechaMod?: string | Date;
}

export interface ServicioPrograma {
  idServ?: number | string;
  numSemestre?: number | null;
  tipoServ?: string | number;
  idProg?: number | string;
  descrServicio?: string;
  facturar?: string | boolean;
  iva?: number;
  tarifa1?: number;
  tarifa2?: number;
  tarifa3?: number;
  rolServicio?: string;
  usaCantidad?: boolean;
  unidadMedida?: string;
  excluirMatricula?: boolean;
  fechaAudi?: string | Date;
  userAddReg?: string;
  userChangeRecord?: string;
  fechaMod?: string | Date;
}

export interface ProgramaDto {
  codigoProg?: string;
  nombreProg: string;
  nomCert?: string;
  idTipCap: string | number | '';
  semestres?: number | null;
  horas?: number | null;
  horasTeoria?: number | null;
  horasPractica?: number | null;
  horasTaller?: number | null;
  valorMatricula?: number;
  descripcion?: string;
  estado?: string;
  requistos?: string;
  diasVencimiento?: number;
  tipoCertificado?: string | null;
  tarifa1?: number;
  tarifa2?: number;
  tarifa3?: number;
  descrServicio?: string;
  tipoServ?: string | number;
  facturar?: string;
  iva?: number;
  /** Tarifa por hora del servicio adicional de clase práctica (programas licencia de conducción). */
  tarifaHoraPractica?: number;
}

export interface ProgramaDetalle {
  programa: Programa;
  servicio: ServicioPrograma | null;
  servicios?: ServicioPrograma[];
}

@Injectable({ providedIn: 'root' })
export class ProgramaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/programas`;

  listar(opts?: { q?: string; activos?: boolean; catalogo?: boolean }): Observable<Programa[]> {
    let params = new HttpParams();
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.activos === false) params = params.set('activos', 'false');
    if (opts?.catalogo) params = params.set('catalogo', '1');
    return this.http.get<Programa[]>(this.base, { params });
  }

  obtener(id: string | number): Observable<ProgramaDetalle> {
    return this.http.get<ProgramaDetalle>(`${this.base}/${id}`);
  }

  crear(dto: ProgramaDto): Observable<ProgramaDetalle & { message?: string }> {
    return this.http.post<ProgramaDetalle & { message?: string }>(this.base, dto);
  }

  actualizar(
    id: string | number,
    dto: ProgramaDto,
  ): Observable<ProgramaDetalle & { message?: string }> {
    return this.http.put<ProgramaDetalle & { message?: string }>(`${this.base}/${id}`, dto);
  }

  eliminar(id: string | number): Observable<{ ok: boolean; message?: string }> {
    return this.http.delete<{ ok: boolean; message?: string }>(`${this.base}/${id}`);
  }
}
