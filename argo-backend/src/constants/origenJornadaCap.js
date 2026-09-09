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

function normalizeIdProgramasOrigen(raw) {
  const list = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  const out = [];
  const seen = new Set();
  for (const item of list) {
    const id = String(item ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
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
    idProgramas: [],
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
 * En por_clase, `idProgramas` es la lista de programas de ese origen.
 * Legado: si un origen por_clase no tiene lista propia, copia `contrato.idProgramas`.
 */
function normalizarCertificacionOrigen(raw, contrato = null) {
  const base = certificacionOrigenDefault(contrato);
  if (raw && typeof raw === 'object') {
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
      if (row.idProgramas !== undefined) {
        base[k].idProgramas = normalizeIdProgramasOrigen(row.idProgramas);
      }
    }
  }
  const legado = normalizeIdProgramasOrigen(contrato?.idProgramas);
  if (legado.length) {
    for (const k of ORIGENES_JORNADA_CAP) {
      if (
        base[k].tipoCertificado === TIPO_CERTIFICADO_POR_CLASE &&
        !base[k].idProgramas.length
      ) {
        base[k].idProgramas = [...legado];
      }
    }
  }
  return base;
}

/** Lista de programas permitidos en un origen por_clase (vacío si el origen es global). */
function idsProgramasPorClaseOrigen(contrato, origenRaw) {
  const origen = normalizarOrigenJornadaCap(origenRaw);
  if (!origen) return [];
  const map = normalizarCertificacionOrigen(contrato?.certificacionOrigen, contrato);
  const row = map[origen] || map.operativo;
  if (normalizarTipoCertContrato(row?.tipoCertificado) !== TIPO_CERTIFICADO_POR_CLASE) {
    return [];
  }
  return normalizeIdProgramasOrigen(row?.idProgramas);
}

function origenEsCertPorClase(contrato, origenRaw) {
  const origen = normalizarOrigenJornadaCap(origenRaw);
  if (!origen) return false;
  const map = normalizarCertificacionOrigen(contrato?.certificacionOrigen, contrato);
  const row = map[origen] || map.operativo;
  return normalizarTipoCertContrato(row?.tipoCertificado) === TIPO_CERTIFICADO_POR_CLASE;
}

/**
 * Unión de programas de los orígenes activos (por clase + programa global).
 * Lista permitida al autogenerar: el plan de instructores no añade programas extra.
 */
function idsProgramasOrigenesActivosContrato(contrato) {
  const origenes = normalizarOrigenesContrato(contrato?.origenesAlumnos);
  const map = normalizarCertificacionOrigen(contrato?.certificacionOrigen, contrato);
  const out = [];
  const seen = new Set();
  for (const k of ORIGENES_JORNADA_CAP) {
    if (!origenes[k]) continue;
    const row = map[k] || map.operativo;
    if (normalizarTipoCertContrato(row?.tipoCertificado) === TIPO_CERTIFICADO_POR_CLASE) {
      for (const id of normalizeIdProgramasOrigen(row?.idProgramas)) {
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(id);
      }
    } else {
      const g = String(row?.idProgramaCertificacion || '').trim();
      if (g && !seen.has(g)) {
        seen.add(g);
        out.push(g);
      }
    }
  }
  return out;
}

/**
 * Programas para autogenerar clases: solo si hay exactamente un origen activo por_clase.
 * Con varios orígenes por_clase el instructor elige origen y programa al operar.
 */
function programasAutogeneracionContrato(contrato) {
  const origenes = normalizarOrigenesContrato(contrato?.origenesAlumnos);
  const map = normalizarCertificacionOrigen(contrato?.certificacionOrigen, contrato);
  const activosPorClase = ORIGENES_JORNADA_CAP.filter(
    (k) => origenes[k] && normalizarTipoCertContrato(map[k]?.tipoCertificado) === TIPO_CERTIFICADO_POR_CLASE,
  );
  if (activosPorClase.length !== 1) return [];
  return normalizeIdProgramasOrigen(map[activosPorClase[0]]?.idProgramas);
}

/** Unión de listas por_clase (compat con campo top-level idProgramas). */
function unionIdProgramasPorClase(certificacionOrigen) {
  const seen = new Set();
  const out = [];
  if (!certificacionOrigen || typeof certificacionOrigen !== 'object') return out;
  for (const k of ORIGENES_JORNADA_CAP) {
    const row = certificacionOrigen[k];
    if (!row || normalizarTipoCertContrato(row.tipoCertificado) !== TIPO_CERTIFICADO_POR_CLASE) {
      continue;
    }
    for (const id of normalizeIdProgramasOrigen(row.idProgramas)) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
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
  normalizeIdProgramasOrigen,
  idsProgramasPorClaseOrigen,
  origenEsCertPorClase,
  programasAutogeneracionContrato,
  idsProgramasOrigenesActivosContrato,
  unionIdProgramasPorClase,
};
