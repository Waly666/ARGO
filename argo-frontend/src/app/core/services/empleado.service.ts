import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { DocumentosRequeridosEmpleadoRes } from './config-requisitos-documentos-empleados.service';

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
  nivelEducativo?: string;
  tituloProfesional?: string;
  especializacion?: string;
  maestria?: string;
  doctorado?: string;
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
  idSede?: string | null;
  urlFoto?: string;
  estado?: string;
  nombreCompleto?: string;
  cargoNombre?: string;
  departamentoNombre?: string;
  sedeNombre?: string | null;
  epsNombre?: string;
  afpNombre?: string;
  arlNombre?: string;
  cajaNombre?: string;
  totalEgresos?: number;
  idUsuario?: string | null;
  usuarioLogin?: string | null;
  usuarioRol?: string | null;
  usuarioGenerado?: UsuarioGeneradoEmpleado | null;
  /** Si la ficha se guardó pero falló la sync de usuario. */
  avisoUsuario?: string | null;
}

export interface DocEmpleadoDto {
  _id?: string;
  idDocumento?: string | number;
  idEmpleado?: number;
  documento?: string;
  numero?: string;
  fechaExp?: string | null;
  fechaVence?: string | null;
  urlArchivo?: string;
  vencePronto?: boolean;
  vencido?: boolean;
  faltaFechaVence?: boolean;
  controlaVencimiento?: boolean;
  diasAvisoVencimiento?: number;
}

export interface EmpleadoEvaluacionCompetencia {
  idCompetencia?: number | null;
  codigo?: string;
  nombre?: string;
  /** null = sin calificar (no entra al promedio). */
  puntaje?: number | null;
}

