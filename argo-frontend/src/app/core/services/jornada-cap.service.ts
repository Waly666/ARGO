import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { formatNumDoc, parseNumDocForApi } from '../utils/num-doc.helpers';
import type { AlumnoListItem } from './alumno.service';

export interface AlumnoClaseAnteriorItem {
  numDoc: number;
  nombreCompleto?: string;
  yaInscritoEnEstaClase?: boolean;
  yaCertificadoContrato?: boolean;
  /** Si false, no se puede matricular (certificado global o ya en esta clase). */
  puedeMatricular?: boolean;
  certificadoCodigo?: string | null;
}

export interface ClaseAnteriorResumenDto {
  _id: string;
  indiceClaseEnJornada?: number | null;
  programaNombre?: string;
  carpaNombre?: string;
  estado?: string;
  fechaClase?: string | Date | null;
  fechaJornada?: string | Date | null;
}

export interface AlumnosClaseAnteriorRespuestaDto {
  clase: ClaseAnteriorResumenDto | null;
  alumnos: AlumnoClaseAnteriorItem[];
}

export interface CuotaPlanCobroDto {
  id: string;
  etiqueta?: string;
  valor: number;
  orden?: number;
  idIngreso?: string | null;
  pagadoAt?: string | null;
  pagado?: boolean;
}

export interface EstadoCobroContratoDto {
  valorContrato: number;
  comprobantesIngresoCaja: boolean;
  planCobro: CuotaPlanCobroDto[];
  totalCuotas: number;
  totalPagado: number;
  saldoPendiente: number;
  cuentaCobro: { numero: string; generadaAt?: string | null } | null;
}

export interface ContratacionDto {
  _id?: string;
  tipoIdentificacion?: string;
  numeroIdentificacion?: string;
  codContrato?: string;
  razoSocial?: string;
  nombreComercial?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  codMunicipio?: string;
  departamento?: string;
  pais?: string;
  codigoPostal?: string;
  /** 'En Ejecución' | 'Ejecutado' */
  estado?: string;
  /** Fecha de cierre del contrato (ISO o YYYY-MM-DD). */
  fechaFinalizacion?: string;
  fechacontrato?: string;
  objeto?: string;
  objetoContrato?: string;
  supervisor?: string;
  idSupervisor?: string | null;
  numerojornadas?: number;
  /** Cuántas jornadas se generan el mismo día calendario. */
  jornadasPorDia?: number;
  /** Clases autogeneradas por jornada. */
  clasesPorJornada?: number;
  /** Intensidad horaria impresa en certificado (modo por_clase); no define duración de la sesión. */
  horasPorClase?: number;
  /** global | por_clase */
  tipoCertificado?: string;
  numeroAlumnos?: number;
  numeObjeJornada?: number;
  nombreCertificacion?: string;
  numeroHorascert?: string;
  incluiSab?: boolean;
  incluiDom?: boolean;
  incluiFest?: boolean;
  fechaInicJornadas?: string;
  /** Último día para programar jornadas (planificación). */
  fechaFinJornadas?: string;
  numSesCert?: number;
  /** Programas del contrato para reparto equitativo al autogenerar clases. */
  idProgramas?: string[];
  jornadasGeneradas?: boolean;
  /** Jornadas ya creadas en BD (informativo). */
  jornadasExistentes?: number;
  /** juridica_empresa | juridica_oficial | juridica_ong | persona_natural */
  idClienteFacturacion?: string | null;
  /** Nombre mostrado en listados (desde catálogo clientes). */
  clienteNombre?: string;
  clienteIdentificacion?: string | null;
  valorContrato?: number;
  /** Preferencia: comprobantes de ingreso entran a caja por defecto. */
  comprobantesIngresoCaja?: boolean;
  planCobro?: CuotaPlanCobroDto[];
  cuentaCobroNumero?: string;
  cuentaCobroGeneradaAt?: string;
  idFacturaElectronica?: string | null;
  facturadoAt?: string;
}

