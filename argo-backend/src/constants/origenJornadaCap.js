/** Orígenes de participantes en jornadas de capacitación (contrato + ficha alumno). */
const {
  TIPO_CERTIFICADO_GLOBAL,
  TIPO_CERTIFICADO_POR_CLASE,
  TIPOS_CERTIFICADO_CONTRATO,
} = require('./jornadaCapacitacion');

const ORIGENES_JORNADA_CAP = ['colegio', 'estamento', 'empresa', 'operativo'];

/** Subtipos del origen institución educativa (clave API sigue siendo `colegio`). */
const TIPOS_INSTITUCION_EDUCATIVA = [
  'primaria',
  'secundaria',
  'tecnica',
  'tecnologica',
  'universidad',
];

/** Perfil dentro de institución educativa: estudiante (legado) o profesor. */
const PERFILES_INSTITUCION_EDUCATIVA = ['estudiante', 'profesor'];

const ORIGEN_JORNADA_LABELS = {
  colegio: 'Institución educativa',
  estamento: 'Estamento público',
  empresa: 'Empresa',
  operativo: 'Operativo / calle',
};

const TIPO_INSTITUCION_LABELS = {
  primaria: 'Primaria',
  secundaria: 'Secundaria',
  tecnica: 'Técnica',
  tecnologica: 'Tecnológica',
  universidad: 'Universidad',
  /** Legado */
  colegio: 'Secundaria',
  instituto: 'Técnica',
};

/** Semestres típicos en educación superior (1–12). */
const SEMESTRES_INSTITUCION = Array.from({ length: 12 }, (_, i) => i + 1);

function esNivelBasicaMedia(tipo) {
  const t = normalizarTipoInstitucionEducativa(tipo);
  return t === 'primaria' || t === 'secundaria';
}

function esNivelSuperior(tipo) {
  const t = normalizarTipoInstitucionEducativa(tipo);
  return t === 'tecnica' || t === 'tecnologica' || t === 'universidad';
}

/** Cursos/grados permitidos según nivel. */
function cursosParaNivel(tipo) {
  const t = normalizarTipoInstitucionEducativa(tipo);
  if (t === 'primaria') {
    return Array.from({ length: 5 }, (_, i) => ({
      value: i + 1,
      label: `Curso ${i + 1}`,
    }));
  }
  if (t === 'secundaria') {
    return Array.from({ length: 6 }, (_, i) => ({
      value: i + 6,
      label: `Grado ${i + 6}`,
    }));
  }
  return [];
}

const PERFIL_INSTITUCION_LABELS = {
  estudiante: 'Estudiante',
  profesor: 'Profesor',
};

/** Áreas que imparte un profesor en institución educativa (catálogo fijo). */
const AREAS_IMPARTIDAS_COLEGIO = [
  { key: 'matematicas', label: 'Matemáticas' },
  { key: 'lengua_castellana', label: 'Lengua castellana' },
  { key: 'ingles', label: 'Inglés' },
  { key: 'ciencias_naturales', label: 'Ciencias naturales' },
  { key: 'ciencias_sociales', label: 'Ciencias sociales' },
  { key: 'educacion_fisica', label: 'Educación física' },
  { key: 'educacion_artistica', label: 'Educación artística' },
  { key: 'tecnologia_informatica', label: 'Tecnología e informática' },
  { key: 'etica_valores', label: 'Ética y valores' },
  { key: 'religion', label: 'Religión' },
  { key: 'filosofia', label: 'Filosofía' },
  { key: 'quimica', label: 'Química' },
  { key: 'fisica', label: 'Física' },
  { key: 'biologia', label: 'Biología' },
  { key: 'orientacion_escolar', label: 'Orientación escolar' },
  { key: 'coordinacion', label: 'Coordinación académica' },
  { key: 'directivo', label: 'Directivo / rectoría' },
  { key: 'otra', label: 'Otra área' },
];

const AREA_IMPARTIDA_KEYS = AREAS_IMPARTIDAS_COLEGIO.map((a) => a.key);
const AREA_IMPARTIDA_LABELS = Object.fromEntries(
  AREAS_IMPARTIDAS_COLEGIO.map((a) => [a.key, a.label]),
);

