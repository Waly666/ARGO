/** Capacidad y modos de programación de jornadas (espejo del backend). */

export type ModoProgramacionJornadas = 'global' | 'municipio';

export type FlagsCalendarioJornadas = {
  incluiSab?: boolean;
  incluiDom?: boolean;
  incluiFest?: boolean;
};

export type FilaPlanMunicipio = {
  municipio?: string;
  codMunicipio?: string;
  numJornadas?: number;
  jornadasPorDia?: number;
  clasesPorJornada?: number;
  fechaInicJornadas?: string;
  fechaFinJornadas?: string;
};

const FESTIVOS_COLOMBIA = new Set([
  '2025-01-01',
  '2025-01-06',
  '2025-03-24',
  '2025-04-17',
  '2025-04-18',
  '2025-05-01',
  '2025-06-02',
  '2025-06-23',
  '2025-06-30',
  '2025-08-07',
  '2025-08-18',
  '2025-10-13',
  '2025-11-03',
  '2025-11-17',
  '2025-12-08',
  '2025-12-25',
  '2026-01-01',
  '2026-01-12',
  '2026-03-23',
  '2026-04-02',
  '2026-04-03',
  '2026-05-01',
  '2026-05-18',
  '2026-06-15',
  '2026-06-29',
  '2026-08-07',
  '2026-08-17',
  '2026-10-12',
  '2026-11-02',
  '2026-11-16',
  '2026-12-08',
  '2026-12-25',
  '2027-01-01',
  '2027-01-11',
  '2027-03-22',
  '2027-03-26',
  '2027-05-01',
  '2027-05-17',
  '2027-06-07',
  '2027-06-14',
  '2027-08-07',
  '2027-08-16',
  '2027-10-18',
  '2027-11-01',
  '2027-11-15',
  '2027-12-08',
  '2027-12-25',
]);

function ymdDe(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseYmdLocal(val?: string | Date | null): Date | null {
  if (val == null || val === '') return null;
  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) return null;
    return new Date(val.getFullYear(), val.getMonth(), val.getDate(), 0, 0, 0, 0);
  }
  const s = String(val).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

function esDiaProgramable(date: Date, flags: FlagsCalendarioJornadas): boolean {
  const dow = date.getDay();
  if (dow === 0 && !flags.incluiDom) return false;
  if (dow === 6 && !flags.incluiSab) return false;
  if (!flags.incluiFest && FESTIVOS_COLOMBIA.has(ymdDe(date))) return false;
  return true;
}

export function diasNecesarios(numJornadas?: number, porDia?: number): number {
  const n = Math.max(0, parseInt(String(numJornadas ?? 0), 10) || 0);
  const p = Math.max(1, Math.min(20, parseInt(String(porDia ?? 1), 10) || 1));
  if (n < 1) return 0;
  return Math.ceil(n / p);
}

