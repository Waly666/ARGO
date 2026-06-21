import type { ProgramaItem, ServicioItem } from '../api/domain';

export type TarifaMatricula = 1 | 2 | 3;

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v) || 0;
  if (typeof v === 'object' && v !== null && '$numberDecimal' in v) {
    return Number((v as { $numberDecimal: string }).$numberDecimal) || 0;
  }
  return Number(v) || 0;
}

function normTipoCap(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function esTipCapJornadaLabel(text: string): boolean {
  const t = normTipoCap(text);
  if (!t) return false;
  return (
    /jornadas? de capacitacion/.test(t) ||
    /jornada capacitacion/.test(t) ||
    /cap jornada/.test(t) ||
    (t.includes('jornada') && t.includes('capacitacion'))
  );
}

/** Programas de jornadas de capacitación no se matriculan desde ficha alumno (módulo Jornadas). */
export function esProgramaJornadasCap(prog: ProgramaItem | null | undefined): boolean {
  if (!prog) return false;
  const tc = String(prog.tipoCertificado || '')
    .toLowerCase()
    .replace(/-/g, '_');
  if (tc === 'jornada_capacitacion') return true;
  const campos = [
    String(prog.idTipCap ?? ''),
    String(prog.tipoCap ?? ''),
    String(prog.nombreProg ?? ''),
    String(prog.descripcion ?? ''),
  ];
  return campos.some((c) => esTipCapJornadaLabel(c));
}

export function idPrograma(prog: ProgramaItem): string {
  return String(prog.idPrograma ?? prog.idProg ?? prog._id ?? '');
}

export function programasParaMatricula(programas: ProgramaItem[]): ProgramaItem[] {
  return programas
    .filter((p) => !esProgramaJornadasCap(p))
    .sort((a, b) => {
      const ca = String(a.codigoProg || idPrograma(a)).trim();
      const cb = String(b.codigoProg || idPrograma(b)).trim();
      return ca.localeCompare(cb, 'es', { sensitivity: 'base', numeric: true });
    });
}

export function filtrarProgramasBusqueda(programas: ProgramaItem[], q: string): ProgramaItem[] {
  const t = q.trim().toLowerCase();
  if (!t) return programas;
  return programas.filter((p) => {
    const blob = [p.nombreProg, p.codigoProg, p.descripcion, p.nomCert, idPrograma(p)]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return blob.includes(t);
  });
}

export function labelPrograma(prog: ProgramaItem): string {
  const nombre = String(prog.nombreProg || prog.descripcion || '').trim();
  const cod = String(prog.codigoProg || '').trim();
  return cod ? `${nombre} (${cod})` : nombre || idPrograma(prog);
}

function esHoraPractica(s: ServicioItem | null | undefined): boolean {
  if (!s) return false;
  if (s.rolServicio === 'hora_practica') return true;
  return /\bhoras?\b.*\bpractic/i.test(String(s.descrServicio || s.descripcion || ''));
}

function esDerechosGrado(s: ServicioItem | null | undefined): boolean {
  if (!s) return false;
  if (s.rolServicio === 'derechos_grado') return true;
  return /derechos\s+de\s+grado/i.test(String(s.descrServicio || s.descripcion || ''));
}

function tieneIdProg(s: ServicioItem | null | undefined): boolean {
  return s?.idProg != null && String(s.idProg).trim() !== '';
}

export function esProgramaTecnicoLaboral(prog: ProgramaItem | null | undefined): boolean {
  if (!prog) return false;
  const cod = String(prog.codigoProg || '').trim().toUpperCase();
  if (cod.startsWith('TEC')) return true;
  const tip = String(prog.idTipCap || '').toLowerCase();
  return /tecnico|competenc/.test(tip);
}

export function esServicioMatriculaPrograma(s: ServicioItem | null | undefined): boolean {
  return tieneIdProg(s) && !esHoraPractica(s) && !esDerechosGrado(s);
}

export function serviciosAdicionalesLista(servicios: ServicioItem[]): ServicioItem[] {
  return servicios.filter((s) => !esServicioMatriculaPrograma(s));
}

export function permiteCantidadServicio(s: ServicioItem | null | undefined): boolean {
  if (!s) return false;
  if (s.permiteCantidad === true) return num(s.tarifa1) > 0;
  if (s.permiteCantidad === false) return false;
  if (s.valorVariable === true) return false;
  if (s.usaCantidad === false) return false;
  if (esServicioMatriculaPrograma(s)) return false;
  if (num(s.tarifa1) <= 0) return false;
  if (esHoraPractica(s)) return true;
  if (s.usaCantidad === true) return true;
  return false;
}

export function calcularValorMatricula(
  prog: ProgramaItem | null | undefined,
  servicios: ServicioItem[],
  tarifa: TarifaMatricula,
): number {
  if (!prog) return 0;
  const idP = idPrograma(prog);
  const porProg = servicios.filter(
    (s) => String(s.idProg) === idP && !esHoraPractica(s) && !esDerechosGrado(s),
  );
  let base = 0;
  const sem = Number(prog.semestres);
  if (Number.isFinite(sem) && sem >= 1 && porProg.length > 0) {
    base = porProg.reduce((acc, s) => {
      const key = `tarifa${tarifa}` as keyof ServicioItem;
      const v = s[key];
      if (v != null && v !== '') return acc + num(v);
      return acc + num(s.tarifa1);
    }, 0);
  } else {
    const serv = porProg[0] || servicios.find((s) => String(s.idServ) === String(prog.idServ));
    if (serv) {
      const key = `tarifa${tarifa}` as keyof ServicioItem;
      const v = serv[key];
      if (v != null && v !== '') base = num(v);
    } else {
      const keyProg = `tarifa${tarifa}` as keyof ProgramaItem;
      const vProg = prog[keyProg];
      if (vProg != null && vProg !== '') base = num(vProg);
      else base = num(prog.valorMatricula);
    }
  }
  return base;
}

export function esProgramaCea(prog: ProgramaItem | null | undefined): boolean {
  if (!prog) return false;
  return num(prog.horasTeoria) + num(prog.horasPractica) + num(prog.horasTaller) > 0;
}

export function descrConCantidad(base: string, cant: number): string {
  const limpio = base
    .replace(/\s+x\s*\d+\s*$/i, '')
    .replace(/\s*\(\s*\d+\s*h\s*\)\s*$/i, '')
    .replace(/\s*\(\s*cant\.\s*\d+\s*\)\s*$/i, '')
    .trim();
  return `${limpio} x ${cant}`;
}

export function valorServicioAdicional(
  servicio: ServicioItem | null | undefined,
  cantidad: number,
  valorManual: number,
): number {
  if (!servicio) return 0;
  if (permiteCantidadServicio(servicio)) {
    return num(servicio.tarifa1) * Math.max(1, Math.floor(cantidad));
  }
  return valorManual;
}