export interface AvanceContratoResumenDto {
  jornadasProgramadas: number;
  jornadasMeta: number;
  clasesTotales: number;
  clasesDictadas: number;
  clasesEnProceso: number;
  clasesProgramadas: number;
  clasesFaltanDictar: number;
  metaClasesContrato: number;
  clasesFaltanMeta: number | null;
  alumnosCapacitados: number;
  alumnosCertificados: number;
  numeroAlumnosMeta: number;
  numSesCert: number;
  tipoCertificado: string;
}

export interface AvanceContratoAlumnoDto {
  numDoc: number;
  nombreCompleto: string;
  clasesAsistidas: number;
  certificado: boolean;
  certificadosEmitidos: number;
  codigosCertificado: string[];
  cumplioSesiones: boolean;
  faltanSesiones: number;
}

export interface AvanceContratoDto {
  resumen: AvanceContratoResumenDto;
  alumnos: AvanceContratoAlumnoDto[];
}

export interface InformeDashboardKpis {
  jornadas: number;
  clasesTotales: number;
  clasesDictadas: number;
  clasesEnProceso: number;
  alumnosCapacitados: number;
  alumnosCertificados: number;
  certificadosEmitidos: number;
  metaAlumnos: number;
  metaJornadas: number;
}

export interface InformeDashboardChartItem {
  label: string;
  value: number;
}

export interface InformeDashboardAlumno {
  numDoc: number;
  nombreCompleto: string;
  certificado?: boolean;
}

export interface InformeDashboardClase {
  _id: string;
  idJornada: string;
  fechaLabel: string;
  programaNombre: string;
  instructorNombre: string;
  estado: string;
  alumnosInscritos: number;
  alumnosCertificados: number;
  alumnos: InformeDashboardAlumno[];
}

export interface InformeDashboardDto {
  contrato: {
    _id: string;
    codContrato?: string;
    cliente?: string;
    nit?: string;
    ciudad?: string;
    objetoContrato?: string;
    estado?: string;
    tipoCertificado?: string;
  };
  empresaCapacitadora?: { nombre?: string };
  filtros?: Record<string, string | number | null>;
  kpis: InformeDashboardKpis;
  charts: {
    clasesPorEstado: InformeDashboardChartItem[];
    alumnosPorJornada: InformeDashboardChartItem[];
    alumnosPorPrograma: InformeDashboardChartItem[];
    clasesPorInstructor: InformeDashboardChartItem[];
  };
  porJornada: Array<{
    _id: string;
    fechaLabel: string;
    municipio?: string;
    estado?: string;
    numClases: number;
    alumnosCapacitados: number;
    alumnosCertificados: number;
    clases: InformeDashboardClase[];
  }>;
  porClase: InformeDashboardClase[];
  porPrograma: Array<{
    idPrograma: string;
    programaNombre: string;
    numClases: number;
    clasesDictadas: number;
    alumnosCapacitados: number;
    alumnosCertificados: number;
  }>;
  porInstructor: Array<{
    idEmpleadoInstructor?: number | null;
    instructorNombre: string;
    numClases: number;
    clasesDictadas: number;
    alumnosCapacitados: number;
  }>;
  opciones: {
    jornadas: Array<{ value: string; label: string }>;
    clases: Array<{ value: string; label: string; idJornada?: string }>;
    programas: Array<{ value: string; label: string }>;
    instructores: Array<{ value: string; label: string }>;
  };
  generadoAt?: string;
}

export type InformeContratoAlcance = 'contrato' | 'jornada' | 'clase' | 'programa' | 'instructor';

export interface ConfigOperacionJornadas {
  operacionFueraDeDiaHabilitada: boolean;
  /** idServ del catálogo para comprobantes y facturas de contratos de capacitación. */
  idServCapacitacionContrato: string;
}

export interface EstadoOperacionJornadas {
  operacionFueraDeDiaHabilitada: boolean;
  puedeUsar: boolean;
  motivo?: string | null;
}

/** Contadores del contrato recalculados tras jornadas/clases extra. */
export interface ContratoSyncDto {
  _id: string;
  numerojornadas?: number;
  jornadasPorDia?: number;
  numeObjeJornada?: number;
  clasesPorJornada?: number;
  jornadasGeneradas?: boolean;
  /** Jornadas ya creadas en BD (informativo). */
  jornadasExistentes?: number;
}

