import { apiFetch, apiFetchBlob, apiFetchText, apiPostForm } from './client';
import type {
  AsistenciaClase,
  AsistenciaResp,
  CertificadoJornada,
  ClaseJornada,
  ContratoJornada,
  FinalizarClaseResp,
  InformesJornadaResp,
  InscritoClase,
  JornadaCap,
  ProgramaJornada,
  ProgresoCert,
  AlumnoDoc,
} from './types';

const BASE = '/jornadas';

export function listarContratos() {
  return apiFetch<ContratoJornada[]>(`${BASE}/contratos`);
}

export type InformeDashboardFiltros = {
  idJornada?: string;
  idClase?: string;
  idPrograma?: string;
  idInstructor?: string | number;
  desde?: string;
  hasta?: string;
};

function qsDashboard(opts?: InformeDashboardFiltros & { alcance?: string }) {
  const q = new URLSearchParams();
  if (opts?.alcance) q.set('alcance', opts.alcance);
  if (opts?.idJornada) q.set('idJornada', opts.idJornada);
  if (opts?.idClase) q.set('idClase', opts.idClase);
  if (opts?.idPrograma) q.set('idPrograma', opts.idPrograma);
  if (opts?.desde) q.set('desde', opts.desde);
  if (opts?.hasta) q.set('hasta', opts.hasta);
  if (opts?.idInstructor != null && opts.idInstructor !== '') {
    q.set('idInstructor', String(opts.idInstructor));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function informeDashboardContrato(idContrato: string, opts?: InformeDashboardFiltros) {
  return apiFetch<import('./types').InformeDashboardDto>(
    `${BASE}/contratos/${encodeURIComponent(idContrato)}/informe-dashboard${qsDashboard(opts)}`,
  );
}

export type InformeContratoAlcance =
  | 'contrato'
  | 'jornada'
  | 'clase'
  | 'programa'
  | 'instructor'
  | 'desarrollo-general';

export function descargarInformeContratoPdf(
  idContrato: string,
  opts: InformeDashboardFiltros & { alcance: InformeContratoAlcance },
) {
  return apiFetchBlob(
    `${BASE}/contratos/${encodeURIComponent(idContrato)}/informe-pdf${qsDashboard(opts)}`,
  );
}

export function jornadasDelDia(fecha: string, idContrato?: string) {
  let q = `?fecha=${encodeURIComponent(fecha)}`;
  if (idContrato) q += `&idContrato=${encodeURIComponent(idContrato)}`;
  return apiFetch<JornadaCap[]>(`${BASE}/jornadas/del-dia${q}`);
}

export function listarJornadas(params?: {
  idContrato?: string;
  desde?: string;
  hasta?: string;
}) {
  const q = new URLSearchParams();
  if (params?.idContrato) q.set('idContrato', params.idContrato);
  if (params?.desde) q.set('desde', params.desde);
  if (params?.hasta) q.set('hasta', params.hasta);
  const qs = q.toString();
  return apiFetch<JornadaCap[]>(`${BASE}/jornadas${qs ? `?${qs}` : ''}`);
}

export function obtenerJornada(id: string) {
  return apiFetch<JornadaCap>(`${BASE}/jornadas/${encodeURIComponent(id)}`);
}

export type ActualizarJornadaDto = {
  municipio?: string;
  depto?: string;
  codMunicipio?: string;
  direccion?: string;
  supervisor?: string;
  fechaProgramacion?: string;
  lat?: number | null;
  lng?: number | null;
  deteGeorefe?: 'MAPA' | 'DISPOSITIVO_MOVIL' | 'MANUAL' | '';
};

export function actualizarJornada(id: string, dto: ActualizarJornadaDto) {
  return apiFetch<JornadaCap>(`${BASE}/jornadas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
}

export type CrearJornadaDto = {
  fechaProgramacion: string;
  direccion: string;
  municipio?: string;
  depto?: string;
  codMunicipio?: string;
  lat?: number | null;
  lng?: number | null;
  deteGeorefe?: string;
  supervisor?: string;
  generarClases?: boolean;
};

export function crearJornadaContrato(idContrato: string, dto: CrearJornadaDto) {
  return apiFetch<{ jornada: JornadaCap; clasesCreadas: number }>(
    `${BASE}/contratos/${encodeURIComponent(idContrato)}/jornadas`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    },
  );
}

export type GeorefMunicipioResp = {
  municipio: string;
  depto: string;
  codMunicipio?: string | null;
  fuente?: string;
};

export function georefMunicipioPorCoords(lat: number, lng: number) {
  const q = `?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`;
  return apiFetch<GeorefMunicipioResp>(`${BASE}/jornadas/georef/municipio${q}`);
}

export function listarClases(idJornada: string) {
  return apiFetch<ClaseJornada[]>(`${BASE}/clases?idJornada=${encodeURIComponent(idJornada)}`);
}

export function obtenerClase(id: string) {
  return apiFetch<ClaseJornada>(`${BASE}/clases/${id}`);
}

export function programasJornadaCap() {
  return apiFetch<ProgramaJornada[]>(`${BASE}/programas-jornada`);
}

export function crearClase(dto: { idJornada: string; idPrograma: string; ubicacion?: string }) {
  return apiFetch<ClaseJornada>(`${BASE}/clases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
}

export function actualizarClase(
  id: string,
  dto: {
    idPrograma?: string;
    ubicacion?: string;
    horaInicio?: string | null;
    horaFin?: string | null;
    horarioManual?: boolean;
    /** Reabre clase FINALIZADA sin asistencias (vuelve a PROGRAMADA). */
    reabrir?: boolean;
  },
) {
  return apiFetch<ClaseJornada>(`${BASE}/clases/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
}

export function iniciarClase(
  id: string,
  dto?: { horarioManual?: boolean; horaInicio?: string; horaFin?: string },
) {
  return apiFetch<ClaseJornada>(`${BASE}/clases/${id}/iniciar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto || {}),
  });
}

export function finalizarClase(
  id: string,
  dto?: { horarioManual?: boolean; horaInicio?: string; horaFin?: string },
) {
  return apiFetch<FinalizarClaseResp>(`${BASE}/clases/${id}/finalizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto || {}),
  });
}

export function registrarAsistencia(idClase: string, numDoc: string) {
  return apiFetch<AsistenciaResp>(`${BASE}/clases/${idClase}/asistencia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numDoc }),
  });
}

