import type { ProgramaItem, ServicioItem } from '../api/domain';
import { calcularValorMatricula } from './matricula';
export type TipoGestor = 'persona_natural' | 'empresa';
export type TipoReferidorComercial = 'gestor' | 'empresa';

export const TARIFA_GESTOR = 5;
export const TARIFA_EMPRESA = 6;

export function tipoReferidorDesdeGestor(tipoGestor?: TipoGestor | string | null): TipoReferidorComercial {
  return String(tipoGestor || 'persona_natural').trim().toLowerCase() === 'empresa'
    ? 'empresa'
    : 'gestor';
}

export type ReferidorAlumno = {
  manejoGestorEmpresa?: boolean;
  tipoReferidorComercial?: string | null;
  gestorId?: string | null;
  gestorNombre?: string | null;
};

export type TarifaComercialResuelta = {
  tarifa: typeof TARIFA_GESTOR | typeof TARIFA_EMPRESA;
  tipo: TipoReferidorComercial;
  referidorNombre: string;
};

export function esTarifaComercial(t: number): boolean {
  return t === TARIFA_GESTOR || t === TARIFA_EMPRESA;
}

export function etiquetaTarifaGestor(tipoGestor?: TipoGestor | string | null): string {
  return tipoReferidorDesdeGestor(tipoGestor) === 'empresa'
    ? 'Tarifa empresa (6)'
    : 'Tarifa tramitador (5)';
}

/** Vista previa en móvil (el backend aplica la tarifa real al matricular). */
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

export function valorTarifaComercialPrograma(
  prog: ProgramaItem,
  servicios: ServicioItem[],
  tarifa: number,
): number {
  return calcularValorMatricula(prog, servicios, tarifa as 1);
}
