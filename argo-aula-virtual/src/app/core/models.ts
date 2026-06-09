export interface PortalConfig {
  nombreCea: string;
  nit?: string;
  direccion?: string;
  ciudad?: string;
  telefono?: string;
  email?: string;
  urlLogo?: string;
  urlLogoAbsoluta?: string | null;
  heroTitulo: string;
  heroSubtitulo: string;
  acercaDeHtml?: string;
}

export type NivelVirtual = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO';

export interface CategoriaVirtual {
  idCategoria: number;
  nombre: string;
  orden?: number;
  activo?: boolean;
}

export interface ClaseProgresoVirtual {
  numero: number;
  pct: number;
  aprobada: boolean;
}

export interface ProgresoVirtual {
  pctCompletitud: number;
  promedioClases?: number | null;
  clases?: ClaseProgresoVirtual[];
  clasesAprobadas?: number;
  totalClases?: number;
  mejorNotaEval: number | null;
  ultimaNotaEval?: number | null;
  intentosEval: number;
  aprobado: boolean;
  certificadoEmitido: boolean;
}

export interface ReglasVirtual {
  modoCertificado: string;
  pctMinCompletitud: number;
  pctMinEvaluaciones: number;
  intentosMaxEval: number;
  intentosRestantes: number;
  cumpleCompletitud?: boolean;
  cumpleNota?: boolean;
  puedeReintentar?: boolean;
}

export interface CursoVirtual {
  idPrograma: string | number;
  codigoProg?: string | null;
  nombreProg: string;
  nomCert?: string | null;
  descripcion?: string | null;
  descripcionVirtual?: string | null;
  horas?: number | null;
  tarifaVirtual: number;
  urlPortadaVirtual?: string | null;
  urlPortadaAbsoluta?: string | null;
  idCategorias?: number[];
  categoriaNombres?: string[];
  categoriaNombre?: string | null;
  nivel?: NivelVirtual | null;
  autor?: string | null;
  publicadoPortal?: boolean;
  modoCertificado?: string;
  tienePaquete?: boolean;
  playerUrl?: string | null;
  materiales?: MaterialVirtual[];
  sesionesMeet?: SesionMeet[];
  pctMinCompletitud?: number;
  pctMinEvaluaciones?: number;
  intentosMaxEval?: number;
  progreso?: ProgresoVirtual;
  reglas?: ReglasVirtual;
  matricula?: { fechaMat?: string; pagada?: string; tarifa?: number } | null;
  pago?: EstadoPagoVirtual;
}

export interface ReciboPortal {
  idIngreso: string;
  numRecibo: string | null;
  fecha?: string | null;
  valor?: number | null;
}

export interface EstadoPagoVirtual {
  tieneLiquidacion: boolean;
  pagado: boolean;
  saldo: number | null;
  valor: number | null;
  abonado?: number;
  estado: string;
  idLiquidacion?: string;
  recibo?: ReciboPortal | null;
}

export interface EstadoInscripcionVirtual {
  matriculado: boolean;
  matricula: { fechaMat?: string; pagada?: string; tarifa?: number } | null;
  pago: EstadoPagoVirtual | null;
  puedeCursar: boolean;
  puedeCertificarse: boolean;
  certificadoPendientePago: boolean;
  curso: {
    idPrograma: string | number;
    nombreProg: string;
    tarifaVirtual: number;
    modoCertificado?: string;
    tienePaquete?: boolean;
  };
}

export interface MatriculaVirtualRes {
  yaMatriculado: boolean;
  message: string;
  matricula?: unknown;
  pago?: EstadoPagoVirtual;
}

export interface ProgresoVirtualResp {
  progreso: ProgresoVirtual;
  reglas: ReglasVirtual;
  pago?: EstadoPagoVirtual | null;
  certificado?: { emitido: boolean; codigoCert?: string; motivo?: string } | null;
  aviso?: string;
  avisoCertificado?: string;
}

export interface MaterialVirtual {
  _id?: string;
  titulo: string;
  tipo: string;
  url: string;
  orden?: number;
}

export interface SesionMeet {
  _id?: string;
  titulo: string;
  url: string;
  fecha?: string | null;
  obligatoria?: boolean;
}

export interface PortalAuthUser {
  email: string;
  numDoc: number;
}

export interface PortalAuthRes {
  token: string;
  usuario: PortalAuthUser;
  alumno: { numDoc: number; nombreCompleto: string };
}

export interface CertificadoPortal {
  _id: string;
  idProg: string | number;
  codigoCert: string | null;
  encabezado: string | null;
  programaDescr: string;
  nomCert: string | null;
  fechaEmision?: string | null;
  fechaVencimiento?: string | null;
  estado: string;
  esCursoVirtual?: boolean;
  generadoAutoVirtual?: boolean;
  generadoAutoPago?: boolean;
  recibo?: ReciboPortal | null;
}