export function listarAsistencias(idClase: string) {
  return apiFetch<AsistenciaClase[]>(`${BASE}/clases/${idClase}/asistencias`);
}

export function inscritosClase(idClase: string) {
  return apiFetch<InscritoClase[]>(`${BASE}/clases/${idClase}/inscritos`);
}

export function listadoAsistenciaClaseHtml(idClase: string) {
  return apiFetchText(`${BASE}/clases/${idClase}/listado-asistencia/html?v=${Date.now()}`);
}

export type EstadoOperacionJornadas = {
  operacionFueraDeDiaHabilitada: boolean;
  mostrarSwitchHorarioManual: boolean;
  puedeUsar: boolean;
  motivo?: string | null;
};

/** Config operativa (incluye si se puede elegir horario manual). */
export function estadoOperacionJornadas() {
  return apiFetch<EstadoOperacionJornadas>(`${BASE}/config/operacion/estado`);
}

export function matricularAlumno(numDoc: string, idPrograma: string, idClase: string) {
  return apiFetch(`${BASE}/matricular`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numDoc, idPrograma, idClase }),
  });
}

export function buscarAlumnoDoc(numDoc: string) {
  return apiFetch<AlumnoDoc>(`${BASE}/alumnos/doc/${encodeURIComponent(numDoc.trim())}`);
}

export type CrearAlumnoJornadaDto = {
  numDoc: string;
  nombre1: string;
  apellido1: string;
  nombre2?: string;
  apellido2?: string;
  tipoDoc?: string;
  expedida?: string;
  genero?: string;
  fechaNac?: string;
  tipoSangre?: string;
  jornada?: string;
  estadoCivil?: string;
  estrato?: string;
  regimenSalud?: string;
  nivelFormacion?: string;
  ocupacion?: string;
  discapacidad?: string;
  multiCulturalidad?: string;
  observaciones?: string;
  celular?: string;
  correo?: string;
  direccion?: string;
  munOrigen?: string;
  codMunicipio?: string;
};

export type AlumnoJornadaCreado = AlumnoDoc & {
  _id: string;
  tipoAlumno?: string;
  nombreCompleto?: string;
};

/** Alta de alumno tipo Jornadas de Capacitación (permiso jornadas.operar). */
export function crearAlumnoJornada(dto: CrearAlumnoJornadaDto) {
  return apiFetch<AlumnoJornadaCreado>(`${BASE}/alumnos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
}

export function progresoCertificacion(numDoc: string, idContrato: string) {
  const q = `?idContrato=${encodeURIComponent(idContrato)}`;
  return apiFetch<ProgresoCert>(
    `${BASE}/alumnos/${encodeURIComponent(numDoc.trim())}/progreso-cert${q}`,
  );
}

export function certificadosGenerados(idContrato?: string) {
  const q = idContrato ? `?idContrato=${encodeURIComponent(idContrato)}` : '';
  return apiFetch<CertificadoJornada[]>(`${BASE}/certificados-generados${q}`);
}

export function subirFotoEvidencia(idClase: string, uri: string) {
  const fd = new FormData();
  fd.append('foto', {
    uri,
    name: 'evidencia.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  return apiPostForm<ClaseJornada>(`${BASE}/clases/${idClase}/foto-evidencia`, fd);
}

export type InformesOpts = {
  idContrato?: string;
  idJornada?: string;
  idClase?: string;
  desde?: string;
  hasta?: string;
};

function qsInformes(opts?: InformesOpts & { tipo?: string }) {
  const q = new URLSearchParams();
  if (opts?.idContrato) q.set('idContrato', opts.idContrato);
  if (opts?.idJornada) q.set('idJornada', opts.idJornada);
  if (opts?.idClase) q.set('idClase', opts.idClase);
  if (opts?.desde) q.set('desde', opts.desde);
  if (opts?.hasta) q.set('hasta', opts.hasta);
  if (opts?.tipo) q.set('tipo', opts.tipo);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function informesJornada(opts?: InformesOpts) {
  return apiFetch<InformesJornadaResp>(`${BASE}/informes${qsInformes(opts)}`);
}

export type TipoExportInforme =
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

export function exportarInformesJornada(opts?: InformesOpts & { tipo?: TipoExportInforme }) {
  return apiFetchBlob(`${BASE}/informes/export${qsInformes(opts)}`);
}
