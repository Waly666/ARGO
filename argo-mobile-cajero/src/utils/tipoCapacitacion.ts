import type { ProgramaItem } from '../api/domain';

export function esUsuarioGestor(rol?: string | null): boolean {
  const r = String(rol || '').trim().toLowerCase();
  if (r === 'gestor' || r === 'tramitador') return true;
  return /^gestor[_-]/.test(r);
}

function normTipoCap(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function esEtiquetaCursosNoFormales(text: string): boolean {
  const t = normTipoCap(text);
  if (!t) return false;
  if (/cursos?\s*no\s*formales?/.test(t)) return true;
  if (t === 'curso' || t === 'cursos') return true;
  return t.includes('curso') && t.includes('no formal');
}

/** Programa de tipo «Cursos no formales» (idTipCap 3 o equivalente). */
export function esProgramaCursoNoFormal(prog: ProgramaItem | null | undefined): boolean {
  if (!prog) return false;

  const tipoCert = String(prog.tipoCertificado || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  if (tipoCert === 'curso') return true;

  const cod = String(prog.codigoProg || '').trim().toUpperCase();
  if (/^CUR\d/.test(cod)) return true;

  for (const raw of [prog.idTipCap, prog.tipoCap]) {
    const s = String(raw ?? '').trim();
    if (!s) continue;
    if (s === '3' || s.startsWith('3 ')) return true;
    if (esEtiquetaCursosNoFormales(s)) return true;
  }

  return false;
}

export function programasParaMatriculaGestor(programas: ProgramaItem[]): ProgramaItem[] {
  return programas.filter(esProgramaCursoNoFormal);
}