function origenesContratoDefault() {
  return {
    colegio: false,
    estamento: false,
    empresa: false,
    operativo: true,
  };
}

function configCertOrigenDefault(
  fallbackNum = 1,
  fallbackTipo = TIPO_CERTIFICADO_GLOBAL,
  fallbackProg = '',
) {
  return {
    numSesCert: Math.max(1, parseInt(fallbackNum, 10) || 1),
    tipoCertificado: normalizarTipoCertContrato(fallbackTipo),
    idProgramaCertificacion: String(fallbackProg || '').trim(),
  };
}

function certificacionOrigenDefault(contrato = null) {
  const fbNum = contrato?.numSesCert ?? 1;
  const fbTipo = contrato?.tipoCertificado ?? TIPO_CERTIFICADO_GLOBAL;
  const fbProg = contrato?.idProgramaCertificacion ?? '';
  const base = {};
  for (const k of ORIGENES_JORNADA_CAP) {
    base[k] = configCertOrigenDefault(fbNum, fbTipo, fbProg);
  }
  return base;
}

function normalizarTipoCertContrato(raw) {
  const t = String(raw ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
  if (t === 'por_clase' || t === 'porclase') return TIPO_CERTIFICADO_POR_CLASE;
  if (TIPOS_CERTIFICADO_CONTRATO?.includes?.(t)) return t;
  return TIPO_CERTIFICADO_GLOBAL;
}

function normalizarOrigenJornadaCap(raw) {
  const t = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (ORIGENES_JORNADA_CAP.includes(t)) return t;
  if (
    t.includes('coleg') ||
    t.includes('instituc') ||
    t.includes('universidad') ||
    t.includes('instituto') ||
    t === 'ies' ||
    t.includes('educacion superior')
  ) {
    return 'colegio';
  }
  if (t.includes('estament') || t.includes('autoridad') || t.includes('publico')) return 'estamento';
  if (t.includes('empres') || t.includes('cliente')) return 'empresa';
  if (t.includes('operativ') || t.includes('calle')) return 'operativo';
  return '';
}

function normalizarTipoInstitucionEducativa(raw) {
  const t = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (TIPOS_INSTITUCION_EDUCATIVA.includes(t)) return t;
  // Legado UI/API
  if (t === 'colegio' || t.includes('secund')) return 'secundaria';
  if (t === 'instituto' || (t.includes('tecnic') && !t.includes('tecnolog'))) return 'tecnica';
  if (t.includes('tecnolog')) return 'tecnologica';
  if (t.includes('univers')) return 'universidad';
  if (t.includes('primar') || t.includes('escuela') || t.includes('basica primaria')) {
    return 'primaria';
  }
  if (t.includes('coleg') || t.includes('basica') || t.includes('media')) return 'secundaria';
  if (t.includes('instit') || t.includes('sena')) return 'tecnica';
  return '';
}

function normalizarPerfilInstitucionEducativa(raw) {
  const t = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (PERFILES_INSTITUCION_EDUCATIVA.includes(t)) return t;
  if (t.includes('profesor') || t.includes('docente') || t.includes('maestro') || t === 'teacher') {
    return 'profesor';
  }
  if (t.includes('estudi') || t.includes('alumno') || t.includes('student')) return 'estudiante';
  return '';
}

function normalizarAreaImparteColegio(raw) {
  const t = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s/-]+/g, '_');
  if (!t) return '';
  if (AREA_IMPARTIDA_KEYS.includes(t)) return t;
  const byLabel = AREAS_IMPARTIDAS_COLEGIO.find((a) => {
    const lab = a.label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s/-]+/g, '_');
    return lab === t || lab.includes(t) || t.includes(a.key);
  });
  return byLabel?.key || '';
}

function labelAreaImparteColegio(raw) {
  const k = normalizarAreaImparteColegio(raw);
  if (k) return AREA_IMPARTIDA_LABELS[k] || k;
  const s = String(raw || '').trim();
  return s || '';
}

