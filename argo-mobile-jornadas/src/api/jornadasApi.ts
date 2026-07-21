import { apiFetch, apiFetchText, apiPostForm } from './client';
import type {
  AsistenciaClase,
  AsistenciaResp,
  CertificadoJornada,
  ClaseJornada,
  FinalizarClaseResp,
  InscritoClase,
  JornadaCap,
  ProgramaJornada,
  ProgresoCert,
  AlumnoDoc,
} from './types';

const BASE = '/jornadas';

export function jornadasDelDia(fecha: string, idContrato?: string) {
  let q = `?fecha=${encodeURIComponent(fecha)}`;
  if (idContrato) q += `&idContrato=${encodeURIComponent(idContrato)}`;
  return apiFetch<JornadaCap[]>(`${BASE}/jornadas/del-dia${q}`);
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
