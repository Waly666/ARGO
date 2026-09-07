/** Orígenes de participantes en jornadas (alineado al backend). */

export const ORIGENES_JORNADA = ['colegio', 'estamento', 'empresa', 'operativo'] as const;
export type OrigenJornadaKey = (typeof ORIGENES_JORNADA)[number];

export const ORIGEN_JORNADA_LABELS: Record<OrigenJornadaKey, string> = {
  colegio: 'Institución educativa',
  estamento: 'Estamento público',
  empresa: 'Empresa',
  operativo: 'Operativo / calle',
};

export function normalizarOrigenJornada(raw?: string | null): OrigenJornadaKey | '' {
  const t = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if ((ORIGENES_JORNADA as readonly string[]).includes(t)) return t as OrigenJornadaKey;
  if (
    t.includes('coleg') ||
    t.includes('instituc') ||
    t.includes('universidad') ||
    t.includes('instituto') ||
    t === 'ies'
  ) {
    return 'colegio';
  }
  if (t.includes('estament') || t.includes('autoridad') || t.includes('publico')) return 'estamento';
  if (t.includes('empres') || t.includes('cliente')) return 'empresa';
  if (t.includes('operativ') || t.includes('calle')) return 'operativo';
  return '';
}

/** Sin origen en ficha se trata como operativo (legado). */
export function origenAlumnoEfectivo(raw?: string | null): OrigenJornadaKey {
  return normalizarOrigenJornada(raw) || 'operativo';
}

export function labelOrigenJornada(raw?: string | null): string {
  const k = origenAlumnoEfectivo(raw);
  return ORIGEN_JORNADA_LABELS[k] || k;
}

export function mensajeOrigenNoCoincide(origenAlumno: string, origenFiltro: string): string {
  return (
    `Este alumno es de «${labelOrigenJornada(origenAlumno)}». ` +
    `El filtro activo es «${labelOrigenJornada(origenFiltro)}». ` +
    'Cambie el origen seleccionado o use un alumno de ese origen.'
  );
}

export type CertOrigenRow = {
  numSesCert?: number;
  tipoCertificado?: string;
  idProgramaCertificacion?: string;
  idProgramas?: string[];
};

export type CertificacionOrigenMap = Partial<Record<OrigenJornadaKey, CertOrigenRow>>;

function idsUnicos(raw?: unknown): string[] {
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

function tipoCertOrigen(raw?: string): 'global' | 'por_clase' {
  const t = String(raw ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
  if (t === 'por_clase' || t === 'porclase') return 'por_clase';
  return 'global';
}

/** null = catálogo completo; [] = ninguno. */
export function idsProgramasPermitidosOrigen(
  cert: CertificacionOrigenMap | null | undefined,
  origen: string | null | undefined,
  legadoIdProgramas?: string[] | null,
): string[] | null {
  const key = normalizarOrigenJornada(origen);
  if (!key) return null;
  const row = cert?.[key];
  if (tipoCertOrigen(row?.tipoCertificado) !== 'por_clase') return null;
  const ids = idsUnicos(row?.idProgramas);
  if (ids.length) return ids;
  const legado = idsUnicos(legadoIdProgramas);
  return legado.length ? legado : [];
}

function idsDeProgramaItem(p: { idPrograma?: unknown; idProg?: unknown; _id?: unknown }): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [p.idPrograma, p.idProg, p._id]) {
    const id = String(raw ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function idEnListaPermitida(id: string, permitidos: Set<string>): boolean {
  if (permitidos.has(id)) return true;
  const n = Number(id);
  if (!Number.isFinite(n)) return false;
  for (const x of permitidos) {
    const nx = Number(x);
    if (Number.isFinite(nx) && nx === n) return true;
  }
  return false;
}

export function filtrarProgramasPorOrigen<T extends { idPrograma?: unknown; idProg?: unknown; _id?: unknown }>(
  catalogo: T[],
  permitidos: string[] | null,
): T[] {
  if (permitidos == null) return catalogo;
  if (!permitidos.length) return [];
  const set = new Set(permitidos.map((x) => String(x).trim()).filter(Boolean));
  return catalogo.filter((p) => idsDeProgramaItem(p).some((id) => idEnListaPermitida(id, set)));
}

export type InstructorPlanRow = {
  orden?: number;
  idEmpleado: number;
  idUsuario?: string;
  nombre?: string;
  idProgramas?: string[];
};

export type UsuarioParaPlanInstructor = {
  _id?: string;
  idEmpleado?: number;
  empleado?: { idEmpleado?: number; idUsuario?: string };
} | null;

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

/** null = el contrato no tiene plan de instructores; [] = el instructor no tiene programas. */
export function idsProgramasInstructorPlan(
  plan: InstructorPlanRow[] | null | undefined,
  user: UsuarioParaPlanInstructor,
): string[] | null {
  const rows = Array.isArray(plan) ? plan : [];
  if (!rows.length) return null;
  const emp = Number(user?.empleado?.idEmpleado ?? user?.idEmpleado);
  const uids = [user?._id, user?.empleado?.idUsuario].map((x) => String(x || '').trim()).filter(Boolean);
  const row = rows.find((r) => {
    if (Number.isFinite(emp) && emp > 0 && Number(r.idEmpleado) === emp) return true;
    return uids.some((uid) => mismaIdUsuario(uid, r.idUsuario));
  });
  if (!row) return [];
  return idsUnicos(row.idProgramas);
}

export function filtrarProgramasParaElegirClase<
  T extends { idPrograma?: unknown; idProg?: unknown; _id?: unknown },
>(
  catalogo: T[],
  opts: {
    certificacionOrigen?: CertificacionOrigenMap | null;
    origen?: string | null;
    legadoIdProgramas?: string[] | null;
    instructoresPlan?: InstructorPlanRow[] | null;
    user?: UsuarioParaPlanInstructor;
    esAdmin?: boolean;
    /** Si viene del API, manda sobre el plan local: solo esos programas. */
    idsProgramasInstructor?: string[] | null;
  },
): T[] {
  const idsApi = Array.isArray(opts.idsProgramasInstructor)
    ? idsUnicos(opts.idsProgramasInstructor)
    : opts.idsProgramasInstructor === null
      ? null
      : undefined;

  if (idsApi !== undefined) {
    if (idsApi == null) {
      return filtrarProgramasPorOrigen(
        catalogo,
        idsProgramasPermitidosOrigen(opts.certificacionOrigen, opts.origen, opts.legadoIdProgramas),
      );
    }
    return filtrarProgramasPorOrigen(catalogo, idsApi);
  }

  const idsInst = idsProgramasInstructorPlan(opts.instructoresPlan, opts.user ?? null);
  if (idsInst != null && idsInst.length) {
    return filtrarProgramasPorOrigen(catalogo, idsInst);
  }
  if (idsInst != null && !idsInst.length) {
    if (opts.esAdmin) {
      return filtrarProgramasPorOrigen(catalogo, unionProgramasPlan(opts.instructoresPlan || []));
    }
    return [];
  }
  return filtrarProgramasPorOrigen(
    catalogo,
    idsProgramasPermitidosOrigen(opts.certificacionOrigen, opts.origen, opts.legadoIdProgramas),
  );
}
