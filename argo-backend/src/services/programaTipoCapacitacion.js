const {
  cargarIndiceTipCap,
  resolverIdTipCapCanonico,
  filaCatalogoPorValorTipCap,
  normalizarTextoCap,
} = require('./tipoCapacitacionMatch');

/** idTipCap canónico de «Cursos no formales» en catálogo estándar ARGO. */
const ID_TIP_CAP_CURSOS_NO_FORMALES = '3';

function esEtiquetaCursosNoFormales(text) {
  const t = normalizarTextoCap(text);
  if (!t) return false;
  if (/cursos?\s*no\s*formales?/.test(t)) return true;
  if (t === 'curso' || t === 'cursos') return true;
  return t.includes('curso') && t.includes('no formal');
}

function esIdTipCapCursosNoFormales(canon) {
  const c = String(canon ?? '').trim();
  if (!c) return false;
  if (c === ID_TIP_CAP_CURSOS_NO_FORMALES) return true;
  const n = Number(c);
  return Number.isFinite(n) && n === Number(ID_TIP_CAP_CURSOS_NO_FORMALES);
}

function esCodigoProgCursoNoFormal(prog) {
  const cod = String(prog?.codigoProg ?? '').trim().toUpperCase();
  return /^CUR\d/.test(cod);
}

/**
 * true si el programa pertenece al tipo «Cursos no formales» (catálogo idTipCap 3 o equivalente).
 */
async function esProgramaCursoNoFormal(prog) {
  if (!prog) return false;

  const tipoCert = String(prog.tipoCertificado || '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_');
  if (tipoCert === 'curso') return true;

  if (esCodigoProgCursoNoFormal(prog)) return true;

  const indice = await cargarIndiceTipCap();
  const canon = resolverIdTipCapCanonico(prog.idTipCap, indice);
  if (esIdTipCapCursosNoFormales(canon)) return true;

  const fila = filaCatalogoPorValorTipCap(prog.idTipCap, indice);
  if (fila && esEtiquetaCursosNoFormales(fila.tipoCap || fila.descripcion || fila.nombre)) {
    return true;
  }

  const campos = [prog.idTipCap, prog.tipoCap];
  return campos.some((c) => esEtiquetaCursosNoFormales(String(c || '')));
}

module.exports = {
  ID_TIP_CAP_CURSOS_NO_FORMALES,
  esEtiquetaCursosNoFormales,
  esProgramaCursoNoFormal,
};
