/** Tipos de certificado / plantilla según capacitación */
const TIPOS = {
  CURSO: 'curso',
  TECNICO: 'tecnico',
  COMPETENCIAS: 'competencias',
  DIPLOMADO: 'diplomado',
  LICENCIA: 'licencia',
  MERCANCIAS: 'mercancias_peligrosas',
};

const TIPOS_VALIDOS = Object.values(TIPOS);

const TIPOS_LABEL = {
  [TIPOS.CURSO]: 'Cursos',
  [TIPOS.TECNICO]: 'Técnico',
  [TIPOS.COMPETENCIAS]: 'Capacitación por competencias',
  [TIPOS.DIPLOMADO]: 'Diplomados',
  [TIPOS.LICENCIA]: 'Certificación licencia',
  [TIPOS.MERCANCIAS]: 'Mercancías peligrosas',
};

const ORIENTACIONES = ['vertical', 'horizontal'];

const RE_MP =
  /mercanc[ií]as\s*peligrosas|peligrosas\s*clase|transporte\s*de\s*mercanc/i;

function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

function slotVacio() {
  return { orientacion: 'vertical', id: null };
}

/** Un formato por tipo: orientación elegida + id plantilla */
function normalizePlantillaPorTipo(raw) {
  const out = {};
  for (const t of TIPOS_VALIDOS) out[t] = slotVacio();
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw)) {
    if (!TIPOS_VALIDOS.includes(k)) continue;
    if (v == null || typeof v === 'string') {
      out[k] = { orientacion: 'vertical', id: v || null };
      continue;
    }
    if (typeof v !== 'object') continue;
    // Legado: { vertical, horizontal }
    if ('vertical' in v || 'horizontal' in v) {
      if (v.vertical) out[k] = { orientacion: 'vertical', id: v.vertical };
      else if (v.horizontal) out[k] = { orientacion: 'horizontal', id: v.horizontal };
      continue;
    }
    const id = v.id || v.plantillaId || null;
    const orientacion = v.orientacion === 'horizontal' ? 'horizontal' : 'vertical';
    out[k] = { orientacion, id: id || null };
  }
  return out;
}

function clasificarPrograma(prog) {
  if (!prog) return TIPOS.CURSO;
  const blob = [prog.nombreProg, prog.nomCert, prog.descripcion, prog.codigoProg].join(' ');
  if (RE_MP.test(blob)) return TIPOS.MERCANCIAS;

  const t = norm(prog.idTipCap);
  if (t.includes('competenc')) return TIPOS.COMPETENCIAS;
  if (t.includes('diplomado')) return TIPOS.DIPLOMADO;
  if (t.includes('tecnico')) return TIPOS.TECNICO;
  if (t.includes('licencia') || t.includes('conduccion')) return TIPOS.LICENCIA;
  if (t.includes('curso')) return TIPOS.CURSO;

  return TIPOS.CURSO;
}

function slotPlantillaPorTipo(config, tipo) {
  const map = normalizePlantillaPorTipo(config.plantillaPorTipo);
  return map[tipo] || slotVacio();
}

function idPlantillaPorTipo(config, tipo) {
  return slotPlantillaPorTipo(config, tipo).id || null;
}

function orientacionPorTipo(config, tipo) {
  const o = slotPlantillaPorTipo(config, tipo).orientacion;
  return o === 'horizontal' ? 'horizontal' : 'vertical';
}

module.exports = {
  TIPOS,
  TIPOS_VALIDOS,
  TIPOS_LABEL,
  ORIENTACIONES,
  clasificarPrograma,
  normalizePlantillaPorTipo,
  slotPlantillaPorTipo,
  idPlantillaPorTipo,
  orientacionPorTipo,
};
