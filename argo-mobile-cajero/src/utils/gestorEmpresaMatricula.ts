import type { ProgramaItem, ServicioItem } from '../api/domain';
import { calcularValorMatricula } from './matricula';

export const TARIFA_GESTOR = 5;

export type ReferidorAlumno = {
  manejoGestorEmpresa?: boolean;
  tipoReferidorComercial?: string | null;
  gestorId?: string | null;
  gestorNombre?: string | null;
};

export type TarifaComercialResuelta = {
  tarifa: typeof TARIFA_GESTOR;
  tipo: 'gestor';
  referidorNombre: string;
};

export function esTarifaComercial(t: number): boolean {
  return t === TARIFA_GESTOR;
}

/** Vista previa en móvil (el backend aplica la tarifa real al matricular). */
export function resolverTarifaComercialAlumno(
  alumno: ReferidorAlumno | null | undefined,
  gestoresActivo: boolean,
): TarifaComercialResuelta | null {
  if (!gestoresActivo || !alumno?.manejoGestorEmpresa) return null;
  const tipo = String(alumno.tipoReferidorComercial || '').trim().toLowerCase();
  if (tipo === 'gestor' && alumno.gestorId) {
    return {
      tarifa: TARIFA_GESTOR,
      tipo: 'gestor',
      referidorNombre: String(alumno.gestorNombre || '').trim() || 'Gestor',
    };
  }
  return null;
}

export function valorTarifaComercialPrograma(
  prog: ProgramaItem,
  servicios: ServicioItem[],
  tarifa: number,
): number {
  return calcularValorMatricula(prog, servicios, tarifa as 1);
}
