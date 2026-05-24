import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Empleado {
  _id?: string;
  idEmpleado: number;
  tipoDocumento?: string;
  numeroDocumento: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  fechaNacimiento?: string;
  sexo?: string;
  correoPersonal?: string;
  correoCorporativo?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  estadoCivil?: string;
  fechaIngreso?: string;
  fechaRetiro?: string;
  tipoContrato?: string;
  salario?: number;
  epsId?: number;
  afpId?: number;
  arlId?: number;
  cajaCompensacionId?: number;
  cargoId?: number;
  departamentoId?: number;
  urlFoto?: string;
  estado?: string;
  nombreCompleto?: string;
  cargoNombre?: string;
  departamentoNombre?: string;
  epsNombre?: string;
  afpNombre?: string;
  arlNombre?: string;
  cajaNombre?: string;
  totalEgresos?: number;
  idUsuario?: string | null;
  usuarioGenerado?: UsuarioGeneradoEmpleado | null;
}

export interface UsuarioGeneradoEmpleado {
  username: string;
  passwordInicial?: string;
  rol: string;
  existente?: boolean;
}

export type EmpleadoDto = Partial<Empleado>;

export interface EmpleadoArchivosUpload {
  foto?: File;
}

const EMPLEADO_SKIP_FORM = new Set([
  '_id',
  'idEmpleado',
  'nombreCompleto',
  'cargoNombre',
  'departamentoNombre',
  'epsNombre',
  'afpNombre',
  'arlNombre',
  'cajaNombre',
  'totalEgresos',
  'idUsuario',
  'usuarioGenerado',
]);

@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/rrhh/empleados`;

  listar(opts?: { q?: string; activos?: boolean }): Observable<Empleado[]> {
    let params = new HttpParams();
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.activos === false) params = params.set('activos', 'false');
    return this.http.get<Empleado[]>(this.base, { params });
  }

  obtener(id: number | string): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.base}/${id}`);
  }

  crear(dto: EmpleadoDto, files?: EmpleadoArchivosUpload): Observable<Empleado> {
    return this.http.post<Empleado>(this.base, this.toForm(dto, files));
  }

  actualizar(id: number | string, dto: EmpleadoDto, files?: EmpleadoArchivosUpload): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.base}/${id}`, this.toForm(dto, files));
  }

  eliminar(id: number | string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }

  private toForm(data: EmpleadoDto, files?: EmpleadoArchivosUpload): FormData {
    const form = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || EMPLEADO_SKIP_FORM.has(k)) return;
      form.append(k, String(v));
    });
    if (files?.foto) form.append('foto', files.foto);
    return form;
  }
}
