export interface AuthUser {
  _id: string;
  username: string;
  nombres?: string;
  apellidos?: string;
  rol?: string;
  rolNombre?: string;
  permisos?: string[];
  idEmpleado?: number;
  empleado?: {
    idEmpleado?: number;
    nombreCompleto?: string;
    numeroDocumento?: string | number;
    esInstructor?: boolean;
  };
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

/** Respuesta cruda del backend (puede incluir MFA o step complete). */
export type LoginApiRaw = {
  step?: 'complete' | 'mfa_verify' | 'mfa_setup';
  token?: string;
  user?: AuthUser;
  mfaToken?: string;
  setupToken?: string;
  username?: string;
  message?: string;
};

export interface JornadaCap {
  _id: string;
  idContrato: string;
  fechaProgramacion: string;
  municipio?: string;
  depto?: string;
  codMunicipio?: string;
  direccion?: string;
  supervisor?: string;
  lat?: number | null;
  lng?: number | null;
  deteGeorefe?: string;
  estado: string;
  numeObjeJornada?: number;
  indiceEnDia?: number;
  contratoLabel?: string;
  codContrato?: string;
  numSesCert?: number;
  /** Clases de la jornada. */
  totalClases?: number;
  /** Alumnos distintos registrados/asistidos en la jornada. */
  alumnosLleva?: number;
  /** Meta de alumnos de la jornada. */
  metaAlumnos?: number;
  metaAlcanzada?: boolean;
  metaSuperada?: boolean;
}

export interface ClaseJornada {
  _id: string;
  idJornada: string;
  idPrograma: string;
  fechaClase?: string;
  fechaJornada?: string;
  ubicacion?: string;
  idCarpa?: number | null;
  carpaNombre?: string;
  instructorNombre?: string;
  idEmpleadoInstructor?: number | null;
  idUsuarioInstructor?: string;
  programaNombre?: string;
  horaInicio?: string;
  horaFin?: string;
  horarioManual?: boolean;
  estado: string;
  idContrato?: string;
  codContrato?: string;
  contratoLabel?: string;
  municipioJornada?: string;
  direccionJornada?: string;
  urlforo?: string;
  indiceClaseEnJornada?: number;
}

export interface ProgramaJornada {
  _id?: string;
  idPrograma?: string;
  nombreProg?: string;
  codigoProg?: string;
  idCarpa?: number | null;
}

export interface AsistenciaClase {
  _id?: string;
  numDoc?: number | string;
  nombreCompleto?: string;
  nombreAlumno?: string;
  asistenciaAt?: string;
}

export interface InscritoClase {
  numDoc: number;
  nombreCompleto: string;
  tieneAsistencia: boolean;
  yaCertificadoContrato?: boolean;
  certificadoCodigo?: string | null;
}

export interface ProgresoCert {
  sesiones: number;
  numSesCert: number;
  cumplio: boolean;
  faltan: number;
  certificado?: { _id?: string; codigoCert?: string } | null;
}

export interface CertificadoJornada {
  _id: string;
  codigoCert?: string;
  numDoc?: number | string;
  nombreAlumno?: string;
  nombreCompleto?: string;
  idContrato?: string;
  codContrato?: string;
  createdAt?: string;
  fechaEmision?: string;
  municipio?: string;
  direccion?: string;
  ubicacionJornada?: string;
  encabezado?: string;
}

export interface AlumnoDoc {
  numDoc?: number | string;
  nombre1?: string;
  nombre2?: string;
  apellido1?: string;
  apellido2?: string;
  nombres?: string;
  apellidos?: string;
  nombreCompleto?: string;
}

export interface MetaJornadaResp {
  idJornada?: string | null;
  alumnosLleva?: number;
  metaAlumnos?: number;
  metaAlcanzada?: boolean;
  metaSuperada?: boolean;
  mensaje?: string | null;
}

export interface AsistenciaResp {
  ok?: boolean;
  nombreAlumno?: string;
  sesiones?: number;
  numSesCert?: number;
  faltan?: number;
  certificadoGenerado?: boolean;
  certificado?: { codigoCert?: string; _id?: string };
  message?: string;
  metaJornada?: MetaJornadaResp | null;
}

export interface FinalizarClaseResp {
  clase?: ClaseJornada;
  asistenciasRegistradas?: number;
  certificadosGenerados?: number;
  certificadosEmitidos?: Array<{
    certificado?: Record<string, unknown>;
    nombreAlumno?: string;
  }>;
}
