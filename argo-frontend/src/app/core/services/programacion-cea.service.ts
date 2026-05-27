import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export type TipoHorasCea = 'teoria' | 'taller' | 'practica';
export type OrigenHorasCea = 'matricula' | 'hora_practica_extra';

export interface ProgramaCeaDto {
  idProg: string;
  codigoProg?: string;
  nombre: string;
  horasTeoria: number;
  horasPractica: number;
  horasTaller: number;
}

export interface BloqueHorarioCea {
  horaDesde?: string;
  horaHasta?: string;
  permiteSabado?: boolean;
  permiteDomingo?: boolean;
  permiteFestivo?: boolean;
  normal?: { horaDesde?: string; horaHasta?: string };
  sabado?: { horaDesde?: string; horaHasta?: string };
  domingo?: { horaDesde?: string; horaHasta?: string };
  festivo?: { horaDesde?: string; horaHasta?: string };
  duracionesPermitidas?: number[];
  bufferMinutos?: number;
  cupoMaximoDefault?: number;
  [key: string]: unknown;
}

export interface ConfigProgramacionCea {
  vehiculo: BloqueHorarioCea;
  aula: BloqueHorarioCea;
  taller: BloqueHorarioCea;
  actualizado?: string | null;
}

export interface TemaProgramaCeaDto {
  _id?: string;
  idProg: string;
  tipo: 'teoria' | 'taller';
  nombre: string;
  orden: number;
  horasTema?: number | null;
  activo?: boolean;
}

export interface FilaRastreoCea {
  numDoc: number;
  alumnoNombre: string;
  idProg: string;
  programaLabel: string;
  origenHoras: OrigenHorasCea;
  idServ: string;
  idMat: string;
  idLiq: string;
  servicioLabel: string;
  tipoHoras: TipoHorasCea;
  requeridas: number;
  programadas: number;
  ejecutadas: number;
  pendientes: number;
  completo: boolean;
}

export interface AlertaProgramaCea {
  idProg: string;
  programaLabel: string;
  tipo: string;
  mensaje: string;
}

export interface RastreoGlobalCea {
  total: number;
  totalPendientes: number;
  filas: FilaRastreoCea[];
  alertasPrograma: AlertaProgramaCea[];
}

export interface AlertasPendientesCea {
  total: number;
  alertasPrograma: AlertaProgramaCea[];
  items: FilaRastreoCea[];
}

export type TipoClaseCea = 'teoria' | 'taller' | 'practica';
export type EstadoClaseCea = 'PROGRAMADA' | 'EN PROCESO' | 'FINALIZADO' | 'CANCELADA';

export interface ClaseProgramadaCeaDto {
  _id: string;
  idProg: string;
  tipoClase: TipoClaseCea;
  idTema?: string | null;
  temaNombre?: string;
  fechaClase: string;
  horaDesde: string;
  horaHasta: string;
  duracionHoras?: number | null;
  idAula?: string;
  idTaller?: string;
  idVehiculo?: string;
  aulaNombre?: string;
  tallerNombre?: string;
  idEmpleadoInstructor?: number | null;
  instructorNombre?: string;
  cupoMaximo?: number | null;
  inscritos?: number;
  cupoDisponible?: number | null;
  estado: EstadoClaseCea;
  horaInicio?: string | null;
  horaFin?: string | null;
  duracionSegundos?: number | null;
  programaLabel?: string;
  observaciones?: string;
}

export interface InscripcionClaseCeaDto {
  _id: string;
  idClase: string;
  numDoc: number;
  alumnoNombre?: string;
  origenHoras: OrigenHorasCea;
  tipoHoras: TipoHorasCea;
  horasAsignadas: number;
  estado: string;
}

export interface RecursosProgramacionCea {
  aulas: { id: string; nombre: string }[];
  talleres: { id: string; nombre: string }[];
  vehiculos: { id: string; placa: string; label: string; estado?: string }[];
  instructores: { idEmpleado: number; nombreCompleto: string }[];
}

export interface ConflictoProgramacionCea {
  tipo: string;
  mensaje: string;
  idClase?: string;
}