export interface EmpleadoEvaluacionDto {
  _id?: string;
  idEmpleado?: number;
  fecha?: string | null;
  periodo?: string;
  puntaje?: number;
  competencias?: EmpleadoEvaluacionCompetencia[];
  tipo?: string;
  observaciones?: string;
  evaluadoPor?: string | null;
  evaluadoPorNombre?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CompetenciaDesempenoDto {
  idCompetencia: number;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  /** Vacío = todos los cargos. */
  cargosIds?: number[];
  ambito?: string;
  orden?: number;
  estado?: string;
}

export interface InformeDesempenoEmpleadoRow {
  idEmpleado: number;
  numeroDocumento: string;
  nombreCompleto: string;
  cargoNombre?: string | null;
  estado?: string | null;
  numEvaluaciones: number;
  promedio: number;
  ultimaPuntaje?: number | null;
  ultimaFecha?: string | null;
  evaluaciones?: EmpleadoEvaluacionDto[];
}

export interface InformeDesempenoRes {
  filtros: {
    desde?: string | null;
    hasta?: string | null;
    idEmpleado?: string | number | null;
    cargoId?: string | number | null;
    q?: string | null;
  };
  resumen: {
    empleadosConEval: number;
    totalEvaluaciones: number;
    promedioGeneral: number | null;
  };
  porEmpleado: InformeDesempenoEmpleadoRow[];
}

export type ModoAccesoEmpleado = 'auto' | 'ninguno' | 'vincular';

export interface EmpleadoFormExtras {
  modoAcceso?: ModoAccesoEmpleado;
  idUsuarioExistente?: string;
}

export interface UsuarioGeneradoEmpleado {
  username: string;
  passwordInicial?: string;
  rol: string;
  existente?: boolean;
  vinculado?: boolean;
}

export interface AlertaDocumentoEmpleado {
  idEmpleado: number;
  empleadoId?: string;
  nombreEmpleado: string;
  idDocumento: string;
  documento: string;
  fechaVence?: string | null;
  vencido?: boolean;
  vencePronto?: boolean;
  faltaFechaVence?: boolean;
  diasAvisoVencimiento?: number;
}

export interface AlertasDocumentosEmpleadosRes {
  docsVencidos: number;
  docsPorVencer: number;
  totalAlertas: number;
  empleadosAfectados: number;
  diasAvisoVencimiento: number;
  alertas: AlertaDocumentoEmpleado[];
}

export interface AlertaDocFaltanteEmpleado {
  idEmpleado: number;
  empleadoId?: string;
  nombreEmpleado: string;
  numeroDocumento?: string;
  esInstructor?: boolean;
  idDocumento: string;
  documento: string;
}

export interface AlertasDocsFaltantesEmpleadosRes {
  totalFaltantes: number;
  empleadosAfectados: number;
  alertas: AlertaDocFaltanteEmpleado[];
}

export type EmpleadoDto = Partial<Empleado> & EmpleadoFormExtras;

export interface EmpleadoArchivosUpload {
  foto?: File;
}

const EMPLEADO_SKIP_FORM = new Set([
  '_id',
  'idEmpleado',
  'nombreCompleto',
  'cargoNombre',
  'departamentoNombre',
  'sedeNombre',
  'epsNombre',
  'afpNombre',
  'arlNombre',
  'cajaNombre',
  'totalEgresos',
  'idUsuario',
  'usuarioLogin',
  'usuarioRol',
  'usuarioGenerado',
  'avisoUsuario',
]);

/** Campos que se envían al crear/actualizar (evita basura del objeto de lista). */
export const EMPLEADO_WRITE_FIELDS = [
  'tipoDocumento',
  'numeroDocumento',
  'primerNombre',
  'segundoNombre',
  'primerApellido',
  'segundoApellido',
  'fechaNacimiento',
  'sexo',
  'correoPersonal',
  'correoCorporativo',
  'telefono',
  'celular',
  'direccion',
  'ciudad',
  'departamento',
  'estadoCivil',
  'nivelEducativo',
  'tituloProfesional',
  'especializacion',
  'maestria',
  'doctorado',
  'fechaIngreso',
  'fechaRetiro',
  'tipoContrato',
  'salario',
  'epsId',
  'afpId',
  'arlId',
  'cajaCompensacionId',
  'cargoId',
  'departamentoId',
  'idSede',
  'estado',
  'modoAcceso',
  'idUsuarioExistente',
] as const;

export function normalizarEstadoEmpleado(raw?: string | null): string {
  const v = String(raw || 'activo').trim().toLowerCase();
  if (v === 'activo' || v === 'retirado' || v === 'suspendido') return v;
  if (/activ/.test(v)) return 'activo';
  if (/retir/.test(v)) return 'retirado';
  if (/suspen/.test(v)) return 'suspendido';
  return 'activo';
}

/** Payload limpio para POST/PUT de empleado. */
export function buildEmpleadoWritePayload(
  data: EmpleadoDto,
  extras?: EmpleadoFormExtras,
): EmpleadoDto {
  const out: Record<string, unknown> = {};
  for (const k of EMPLEADO_WRITE_FIELDS) {
    if (k === 'modoAcceso' || k === 'idUsuarioExistente') continue;
    const v = (data as Record<string, unknown>)[k];
    if (v === undefined) continue;
    out[k] = v;
  }
  if (out['estado'] != null) out['estado'] = normalizarEstadoEmpleado(String(out['estado']));
  if (extras?.modoAcceso) out['modoAcceso'] = extras.modoAcceso;
  else if (data.modoAcceso) out['modoAcceso'] = data.modoAcceso;
  if (extras?.idUsuarioExistente) out['idUsuarioExistente'] = extras.idUsuarioExistente;
  else if (data.idUsuarioExistente) out['idUsuarioExistente'] = data.idUsuarioExistente;
  return out as EmpleadoDto;
}

@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/rrhh/empleados`;
  private rrhhBase = `${environment.apiUrl}/rrhh`;

  /** Alertas globales de vencimiento — usuario autenticado con alarma correspondiente. */
  alertasDocumentos(): Observable<AlertasDocumentosEmpleadosRes> {
    return this.http.get<AlertasDocumentosEmpleadosRes>(`${this.rrhhBase}/alertas-documentos-empleados`);
  }

  alertasDocumentosFaltantes(): Observable<AlertasDocsFaltantesEmpleadosRes> {
    return this.http.get<AlertasDocsFaltantesEmpleadosRes>(`${this.rrhhBase}/alertas-documentos-empleados-faltantes`);
  }

  listar(opts?: { q?: string; activos?: boolean }): Observable<Empleado[]> {
    let params = new HttpParams();
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.activos === false) params = params.set('activos', 'false');
    return this.http.get<Empleado[]>(this.base, { params });
  }

  /** Empleados con cargo instructor (módulo Instructores). */
  listarInstructores(opts?: { q?: string; activos?: boolean }): Observable<Empleado[]> {
    let params = new HttpParams();
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.activos === false) params = params.set('activos', 'false');
    return this.http.get<Empleado[]>(`${this.rrhhBase}/instructores`, { params });
  }

  obtenerInstructor(id: number | string): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.rrhhBase}/instructores/${id}`);
  }

  obtener(id: number | string): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.base}/${id}`);
  }

  crear(dto: EmpleadoDto, files?: EmpleadoArchivosUpload): Observable<Empleado> {
    const payload = buildEmpleadoWritePayload(dto);
    if (files?.foto) return this.http.post<Empleado>(this.base, this.toForm(payload, files));
    return this.http.post<Empleado>(this.base, payload);
  }

  actualizar(id: number | string, dto: EmpleadoDto, files?: EmpleadoArchivosUpload): Observable<Empleado> {
    const payload = buildEmpleadoWritePayload(dto);
    if (files?.foto) {
      return this.http.put<Empleado>(`${this.base}/${id}`, this.toForm(payload, files));
    }
    return this.http.put<Empleado>(`${this.base}/${id}`, payload);
  }

  eliminar(id: number | string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }

  documentosRequeridos(id: number | string): Observable<DocumentosRequeridosEmpleadoRes> {
    return this.http.get<DocumentosRequeridosEmpleadoRes>(`${this.base}/${id}/documentos-requeridos`);
  }

  listarDocumentos(id: number | string): Observable<DocEmpleadoDto[]> {
    return this.http.get<DocEmpleadoDto[]>(`${this.base}/${id}/documentos`);
  }

  crearDocumento(
    id: number | string,
    data: Partial<DocEmpleadoDto>,
    archivo?: File,
  ): Observable<DocEmpleadoDto> {
    return this.http.post<DocEmpleadoDto>(`${this.base}/${id}/documentos`, this.toDocForm(data, archivo));
  }

  actualizarDocumento(
    id: number | string,
    docId: string,
    data: Partial<DocEmpleadoDto>,
    archivo?: File,
  ): Observable<DocEmpleadoDto> {
    return this.http.put<DocEmpleadoDto>(`${this.base}/${id}/documentos/${docId}`, this.toDocForm(data, archivo));
  }

  eliminarDocumento(id: number | string, docId: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}/documentos/${docId}`);
  }

  listarEvaluaciones(id: number | string): Observable<EmpleadoEvaluacionDto[]> {
    return this.http.get<EmpleadoEvaluacionDto[]>(`${this.base}/${id}/evaluaciones`);
  }

  crearEvaluacion(
    id: number | string,
    data: Partial<EmpleadoEvaluacionDto>,
  ): Observable<EmpleadoEvaluacionDto> {
    return this.http.post<EmpleadoEvaluacionDto>(`${this.base}/${id}/evaluaciones`, data);
  }

  actualizarEvaluacion(
    id: number | string,
    evalId: string,
    data: Partial<EmpleadoEvaluacionDto>,
  ): Observable<EmpleadoEvaluacionDto> {
    return this.http.put<EmpleadoEvaluacionDto>(`${this.base}/${id}/evaluaciones/${evalId}`, data);
  }

  eliminarEvaluacion(id: number | string, evalId: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}/evaluaciones/${evalId}`);
  }

  informeDesempeno(opts?: {
    desde?: string;
    hasta?: string;
    idEmpleado?: number | string;
    cargoId?: number | string;
    q?: string;
  }): Observable<InformeDesempenoRes> {
    let params = new HttpParams();
    if (opts?.desde) params = params.set('desde', opts.desde);
    if (opts?.hasta) params = params.set('hasta', opts.hasta);
    if (opts?.idEmpleado != null && opts.idEmpleado !== '') {
      params = params.set('idEmpleado', String(opts.idEmpleado));
    }
    if (opts?.cargoId != null && opts.cargoId !== '') {
      params = params.set('cargoId', String(opts.cargoId));
    }
    if (opts?.q) params = params.set('q', opts.q);
    return this.http.get<InformeDesempenoRes>(`${this.rrhhBase}/informes/desempeno`, { params });
  }

  private toDocForm(data: Partial<DocEmpleadoDto>, archivo?: File): FormData {
    const form = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || k === '_id' || k === 'idEmpleado') return;
      form.append(k, String(v));
    });
    if (archivo) form.append('archivo', archivo);
    return form;
  }

  private toForm(data: EmpleadoDto, files?: EmpleadoArchivosUpload): FormData {
    const form = new FormData();
    const payload = buildEmpleadoWritePayload(data);
    Object.entries(payload).forEach(([k, v]) => {
      if (v === undefined || EMPLEADO_SKIP_FORM.has(k)) return;
      if (v === null) {
        form.append(k, '');
        return;
      }
      form.append(k, String(v));
    });
    if (files?.foto) form.append('foto', files.foto);
    return form;
  }
}
