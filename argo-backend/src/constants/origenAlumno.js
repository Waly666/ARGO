/** Origen de inscripción del alumno (canal de alta). */
const ORIGEN_SISTEMA = 'SISTEMA';
const ORIGEN_WEB = 'WEB';

const ORIGENES_ALUMNO = [ORIGEN_SISTEMA, ORIGEN_WEB];
const ORIGEN_ALUMNO_DEFAULT = ORIGEN_SISTEMA;

const ETIQUETAS_ORIGEN_ALUMNO = {
  [ORIGEN_SISTEMA]: 'Inscrito por sistema',
  [ORIGEN_WEB]: 'Inscrito por página web',
};

function normalizarOrigenAlumno(raw) {
  const t = String(raw || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '_');
  if (!t) return ORIGEN_ALUMNO_DEFAULT;
  if (t === 'SISTEMA' || t === 'SISTEMA_ARGO' || t === 'APP' || t === 'MOVIL' || t === 'ERP') {
    return ORIGEN_SISTEMA;
  }
  if (
    t === 'WEB' ||
    t === 'PORTAL' ||
    t === 'PAGINA_WEB' ||
    t === 'SITIO' ||
    t.includes('WEB') ||
    t.includes('PORTAL')
  ) {
    return ORIGEN_WEB;
  }
  return ORIGENES_ALUMNO.includes(t) ? t : ORIGEN_ALUMNO_DEFAULT;
}

function etiquetaOrigenAlumno(raw) {
  const v = normalizarOrigenAlumno(raw);
  return ETIQUETAS_ORIGEN_ALUMNO[v] || ETIQUETAS_ORIGEN_ALUMNO[ORIGEN_ALUMNO_DEFAULT];
}

module.exports = {
  ORIGEN_SISTEMA,
  ORIGEN_WEB,
  ORIGENES_ALUMNO,
  ORIGEN_ALUMNO_DEFAULT,
  ETIQUETAS_ORIGEN_ALUMNO,
  normalizarOrigenAlumno,
  etiquetaOrigenAlumno,
};