export interface AlumnoElegibleCea {
  numDoc: number;
  alumnoNombre: string;
  pendientes: number;
  origenHoras: OrigenHorasCea;
  servicioLabel: string;
}

export interface CrearClaseCeaBody {
  idProg: string;
  tipoClase: TipoClaseCea;
  fechaClase: string;
  horaDesde: string;
  horaHasta?: string;
  duracionHoras?: number;
  idTema?: string;
  idAula?: string;
  idTaller?: string;
  idVehiculo?: string;
  idEmpleadoInstructor?: number;
  cupoMaximo?: number;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class ProgramacionCeaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/programacion-cea`;

  programas(): Observable<ProgramaCeaDto[]> {
    return this.http.get<ProgramaCeaDto[]>(`${this.base}/programas`);
  }

  obtenerConfig(): Observable<ConfigProgramacionCea> {
    return this.http.get<ConfigProgramacionCea>(`${this.base}/config`);
  }

  guardarConfig(body: Partial<ConfigProgramacionCea>): Observable<ConfigProgramacionCea> {
    return this.http.put<ConfigProgramacionCea>(`${this.base}/config`, body);
  }

  festivos(anio?: number): Observable<{ anio: number; fechas: string[] }> {
    const q = anio ? `?anio=${anio}` : '';
    return this.http.get<{ anio: number; fechas: string[] }>(`${this.base}/festivos${q}`);
  }

  listarTemas(idProg: string): Observable<TemaProgramaCeaDto[]> {
    return this.http.get<TemaProgramaCeaDto[]>(`${this.base}/temas/${encodeURIComponent(idProg)}`);
  }

  crearTema(idProg: string, body: Partial<TemaProgramaCeaDto>): Observable<TemaProgramaCeaDto> {
    return this.http.post<TemaProgramaCeaDto>(`${this.base}/temas/${encodeURIComponent(idProg)}`, body);
  }

  actualizarTema(id: string, body: Partial<TemaProgramaCeaDto>): Observable<TemaProgramaCeaDto> {
    return this.http.put<TemaProgramaCeaDto>(`${this.base}/temas/item/${encodeURIComponent(id)}`, body);
  }

  eliminarTema(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/temas/item/${encodeURIComponent(id)}`);
  }

  rastreoGlobal(soloPendientes = false): Observable<RastreoGlobalCea> {
    const q = soloPendientes ? '?soloPendientes=1' : '';
    return this.http.get<RastreoGlobalCea>(`${this.base}/rastreo${q}`);
  }

  rastreoAlumno(numDoc: number | string): Observable<{
    numDoc: number;
    alumnoNombre: string;
    filas: FilaRastreoCea[];
    alertasPrograma: AlertaProgramaCea[];
  }> {
    return this.http.get<{
      numDoc: number;
      alumnoNombre: string;
      filas: FilaRastreoCea[];
      alertasPrograma: AlertaProgramaCea[];
    }>(`${this.base}/rastreo/${encodeURIComponent(String(numDoc))}`);
  }

  alertasPendientes(): Observable<AlertasPendientesCea> {
    return this.http.get<AlertasPendientesCea>(`${this.base}/alertas-pendientes`);
  }

  recursos(): Observable<RecursosProgramacionCea> {
    return this.http.get<RecursosProgramacionCea>(`${this.base}/recursos`);
  }

  listarClases(params: {
    fecha?: string;
    desde?: string;
    hasta?: string;
    idProg?: string;
    tipoClase?: TipoClaseCea;
    estado?: EstadoClaseCea;
  }): Observable<ClaseProgramadaCeaDto[]> {
    const p = new URLSearchParams();
    if (params.fecha) p.set('fecha', params.fecha);
    if (params.desde) p.set('desde', params.desde);
    if (params.hasta) p.set('hasta', params.hasta);
    if (params.idProg) p.set('idProg', params.idProg);
    if (params.tipoClase) p.set('tipoClase', params.tipoClase);
    if (params.estado) p.set('estado', params.estado);
    const q = p.toString() ? `?${p}` : '';
    return this.http.get<ClaseProgramadaCeaDto[]>(`${this.base}/clases${q}`);
  }

  listarClasesDelDia(fecha?: string): Observable<ClaseProgramadaCeaDto[]> {
    const f = fecha || new Date().toISOString().slice(0, 10);
    return this.listarClases({ fecha: f });
  }

  obtenerClase(id: string): Observable<ClaseProgramadaCeaDto> {
    return this.http.get<ClaseProgramadaCeaDto>(`${this.base}/clases/${encodeURIComponent(id)}`);
  }

  crearClase(body: CrearClaseCeaBody): Observable<ClaseProgramadaCeaDto> {
    return this.http.post<ClaseProgramadaCeaDto>(`${this.base}/clases`, body);
  }

  cancelarClase(id: string): Observable<ClaseProgramadaCeaDto> {
    return this.http.delete<ClaseProgramadaCeaDto>(`${this.base}/clases/${encodeURIComponent(id)}`);
  }

  verificarConflictos(body: CrearClaseCeaBody, excludeId?: string): Observable<{ ok: boolean; conflictos: ConflictoProgramacionCea[]; message?: string }> {
    const q = excludeId ? `?excludeId=${encodeURIComponent(excludeId)}` : '';
    return this.http.post<{ ok: boolean; conflictos: ConflictoProgramacionCea[]; message?: string }>(
      `${this.base}/clases/verificar-conflictos${q}`,
      body,
    );
  }

  iniciarClase(id: string): Observable<ClaseProgramadaCeaDto> {
    return this.http.post<ClaseProgramadaCeaDto>(`${this.base}/clases/${encodeURIComponent(id)}/iniciar`, {});
  }

  finalizarClase(id: string): Observable<ClaseProgramadaCeaDto> {
    return this.http.post<ClaseProgramadaCeaDto>(`${this.base}/clases/${encodeURIComponent(id)}/finalizar`, {});
  }

  listarInscripciones(idClase: string): Observable<InscripcionClaseCeaDto[]> {
    return this.http.get<InscripcionClaseCeaDto[]>(`${this.base}/clases/${encodeURIComponent(idClase)}/inscripciones`);
  }

  alumnosElegibles(idClase: string, q = ''): Observable<AlumnoElegibleCea[]> {
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    return this.http.get<AlumnoElegibleCea[]>(`${this.base}/clases/${encodeURIComponent(idClase)}/alumnos-elegibles${qs}`);
  }

  inscribirAlumno(idClase: string, body: { numDoc: number | string; origenHoras?: OrigenHorasCea }): Observable<{ inscripcion: InscripcionClaseCeaDto; clase: ClaseProgramadaCeaDto }> {
    return this.http.post<{ inscripcion: InscripcionClaseCeaDto; clase: ClaseProgramadaCeaDto }>(
      `${this.base}/clases/${encodeURIComponent(idClase)}/inscribir`,
      body,
    );
  }

  quitarInscripcion(idClase: string, numDoc: number | string): Observable<{ ok: boolean; clase: ClaseProgramadaCeaDto }> {
    return this.http.delete<{ ok: boolean; clase: ClaseProgramadaCeaDto }>(
      `${this.base}/clases/${encodeURIComponent(idClase)}/inscripciones/${encodeURIComponent(String(numDoc))}`,
    );
  }
}

export function labelTipoHorasCea(t: TipoHorasCea): string {
  if (t === 'teoria') return 'Teoría';
  if (t === 'taller') return 'Taller';
  return 'Práctica';
}

export function labelOrigenHorasCea(o: OrigenHorasCea): string {
  return o === 'hora_practica_extra' ? 'Hora práctica adicional' : 'Matrícula programa';
}

export function labelTipoClaseCea(t: TipoClaseCea): string {
  if (t === 'teoria') return 'Teoría';
  if (t === 'taller') return 'Taller';
  return 'Práctica';
}

export function fmtDuracionSegundos(seg?: number | null): string {
  const s = Math.max(0, Math.floor(Number(seg) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
