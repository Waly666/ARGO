import type { ProgramaItem, ServicioItem } from '../api/domain';
import { calcularValorMatricula } from './matricula';

export const TARIFA_GESTOR = 5;
export const TARIFA_EMPRESA = 6;

export type TipoReferidorComercial = 'gestor' | 'empresa';

export type ReferidorAlumno = {
  manejoGestorEmpresa?: boolean;
  tipoReferidorComercial?: string | null;
  gestorId?: string | null;
  referidorEmpresaId?: string | null;
  gestorNombre?: string | null;
  referidorEmpresaNombre?: string | null;
};

export type TarifaComercialResuelta = {
  tarifa: typeof TARIFA_GESTOR | typeof TARIFA_EMPRESA;
  tipo: TipoReferidorComercial;
  referidorNombre: string;
};

export function esTarifaComercial(t: number): boolean {
  return t === TARIFA_GESTOR || t === TARIFA_EMPRESA;
}

/** Vista previa en móvil (el backend aplica la tarifa real al matricular). */
export function resolverTarifaComercialAlumno(
  alumno: ReferidorAlumno | null | undefined,
  gestoresEmpresasActivo: boolean,
): TarifaComercialResuelta | null {
  if (!gestoresEmpresasActivo || !alumno?.manejoGestorEmpresa) return null;
  const tipo = String(alumno.tipoReferidorComercial || '').trim().toLowerCase();
  if (tipo === 'gestor' && alumno.gestorId) {
    return {
      tarifa: TARIFA_GESTOR,
      tipo: 'gestor',
      referidorNombre: String(alumno.gestorNombre || '').trim() || 'Gestor',
    };
  }
  if (tipo === 'empresa' && alumno.referidorEmpresaId) {
    return {
      tarifa: TARIFA_EMPRESA,
      tipo: 'empresa',
      referidorNombre: String(alumno.referidorEmpresaNombre || '').trim() || 'Empresa',
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
