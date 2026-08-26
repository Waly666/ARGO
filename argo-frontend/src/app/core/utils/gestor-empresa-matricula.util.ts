export type TipoGestor = 'persona_natural' | 'empresa';
export type TipoReferidorComercial = 'gestor' | 'empresa';

export const TARIFA_GESTOR = 5;
export const TARIFA_EMPRESA = 6;

export type TarifaMatriculaComercial = typeof TARIFA_GESTOR | typeof TARIFA_EMPRESA;

type TarifaEntidad = {
  tarifa1?: number | string | null;
  tarifaGestor?: number | string | null;
  tarifaEmpresa?: number | string | null;
  valorMatricula?: number | string | null;
};

function num(v: unknown): number {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Tarifa 1 efectiva (servicio → programa). Paridad con backend programaServicio. */
export function valorTarifa1Servicio(
  serv: TarifaEntidad | null | undefined,
  prog?: TarifaEntidad | null,
): number {
  if (serv?.tarifa1 != null && serv.tarifa1 !== '') {
    const v = num(serv.tarifa1);
    if (v > 0) return v;
  }
  if (prog?.tarifa1 != null && prog.tarifa1 !== '') {
    const v = num(prog.tarifa1);
    if (v > 0) return v;
  }
  return num(prog?.valorMatricula);
}

/** Valor a liquidar según tarifa (1–6). Tarifa gestor/empresa en 0 → tarifa 1. */
export function valorTarifaServicio(
  serv: TarifaEntidad | null | undefined,
  tarifa: number,
  prog?: TarifaEntidad | null,
): number {
  const t = Number(tarifa);
  if (t === TARIFA_GESTOR) {
    const v = num(serv?.tarifaGestor);
    if (v > 0) return v;
    return valorTarifa1Servicio(serv, prog);
  }
  if (t === TARIFA_EMPRESA) {
    const v = num(serv?.tarifaEmpresa);
    if (v > 0) return v;
    return valorTarifa1Servicio(serv, prog);
  }
  if (serv) {
    const key = `tarifa${t}` as keyof TarifaEntidad;
    const v = serv[key];
    if (v != null && v !== '') {
      const n = num(v);
      if (n > 0) return n;
    }
  }
  return valorTarifa1Servicio(serv, prog);
}

export function tipoReferidorDesdeGestor(tipoGestor?: string | null): TipoReferidorComercial {
  return String(tipoGestor || 'persona_natural').trim().toLowerCase() === 'empresa'
    ? 'empresa'
    : 'gestor';
}

export function tarifaDesdeTipoReferidor(tipo?: string | null): number {
  return String(tipo || '').trim().toLowerCase() === 'empresa' ? TARIFA_EMPRESA : TARIFA_GESTOR;
}

export function etiquetaTarifaGestor(tipoGestor?: string | null): string {
  return tipoReferidorDesdeGestor(tipoGestor) === 'empresa'
    ? 'Tarifa empresa (6)'
    : 'Tarifa tramitador (5)';
}

export function esTarifaComercial(tarifa: number): boolean {
  return tarifa === TARIFA_GESTOR || tarifa === TARIFA_EMPRESA;
}

export type ReferidorAlumno = {
  manejoGestorEmpresa?: boolean;
  tipoReferidorComercial?: string | null;
  gestorId?: string | null;
  gestorNombre?: string | null;
};

export type TarifaComercialResuelta = {
  tarifa: TarifaMatriculaComercial;
  tipo: TipoReferidorComercial;
  referidorNombre: string;
};

/** Tarifa 5/6 automática cuando el alumno tiene gestor asignado. */
export function resolverTarifaComercialAlumno(
  alumno: ReferidorAlumno | null | undefined,
  gestoresActivo: boolean,
): TarifaComercialResuelta | null {
  if (!gestoresActivo || !alumno?.manejoGestorEmpresa || !alumno.gestorId) return null;
  const tipo = String(alumno.tipoReferidorComercial || '').trim().toLowerCase();
  if (tipo !== 'gestor' && tipo !== 'empresa') return null;
  const tarifa = tipo === 'empresa' ? TARIFA_EMPRESA : TARIFA_GESTOR;
  return {
    tarifa,
    tipo: tipo === 'empresa' ? 'empresa' : 'gestor',
    referidorNombre: String(alumno.gestorNombre || '').trim() || 'Gestor',
  };
}