function labelPerfilInstitucionEducativa(raw) {
  const p = normalizarPerfilInstitucionEducativa(raw) || 'estudiante';
  return PERFIL_INSTITUCION_LABELS[p] || p;
}

function normalizarOrigenesContrato(raw) {
  const base = origenesContratoDefault();
  if (!raw || typeof raw !== 'object') return base;
  for (const k of ORIGENES_JORNADA_CAP) {
    if (raw[k] !== undefined) base[k] = !!raw[k];
  }
  // Al menos un origen activo.
  if (!ORIGENES_JORNADA_CAP.some((k) => base[k])) base.operativo = true;
  return base;
}

/**
 * Normaliza mapa de certificación por origen.
 * Conserva valores top-level del contrato como fallback (contratos antiguos).
 */
function normalizarCertificacionOrigen(raw, contrato = null) {
  const base = certificacionOrigenDefault(contrato);
  if (!raw || typeof raw !== 'object') return base;
  for (const k of ORIGENES_JORNADA_CAP) {
    const row = raw[k];
    if (!row || typeof row !== 'object') continue;
    if (row.numSesCert !== undefined) {
      base[k].numSesCert = Math.max(1, parseInt(row.numSesCert, 10) || 1);
    }
    if (row.tipoCertificado !== undefined) {
      base[k].tipoCertificado = normalizarTipoCertContrato(row.tipoCertificado);
    }
    if (row.idProgramaCertificacion !== undefined) {
      base[k].idProgramaCertificacion = String(row.idProgramaCertificacion || '').trim();
    }
  }
  return base;
}

/**
 * Config de certificación aplicable a un alumno según su origen.
 * Fallback: operativo → top-level contrato → defaults.
 */
function configCertificacionParaOrigen(contrato, origenRaw) {
  const origen =
    normalizarOrigenJornadaCap(origenRaw) ||
    (contrato?.origenesAlumnos?.operativo !== false ? 'operativo' : '') ||
    'operativo';
  const map = normalizarCertificacionOrigen(contrato?.certificacionOrigen, contrato);
  const row = map[origen] || map.operativo;
  const tipoCertificado = normalizarTipoCertContrato(
    row?.tipoCertificado ?? contrato?.tipoCertificado,
  );
  let idProgramaCertificacion = String(row?.idProgramaCertificacion || '').trim();
  // Fallback legado: programa top-level del contrato.
  if (!idProgramaCertificacion) {
    idProgramaCertificacion = String(contrato?.idProgramaCertificacion || '').trim();
  }
  return {
    origen,
    numSesCert: Math.max(1, parseInt(row?.numSesCert, 10) || 1),
    tipoCertificado,
    idProgramaCertificacion,
  };
}

function origenActivoEnContrato(origenes, origen) {
  const o = normalizarOrigenJornadaCap(origen);
  if (!o) return false;
  const map = normalizarOrigenesContrato(origenes);
  return !!map[o];
}

module.exports = {
  ORIGENES_JORNADA_CAP,
  ORIGEN_JORNADA_LABELS,
  TIPOS_INSTITUCION_EDUCATIVA,
  TIPO_INSTITUCION_LABELS,
  PERFILES_INSTITUCION_EDUCATIVA,
  PERFIL_INSTITUCION_LABELS,
  AREAS_IMPARTIDAS_COLEGIO,
  AREA_IMPARTIDA_KEYS,
  AREA_IMPARTIDA_LABELS,
  SEMESTRES_INSTITUCION,
  esNivelBasicaMedia,
  esNivelSuperior,
  cursosParaNivel,
  origenesContratoDefault,
  certificacionOrigenDefault,
  configCertOrigenDefault,
  normalizarOrigenJornadaCap,
  normalizarTipoInstitucionEducativa,
  normalizarPerfilInstitucionEducativa,
  normalizarAreaImparteColegio,
  labelAreaImparteColegio,
  labelPerfilInstitucionEducativa,
  normalizarOrigenesContrato,
  normalizarCertificacionOrigen,
  normalizarTipoCertContrato,
  configCertificacionParaOrigen,
  origenActivoEnContrato,
};