export function contarDiasProgramables(
  inicio?: string | Date | null,
  fin?: string | Date | null,
  flags: FlagsCalendarioJornadas = {},
): number {
  const a = parseYmdLocal(inicio);
  const b = parseYmdLocal(fin);
  if (!a || !b || b.getTime() < a.getTime()) return 0;
  let n = 0;
  const cur = new Date(a.getTime());
  let guard = 0;
  while (cur.getTime() <= b.getTime() && guard < 2000) {
    guard += 1;
    if (esDiaProgramable(cur, flags)) n += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return n;
}

/** Días hábiles del rango × jornadas por día. Null si faltan fechas. */
export function sugerirNumJornadas(
  inicio?: string | Date | null,
  fin?: string | Date | null,
  porDia?: number,
  flags: FlagsCalendarioJornadas = {},
): number | null {
  const ini = inicio instanceof Date ? ymdDe(inicio) : String(inicio || '').trim();
  const f = fin instanceof Date ? ymdDe(fin) : String(fin || '').trim();
  if (!ini || !f) return null;
  if (!parseYmdLocal(ini) || !parseYmdLocal(f)) return null;
  const habiles = contarDiasProgramables(ini, f, flags);
  const p = Math.max(1, Math.min(20, parseInt(String(porDia ?? 1), 10) || 1));
  return habiles * p;
}

export function inferirModoProgramacionJornadas(contrato: {
  programacionJornadasModo?: string;
  municipiosPlan?: FilaPlanMunicipio[] | null;
}): ModoProgramacionJornadas {
  const raw = String(contrato?.programacionJornadasModo || '')
    .trim()
    .toLowerCase();
  if (raw === 'municipio' || raw === 'global') return raw;
  const plan = contrato?.municipiosPlan || [];
  if (
    plan.length &&
    plan.every((r) => !!String(r.fechaInicJornadas || '').trim() && !!String(r.fechaFinJornadas || '').trim())
  ) {
    return 'municipio';
  }
  return 'global';
}

export function clasesPorJornadaDesdePlan(plan: FilaPlanMunicipio[] | null | undefined): number | null {
  const rows = plan || [];
  if (!rows.length) return null;
  const vals = rows.map((r) => Math.max(0, Math.min(20, parseInt(String(r.clasesPorJornada ?? 1), 10) || 0)));
  const first = vals[0];
  if (vals.every((v) => v === first)) return first;
  const totalJ = rows.reduce((s, r) => s + Math.max(0, parseInt(String(r.numJornadas ?? 0), 10) || 0), 0);
  const totalC = rows.reduce((s, r) => {
    const j = Math.max(0, parseInt(String(r.numJornadas ?? 0), 10) || 0);
    const c = Math.max(0, Math.min(20, parseInt(String(r.clasesPorJornada ?? 1), 10) || 0));
    return s + j * c;
  }, 0);
  if (totalJ < 1) return first;
  return Math.max(0, Math.min(20, Math.round(totalC / totalJ)));
}

export function totalClasesDesdePlan(plan: FilaPlanMunicipio[] | null | undefined): number {
  return (plan || []).reduce((s, r) => {
    const j = Math.max(0, parseInt(String(r.numJornadas ?? 0), 10) || 0);
    const c = Math.max(0, Math.min(20, parseInt(String(r.clasesPorJornada ?? 1), 10) || 0));
    return s + j * c;
  }, 0);
}

function labelMun(row: FilaPlanMunicipio): string {
  return String(row.municipio || row.codMunicipio || 'Municipio').trim();
}

export function badgeCapacidadFila(
  row: FilaPlanMunicipio,
  flags: FlagsCalendarioJornadas,
): { ok: boolean; texto: string } | null {
  const ini = String(row.fechaInicJornadas || '').trim();
  const fin = String(row.fechaFinJornadas || '').trim();
  if (!ini || !fin) return { ok: false, texto: 'Faltan fechas' };
  const needed = diasNecesarios(row.numJornadas, row.jornadasPorDia);
  const habiles = contarDiasProgramables(ini, fin, flags);
  if (habiles < needed) {
    return {
      ok: false,
      texto: `${habiles}/${needed} días hábiles`,
    };
  }
  return { ok: true, texto: `${habiles} día(s) hábil(es)` };
}

export function mensajeErrorProgramacion(opts: {
  modo: ModoProgramacionJornadas;
  plan: FilaPlanMunicipio[];
  fechaInicJornadas?: string | null;
  fechaFinJornadas?: string | null;
  numerojornadas?: number;
  jornadasPorDia?: number;
  flags: FlagsCalendarioJornadas;
  exigirFechas: boolean;
}): string | null {
  const { modo, plan, flags, exigirFechas } = opts;
  if (modo === 'municipio') {
    if (!plan.length) return 'En modo por municipio agregue al menos un municipio al plan.';
    for (const row of plan) {
      const ini = String(row.fechaInicJornadas || '').trim();
      const fin = String(row.fechaFinJornadas || '').trim();
      if (!ini || !fin) {
        return `En modo por municipio, «${labelMun(row)}» debe tener fecha de inicio y fecha fin.`;
      }
      if (fin < ini) {
        return `En «${labelMun(row)}» la fecha fin debe ser igual o posterior al inicio.`;
      }
      const needed = diasNecesarios(row.numJornadas, row.jornadasPorDia);
      const habiles = contarDiasProgramables(ini, fin, flags);
      if (habiles < needed) {
        return (
          `El calendario de «${labelMun(row)}» no alcanza: necesita ${needed} día(s) hábil(es) ` +
          `(${row.numJornadas} jornada(s) a ${row.jornadasPorDia ?? 1} por día) y solo hay ${habiles} ` +
          `entre ${ini} y ${fin}. Amplíe el rango o active sábados, domingos o festivos.`
        );
      }
    }
    for (let i = 0; i < plan.length; i += 1) {
      for (let j = i + 1; j < plan.length; j += 1) {
        const a1 = String(plan[i].fechaInicJornadas || '').trim();
        const a2 = String(plan[i].fechaFinJornadas || '').trim();
        const b1 = String(plan[j].fechaInicJornadas || '').trim();
        const b2 = String(plan[j].fechaFinJornadas || '').trim();
        if (a1 && a2 && b1 && b2 && a1 <= b2 && b1 <= a2) {
          return (
            `Las ventanas de «${labelMun(plan[i])}» y «${labelMun(plan[j])}» se cruzan. ` +
            'En modo por municipio las fechas no pueden solaparse (un municipio por día).'
          );
        }
      }
    }
    return null;
  }

  const ini = String(opts.fechaInicJornadas || '').trim();
  const fin = String(opts.fechaFinJornadas || '').trim();
  if (exigirFechas) {
    if (!ini) return 'Indique la fecha de inicio de jornadas del contrato.';
    if (!fin) return 'Indique la fecha fin de jornadas del contrato.';
  }
  if (ini && fin) {
    if (fin < ini) return 'La fecha fin de jornadas debe ser igual o posterior al inicio.';
    const habiles = contarDiasProgramables(ini, fin, flags);
    let needed = 0;
    if (plan.length) {
      needed = plan.reduce((s, r) => s + diasNecesarios(r.numJornadas, r.jornadasPorDia), 0);
    } else {
      needed = diasNecesarios(opts.numerojornadas, opts.jornadasPorDia);
    }
    if (needed > 0 && habiles < needed) {
      return (
        `El calendario del contrato no alcanza: necesita ${needed} día(s) hábil(es) y solo hay ${habiles} ` +
        `entre ${ini} y ${fin}. Amplíe la fecha fin, reduzca el plan o active sábados, domingos o festivos.`
      );
    }
  }
  return null;
}

export function clasesPorJornadaParaMunicipio(
  plan: FilaPlanMunicipio[] | null | undefined,
  jornada: { codMunicipio?: string; municipio?: string },
  fallback: number,
): number {
  const rows = plan || [];
  if (!rows.length) return fallback;
  const cod = String(jornada.codMunicipio || '').trim();
  const nom = String(jornada.municipio || '')
    .trim()
    .toUpperCase();
  const row = rows.find((r) => {
    const rc = String(r.codMunicipio || '').trim();
    if (cod && rc) return rc === cod;
    return String(r.municipio || '')
      .trim()
      .toUpperCase() === nom;
  });
  if (!row) return fallback;
  return Math.max(0, Math.min(20, parseInt(String(row.clasesPorJornada ?? fallback), 10) || 0));
}