export interface JornadaCapDto {
  _id: string;
  idContrato: string;
  fechaProgramacion: string;
  municipio?: string;
  depto?: string;
  codMunicipio?: string;
  direccion?: string;
  supervisor?: string;
  estado: string;
  numeObjeJornada?: number;
  indiceEnDia?: number;
  lat?: number | null;
  lng?: number | null;
  /** MAPA | DISPOSITIVO_MOVIL | MANUAL */
  deteGeorefe?: string;
  contratoLabel?: string;
  codContrato?: string;
  clienteNombre?: string;
  /** Meta total alumnos del contrato. */
  numeroAlumnos?: number;
  /** Certificados vigentes del contrato (alumnos distintos). */
  certificadosContrato?: number;
  cumplidoContrato?: boolean;
  /** Certificados vigentes atribuidos a esta jornada. */
  certificadosJornada?: number;
  cumplidoJornada?: boolean;
}

export interface ClaseJornadaDto {
  _id: string;
  idJornada: string;
  idPrograma: string;
  fechaClase?: string;
  ubicacion?: string;
  /** Carpa del catálogo (heredada del programa). */
  idCarpa?: number | null;
  carpaNombre?: string;
  idinstructor?: string;
  idEmpleadoInstructor?: number | null;
  idUsuarioInstructor?: string;
  instructorNombre?: string;
  programaNombre?: string;
  horaInicio?: string;
  horaFin?: string;
  duracionSegundos?: number | null;
  estado: string;
  fechaJornada?: string;
  jornadaEstado?: string;
  idContrato?: string;
  municipioJornada?: string;
  direccionJornada?: string;
  indiceEnDia?: number;
  codContrato?: string;
  contratoLabel?: string;
  /** Ruta relativa bajo uploads/ (evidenciascap/{codContrato}/fotos/...). */
  urlforo?: string;
}

export interface InstructorJornadaDto {
  idEmpleado: number;
  idUsuario: string;
  nombreCompleto: string;
  numeroDocumento?: string;
  cargo?: string;
}

export interface InformesJornadaResumen {
  totalFilasClase: number;
  alumnosUnicos: number;
  registrosAsistencia: number;
  registrosInscripcion: number;
  certificados: number;
  contratos?: number;
  jornadas?: number;
  instructores?: number;
}

export interface InformesJornadaResp {
  filtros: {
    idContrato?: string | null;
    idJornada?: string | null;
    idClase?: string | null;
    desde?: string | null;
    hasta?: string | null;
  };
  resumen: InformesJornadaResumen;
  /** Detalle alumno×clase (solo uso interno / trazabilidad). */
  porClase?: Record<string, unknown>[];
  trazabilidad: Record<string, unknown>[];
  resumenContratos: Record<string, unknown>[];
  catalogoJornadas: Record<string, unknown>[];
  catalogoClases: Record<string, unknown>[];
  alumnos: Record<string, unknown>[];
  instructores: Record<string, unknown>[];
  certificados: Record<string, unknown>[];
}

