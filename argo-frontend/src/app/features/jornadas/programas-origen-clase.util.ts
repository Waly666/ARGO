import type { CertificacionOrigenRow, ContratacionDto } from '../../core/services/jornada-cap.service';

export type OrigenJornadaCapKey = 'colegio' | 'estamento' | 'empresa' | 'operativo';

export function normalizarTipoCertOrigen(raw: unknown): 'global' | 'por_clase' {
  const t = String(raw ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
  if (t === 'por_clase' || t === 'porclase') return 'por_clase';
  return 'global';
}

function idsUnicos(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const id = String(item ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function clavesPrograma(p: {
  idPrograma?: unknown;
  _id?: unknown;
  idProg?: unknown;
  codigoProg?: unknown;
}): string[] {
  return [p?.idPrograma, p?._id, p?.idProg, p?.codigoProg]
    .filter((v) => v != null && String(v).trim() !== '')
    .map((v) => String(v).trim());
}

export function programaCoincideConId(
  p: { idPrograma?: unknown; _id?: unknown; idProg?: unknown; codigoProg?: unknown },
  id: string,
): boolean {
  const needle = String(id || '').trim();
  if (!needle) return false;
  return clavesPrograma(p).includes(needle);
}

export function programaIdEnLista(id: string, permitidos: string[]): boolean {
  const needle = String(id || '').trim();
  if (!needle) return false;
  return permitidos.some((x) => {
    const s = String(x).trim();
    if (!s) return false;
    if (s === needle) return true;
    const n = Number(needle);
    const nx = Number(s);
    return Number.isFinite(n) && Number.isFinite(nx) && n === nx;
  });
}

/**
 * Si el origen es por_clase, ids permitidos (puede estar vacío).
 * Si es global o no hay origen, null = catálogo completo de jornadas.
 */
export function idsProgramasPermitidosOrigen(
  cert: ContratacionDto['certificacionOrigen'] | null | undefined,
  origen: string | null | undefined,
  legadoIdProgramas?: string[] | null,
): string[] | null {
  const key = String(origen || '')
    .trim()
    .toLowerCase() as OrigenJornadaCapKey;
  if (!key || !['colegio', 'estamento', 'empresa', 'operativo'].includes(key)) return null;
  const row = (cert?.[key] || {}) as CertificacionOrigenRow;
  if (normalizarTipoCertOrigen(row.tipoCertificado) !== 'por_clase') return null;
  const ids = idsUnicos(row.idProgramas);
  if (ids.length) return ids;
  const legado = idsUnicos(legadoIdProgramas);
  return legado.length ? legado : [];
}

export function filtrarProgramasPorOrigen<T extends { idPrograma?: unknown; _id?: unknown; idProg?: unknown; codigoProg?: unknown }>(
  catalogo: T[],
  permitidos: string[] | null,
): T[] {
  if (permitidos == null) return catalogo;
  if (!permitidos.length) return [];
  return catalogo.filter((p) => clavesPrograma(p).some((k) => programaIdEnLista(k, permitidos)));
}

export type InstructorPlanRow = {
  orden?: number;
  idEmpleado?: number;
  idUsuario?: string;
  nombre?: string;
  idProgramas?: string[];
};

export type UsuarioParaPlanInstructor = {
  _id?: string;
  idUsuario?: string;
  idEmpleado?: number | string | null;
  idEmpleadoInstructor?: number | string | null;
  idUsuarioInstructor?: string | null;
  empleado?: { idEmpleado?: number; idUsuario?: string };
} | null;

export type OptsProgramasElegiblesClase = {
  certificacionOrigen?: ContratacionDto['certificacionOrigen'] | null;
  origen?: string | null;
  legadoIdProgramas?: string[] | null;
  instructoresPlan?: InstructorPlanRow[] | null;
  user?: UsuarioParaPlanInstructor;
  esAdmin?: boolean;
};

function mismaIdUsuario(a?: string | null, b?: string | null): boolean {
  const x = String(a || '').trim();
  const y = String(b || '').trim();
  if (!x || !y) return false;
  return x === y || x.toLowerCase() === y.toLowerCase();
}

function unionProgramasPlan(plan: InstructorPlanRow[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const row of plan) {
    for (const id of idsUnicos(row.idProgramas)) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/** Misma lógica que el backend: hay plan / fila del instructor. */
export function filaInstructorEnPlan(
  plan: InstructorPlanRow[] | null | undefined,
  user: UsuarioParaPlanInstructor,
): { hayPlan: boolean; row: InstructorPlanRow | null } {
  const rows = Array.isArray(plan) ? plan : [];
  if (!rows.length) return { hayPlan: false, row: null };
  const emp = Number(
    user?.empleado?.idEmpleado ?? user?.idEmpleado ?? user?.idEmpleadoInstructor,
  );
  const uids = [user?._id, user?.idUsuario, user?.idUsuarioInstructor, user?.empleado?.idUsuario]
    .map((x) => String(x || '').trim())
    .filter(Boolean);
  const row =
    rows.find((r) => {
      if (Number.isFinite(emp) && emp > 0 && Number(r.idEmpleado) === emp) return true;
      return uids.some((uid) => mismaIdUsuario(uid, r.idUsuario));
    }) || null;
  return { hayPlan: true, row };
}

/** null = el contrato no tiene plan; [] = el instructor no está o no tiene programas. */
export function idsProgramasInstructorPlan(
  plan: InstructorPlanRow[] | null | undefined,
  user: UsuarioParaPlanInstructor,
): string[] | null {
  const { hayPlan, row } = filaInstructorEnPlan(plan, user);
  if (!hayPlan) return null;
  if (!row) return [];
  return idsUnicos(row.idProgramas);
}

/**
 * Si el instructor está en el plan, solo sus programas (aunque el origen no los liste).
 * Admin que no está en el plan: unión de programas del plan.
 * Sin plan: filtro por origen / por_clase.
 */
export function idsProgramasElegiblesClase(opts: OptsProgramasElegiblesClase): string[] | null {
  const { hayPlan, row } = filaInstructorEnPlan(opts.instructoresPlan, opts.user ?? null);
  if (hayPlan && row) return idsUnicos(row.idProgramas);
  if (hayPlan && !row) {
    if (opts.esAdmin) {
      const union = unionProgramasPlan(opts.instructoresPlan || []);
      return union.length ? union : [];
    }
    return [];
  }
  return idsProgramasPermitidosOrigen(
    opts.certificacionOrigen,
    opts.origen,
    opts.legadoIdProgramas,
  );
}

export function filtrarProgramasParaElegirClase<
  T extends { idPrograma?: unknown; _id?: unknown; idProg?: unknown; codigoProg?: unknown },
>(catalogo: T[], opts: OptsProgramasElegiblesClase): T[] {
  return filtrarProgramasPorOrigen(catalogo, idsProgramasElegiblesClase(opts));
}

export function mensajeSinProgramasElegiblesClase(opts: OptsProgramasElegiblesClase): string {
  const { hayPlan, row } = filaInstructorEnPlan(opts.instructoresPlan, opts.user ?? null);
  if (hayPlan && row && !idsUnicos(row.idProgramas).length) {
    return 'Este instructor no tiene programas asignados en el contrato. Configúrelos en Instructores y programas.';
  }
  if (hayPlan && !row && !opts.esAdmin) {
    return 'No tiene programas asignados en este contrato. Pida que lo agreguen en Instructores y programas.';
  }
  if (hayPlan && !row && opts.esAdmin) {
    return 'El plan de instructores no tiene programas. Configúrelos en Instructores y programas del contrato.';
  }
  return 'Este origen está por clase y no tiene programas en el contrato. Configúrelos en Contratación.';
}