@Injectable({ providedIn: 'root' })
export class JornadaCapService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/jornadas`;

  listarContratos(): Observable<ContratacionDto[]> {
    return this.http.get<ContratacionDto[]>(`${this.base}/contratos`);
  }

  crearContrato(dto: ContratacionDto): Observable<ContratacionDto> {
    return this.http.post<ContratacionDto>(`${this.base}/contratos`, dto);
  }

  actualizarContrato(id: string, dto: ContratacionDto): Observable<ContratacionDto> {
    return this.http.put<ContratacionDto>(`${this.base}/contratos/${id}`, dto);
  }

  avanceContrato(id: string): Observable<AvanceContratoDto> {
    return this.http.get<AvanceContratoDto>(`${this.base}/contratos/${id}/avance`);
  }

  informeDashboardContrato(
    id: string,
    opts?: {
      idJornada?: string;
      idClase?: string;
      idPrograma?: string;
      idInstructor?: string | number;
    },
  ): Observable<InformeDashboardDto> {
    let p = new HttpParams();
    if (opts?.idJornada) p = p.set('idJornada', opts.idJornada);
    if (opts?.idClase) p = p.set('idClase', opts.idClase);
    if (opts?.idPrograma) p = p.set('idPrograma', opts.idPrograma);
    if (opts?.idInstructor != null && opts.idInstructor !== '') {
      p = p.set('idInstructor', String(opts.idInstructor));
    }
    return this.http.get<InformeDashboardDto>(`${this.base}/contratos/${id}/informe-dashboard`, {
      params: p,
    });
  }

  descargarInformeContratoPdf(
    id: string,
    opts: {
      alcance: InformeContratoAlcance;
      idJornada?: string;
      idClase?: string;
      idPrograma?: string;
      idInstructor?: string | number;
    },
  ): Observable<Blob> {
    let p = new HttpParams().set('alcance', opts.alcance);
    if (opts.idJornada) p = p.set('idJornada', opts.idJornada);
    if (opts.idClase) p = p.set('idClase', opts.idClase);
    if (opts.idPrograma) p = p.set('idPrograma', opts.idPrograma);
    if (opts.idInstructor != null && opts.idInstructor !== '') {
      p = p.set('idInstructor', String(opts.idInstructor));
    }
    return this.http.get(`${this.base}/contratos/${id}/informe-pdf`, {
      params: p,
      responseType: 'blob',
    });
  }

  eliminarContrato(id: string): Observable<{ ok: boolean; message?: string; jornadasEliminadas?: number }> {
    return this.http.delete<{ ok: boolean; message?: string; jornadasEliminadas?: number }>(
      `${this.base}/contratos/${id}`,
    );
  }

  generarJornadas(idContrato: string): Observable<{
    ok: boolean;
    count: number;
    total?: number;
    metaJornadas?: number;
    fechaDesde?: string;
    fechaFin?: string | null;
    jornadasCompletas?: boolean;
    clasesCreadas?: number;
    jornadasProcesadasClases?: number;
    contrato?: ContratoSyncDto;
  }> {
    return this.http.post<{
      ok: boolean;
      count: number;
      total?: number;
      metaJornadas?: number;
      fechaDesde?: string;
      fechaFin?: string | null;
      jornadasCompletas?: boolean;
      clasesCreadas?: number;
      jornadasProcesadasClases?: number;
      contrato?: ContratoSyncDto;
    }>(`${this.base}/contratos/${idContrato}/generar-jornadas`, {});
  }

  crearJornadaContrato(
    idContrato: string,
    dto: {
      fechaProgramacion: string;
      direccion: string;
      municipio?: string;
      depto?: string;
      codMunicipio?: string;
      lat?: number | null;
      lng?: number | null;
      deteGeorefe?: string;
      supervisor?: string;
      indiceEnDia?: number;
      generarClases?: boolean;
    },
  ): Observable<{
    jornada: JornadaCapDto;
    clasesCreadas: number;
    contrato?: ContratoSyncDto;
  }> {
    return this.http.post<{
      jornada: JornadaCapDto;
      clasesCreadas: number;
      contrato?: ContratoSyncDto;
    }>(`${this.base}/contratos/${idContrato}/jornadas`, dto);
  }

  finalizarContrato(
    id: string,
    fechaFinalizacion?: string,
  ): Observable<{
    ok: boolean;
    contrato: ContratacionDto;
    jornadasCerradas?: number;
    message?: string;
  }> {
    return this.http.post<{
      ok: boolean;
      contrato: ContratacionDto;
      jornadasCerradas?: number;
      message?: string;
    }>(`${this.base}/contratos/${id}/finalizar`, { fechaFinalizacion: fechaFinalizacion || undefined });
  }

  eliminarJornada(id: string) {
    return this.http.delete<{
      ok: boolean;
      message: string;
      restantes?: number;
      contrato?: ContratoSyncDto;
    }>(`${this.base}/jornadas/${id}`);
  }

  jornadasDelDia(fecha?: string, idContrato?: string) {
    let p = new HttpParams();
    if (fecha) p = p.set('fecha', fecha);
    if (idContrato) p = p.set('idContrato', idContrato);
    return this.http.get<any[]>(`${this.base}/jornadas/del-dia`, { params: p });
  }

  listarJornadas(params?: {
    idContrato?: string;
    desde?: string;
    hasta?: string;
    creadoDesde?: string;
  }): Observable<JornadaCapDto[]> {
    let p = new HttpParams();
    if (params?.idContrato) p = p.set('idContrato', params.idContrato);
    if (params?.desde) p = p.set('desde', params.desde);
    if (params?.hasta) p = p.set('hasta', params.hasta);
    if (params?.creadoDesde) p = p.set('creadoDesde', params.creadoDesde);
    return this.http.get<JornadaCapDto[]>(`${this.base}/jornadas`, { params: p });
  }

  listarJornadasEnProceso(): Observable<JornadaCapDto[]> {
    return this.http.get<JornadaCapDto[]>(`${this.base}/jornadas/en-proceso`);
  }

  actualizarJornada(id: string, dto: Partial<JornadaCapDto>): Observable<JornadaCapDto> {
    return this.http.patch<JornadaCapDto>(`${this.base}/jornadas/${id}`, dto);
  }

  cerrarJornadaOperacion(id: string) {
    return this.http.post<JornadaCapDto>(`${this.base}/jornadas/${id}/cerrar-operacion`, {});
  }

  reabrirJornadaOperacion(id: string) {
    return this.http.post<JornadaCapDto>(`${this.base}/jornadas/${id}/reabrir-operacion`, {});
  }

  /** Municipio/departamento según lat/lng (proveedor configurable + Divipola). */
  resolverMunicipioGeoref(lat: number, lng: number): Observable<{
    municipio: string;
    depto: string;
    codMunicipio?: string | null;
    fuente?: string;
  }> {
    const p = new HttpParams().set('lat', String(lat)).set('lng', String(lng));
    return this.http.get<{ municipio: string; depto: string; codMunicipio?: string | null; fuente?: string }>(
      `${this.base}/jornadas/georef/municipio`,
      { params: p },
    );
  }

  listarClases(opts?: {
    idJornada?: string;
    idContrato?: string;
    creadoDesde?: string;
  }): Observable<ClaseJornadaDto[]> {
    let p = new HttpParams();
    if (opts?.idJornada) p = p.set('idJornada', opts.idJornada);
    if (opts?.idContrato) p = p.set('idContrato', opts.idContrato);
    if (opts?.creadoDesde) p = p.set('creadoDesde', opts.creadoDesde);
    return this.http.get<ClaseJornadaDto[]>(`${this.base}/clases`, { params: p });
  }

  obtenerClase(id: string): Observable<ClaseJornadaDto> {
    return this.http.get<ClaseJornadaDto>(`${this.base}/clases/${id}`);
  }

  listarClasesDelDia(fecha?: string): Observable<ClaseJornadaDto[]> {
    let p = new HttpParams();
    if (fecha) p = p.set('fecha', fecha);
    return this.http.get<ClaseJornadaDto[]>(`${this.base}/clases/del-dia`, { params: p });
  }

  crearClase(dto: {
    idJornada: string;
    idPrograma: string;
    ubicacion?: string;
    idEmpleadoInstructor?: number | null;
  }) {
    return this.http.post<ClaseJornadaDto & { contrato?: ContratoSyncDto }>(`${this.base}/clases`, dto);
  }

  actualizarClase(
    id: string,
    dto: {
      idPrograma?: string;
      ubicacion?: string;
      idEmpleadoInstructor?: number | null;
      horaInicio?: string | null;
      horaFin?: string | null;
    },
  ) {
    return this.http.patch<ClaseJornadaDto>(`${this.base}/clases/${id}`, dto);
  }

  eliminarClase(id: string) {
    return this.http.delete<{
      ok: boolean;
      message: string;
      certificadosAnulados?: number;
      contrato?: ContratoSyncDto;
    }>(`${this.base}/clases/${id}`);
  }

  iniciarClase(id: string) {
    return this.http.post<ClaseJornadaDto>(`${this.base}/clases/${id}/iniciar`, {});
  }

  finalizarClase(id: string, horario?: { horaInicio?: string; horaFin?: string }) {
    return this.http.post(`${this.base}/clases/${id}/finalizar`, horario ?? {});
  }

  sincronizarAsistenciasInscritos(idClase: string) {
    return this.http.post<{
      ok: boolean;
      registradas: number;
      certificadosNuevos: number;
      certificadosEmitidos?: Array<{
        certificado: Record<string, unknown>;
        nombreAlumno?: string;
        numDoc?: number;
      }>;
      message?: string;
    }>(`${this.base}/clases/${idClase}/sincronizar-asistencias`, {});
  }

  subirFotoEvidenciaClase(id: string, file: File): Observable<ClaseJornadaDto> {
    const fd = new FormData();
    fd.append('foto', file);
    return this.http.post<ClaseJornadaDto>(`${this.base}/clases/${id}/foto-evidencia`, fd);
  }

  registrarAsistencia(idClase: string, numDoc: number | string) {
    const nd = parseNumDocForApi(numDoc);
    return this.http.post(`${this.base}/clases/${idClase}/asistencia`, { numDoc: nd ?? numDoc });
  }

  listarAsistencias(idClase: string) {
    return this.http.get<any[]>(`${this.base}/clases/${idClase}/asistencias`);
  }

  quitarInscripcionClase(idClase: string, numDoc: number | string) {
    return this.http.delete<{ ok: boolean; numDoc: number }>(
      `${this.base}/clases/${idClase}/inscritos/${numDoc}`,
    );
  }

  eliminarAsistencia(idClase: string, numDoc: number | string) {
    return this.http.delete<{ ok: boolean; numDoc: number }>(
      `${this.base}/clases/${idClase}/asistencias/${numDoc}`,
    );
  }

  inscritosClase(idClase: string) {
    return this.http.get<Array<{
      numDoc: number;
      nombreCompleto: string;
      tieneAsistencia: boolean;
      asistenciaAt?: string | null;
      fechaMatricula?: string;
      yaCertificadoContrato?: boolean;
      certificadoCodigo?: string | null;
      certificadoId?: string | null;
    }>>(`${this.base}/clases/${idClase}/inscritos`);
  }

  /** Alumnos de otra clase para copiar. Sin idClaseFuente = clase anterior auto; con id = elección manual. */
  alumnosClaseAnterior(
    idClase: string,
    idClaseFuente?: string,
  ): Observable<AlumnosClaseAnteriorRespuestaDto> {
    let p = new HttpParams();
    if (idClaseFuente) p = p.set('idClaseFuente', idClaseFuente);
    return this.http.get<AlumnosClaseAnteriorRespuestaDto>(
      `${this.base}/clases/${idClase}/inscritos-clase-anterior`,
      { params: p },
    );
  }

  certificadosGenerados(idContrato?: string) {
    let p = new HttpParams();
    if (idContrato) p = p.set('idContrato', idContrato);
    return this.http.get<any[]>(`${this.base}/certificados-generados`, { params: p });
  }

  listarCertificadosJornada(opts?: {
    idContrato?: string;
    idJornada?: string;
    idClase?: string;
    q?: string;
    desde?: string;
    hasta?: string;
  }) {
    let p = new HttpParams();
    if (opts?.idContrato) p = p.set('idContrato', opts.idContrato);
    if (opts?.idJornada) p = p.set('idJornada', opts.idJornada);
    if (opts?.idClase) p = p.set('idClase', opts.idClase);
    if (opts?.q) p = p.set('q', opts.q);
    if (opts?.desde) p = p.set('desde', opts.desde);
    if (opts?.hasta) p = p.set('hasta', opts.hasta);
    return this.http.get<any[]>(`${this.base}/certificados-generados`, { params: p });
  }

  /** Descarga ZIP de certificados PDF (individuales + todos-imprimir). */
  descargarCertificadosJornadaZip(opts?: {
    idContrato?: string;
    idJornada?: string;
    idClase?: string;
    desde?: string;
    hasta?: string;
  }): Observable<Blob> {
    let p = new HttpParams();
    if (opts?.idContrato) p = p.set('idContrato', opts.idContrato);
    if (opts?.idJornada) p = p.set('idJornada', opts.idJornada);
    if (opts?.idClase) p = p.set('idClase', opts.idClase);
    if (opts?.desde) p = p.set('desde', opts.desde);
    if (opts?.hasta) p = p.set('hasta', opts.hasta);
    return this.http.get(`${this.base}/certificados-generados/export-zip`, {
      params: p,
      responseType: 'blob',
    });
  }

  informesJornada(opts?: {
    idContrato?: string;
    idJornada?: string;
    idClase?: string;
    desde?: string;
    hasta?: string;
  }) {
    let p = new HttpParams();
    if (opts?.idContrato) p = p.set('idContrato', opts.idContrato);
    if (opts?.idJornada) p = p.set('idJornada', opts.idJornada);
    if (opts?.idClase) p = p.set('idClase', opts.idClase);
    if (opts?.desde) p = p.set('desde', opts.desde);
    if (opts?.hasta) p = p.set('hasta', opts.hasta);
    return this.http.get<InformesJornadaResp>(`${this.base}/informes`, { params: p });
  }

  exportarInformesJornada(opts?: {
    idContrato?: string;
    idJornada?: string;
    idClase?: string;
    desde?: string;
    hasta?: string;
    tipo?:
      | 'completo'
      | 'contratos'
      | 'trazabilidad'
      | 'jornadas'
      | 'clases'
      | 'alumnos'
      | 'instructores'
      | 'certificados'
      | 'resumen-contratos'
      | 'catalogo-jornadas'
      | 'catalogo-clases';
  }) {
    let p = new HttpParams();
    if (opts?.idContrato) p = p.set('idContrato', opts.idContrato);
    if (opts?.idJornada) p = p.set('idJornada', opts.idJornada);
    if (opts?.idClase) p = p.set('idClase', opts.idClase);
    if (opts?.desde) p = p.set('desde', opts.desde);
    if (opts?.hasta) p = p.set('hasta', opts.hasta);
    if (opts?.tipo) p = p.set('tipo', opts.tipo);
    return this.http.get(`${this.base}/informes/export`, {
      params: p,
      responseType: 'blob',
    });
  }

  actualizarCertificadoJornada(id: string, dto: Record<string, unknown>) {
    return this.http.patch<any>(`${this.base}/certificados-generados/${id}`, dto);
  }

  eliminarCertificadoJornada(id: string) {
    return this.http.delete<{ ok: boolean }>(`${this.base}/certificados-generados/${id}`);
  }

  imprimirCertificadoJornada(id: string, onError?: (msg: string) => void): void {
    const url = `${this.base}/certificados-generados/${id}/html?v=${Date.now()}`;
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

  /** Programas de capacitación jornada (catálogo; no dependen del contrato). */
  programasJornadaCap() {
    return this.http.get<any[]>(`${this.base}/programas-jornada`);
  }

  listarSupervisores() {
    return this.http.get<any[]>(`${this.base}/supervisores`);
  }

  listarInstructores(): Observable<InstructorJornadaDto[]> {
    return this.http.get<InstructorJornadaDto[]>(`${this.base}/instructores`);
  }

  crearSupervisor(dto: { nombre: string; documento?: string; email?: string; telefono?: string }) {
    return this.http.post<{ _id: string; nombre: string }>(`${this.base}/supervisores`, dto);
  }

  buscarAlumnoDoc(numDoc: number | string) {
    return this.http.get<any>(`${this.base}/alumnos/doc/${encodeURIComponent(formatNumDoc(numDoc))}`);
  }

  buscarAlumnos(q: string, limit = 12) {
    let params = new HttpParams().set('limit', String(limit));
    if (q) params = params.set('q', q);
    return this.http.get<AlumnoListItem[]>(`${this.base}/alumnos`, { params });
  }

  matricularAlumno(dto: { numDoc: number | string; idPrograma: string; idClase?: string }) {
    const numDoc = parseNumDocForApi(dto.numDoc);
    return this.http.post(`${this.base}/matricular`, {
      numDoc: numDoc ?? dto.numDoc,
      idPrograma: dto.idPrograma,
      ...(dto.idClase ? { idClase: dto.idClase } : {}),
    });
  }

  progresoCertificacion(numDoc: number | string, idContrato: string) {
    const nd = parseNumDocForApi(numDoc);
    return this.http.get<{
      sesiones: number;
      numSesCert: number;
      cumplio: boolean;
      faltan: number;
      certificado?: { _id?: string; codigoCert?: string } | null;
    }>(`${this.base}/alumnos/${encodeURIComponent(formatNumDoc(nd ?? numDoc))}/progreso-cert`, {
      params: { idContrato },
    });
  }

  obtenerConfigOperacionJornadas() {
    return this.http.get<ConfigOperacionJornadas>(`${this.base}/config/operacion`);
  }

  estadoOperacionEspecialJornadas() {
    return this.http.get<EstadoOperacionJornadas>(`${this.base}/config/operacion/estado`);
  }

  guardarConfigOperacionJornadas(cfg: Partial<ConfigOperacionJornadas>) {
    return this.http.put<ConfigOperacionJornadas>(`${this.base}/config/operacion`, cfg);
  }

  estadoCobroContrato(id: string) {
    return this.http.get<EstadoCobroContratoDto>(`${this.base}/contratos/${id}/cobro`);
  }

  generarCuentaCobroContrato(id: string) {
    return this.http.post<{
      numero: string;
      generadaAt?: string;
      valorContrato: number;
    }>(`${this.base}/contratos/${id}/cuenta-cobro/generar`, {});
  }

  urlCuentaCobroContrato(id: string): string {
    return `${this.base}/contratos/${id}/cuenta-cobro/html`;
  }

  generarComprobanteIngresoContrato(
    id: string,
    body: {
      idCuota: string;
      entraCaja?: boolean;
      fecha?: string;
      idTipoPago: string;
      idCuentaBancaria?: string;
      numTransferencia?: string;
      observaciones?: string;
    },
    soporte?: File | null,
  ) {
    const payload = { ...body };
    if (soporte) {
      const fd = new FormData();
      for (const [k, v] of Object.entries(payload)) {
        if (v === undefined || v === null || v === '') continue;
        fd.append(k, typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v));
      }
      fd.append('soporte', soporte, soporte.name);
      return this.http.post<{
        ingreso: { _id: string; numRecibo: string; valor: number; entraCaja: boolean; idSesion?: number | null };
        cobro: EstadoCobroContratoDto;
      }>(`${this.base}/contratos/${id}/comprobantes-ingreso`, fd);
    }
    return this.http.post<{
      ingreso: { _id: string; numRecibo: string; valor: number; entraCaja: boolean; idSesion?: number | null };
      cobro: EstadoCobroContratoDto;
    }>(`${this.base}/contratos/${id}/comprobantes-ingreso`, payload);
  }

  /** Igual que recibos: fetch autenticado + ventana en blanco (evita COOP/HTTP en IP LAN). */
  abrirHtmlCuentaCobroContrato(id: string, onError?: (msg: string) => void): boolean {
    if (!id) {
      onError?.('Contrato sin identificador.');
      return false;
    }
    const url = `${this.urlCuentaCobroContrato(id)}?v=${Date.now()}`;
    const w = window.open('', '_blank', 'width=820,height=960');
    if (!w) {
      onError?.('El navegador bloqueó la ventana emergente. Permita ventanas emergentes para este sitio.');
      return false;
    }
    try {
      w.document.open();
      w.document.write('<p style="font-family:sans-serif;padding:1rem">Cargando cuenta de cobro…</p>');
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
          onError?.('No se pudo mostrar la cuenta de cobro en la ventana.');
        }
      },
      error: (e) => {
        try {
          w.close();
        } catch {
          /* ignore */
        }
        onError?.(e?.error?.message || 'No se pudo generar la cuenta de cobro.');
      },
    });
    return true;
  }
}
