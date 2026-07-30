/** Orígenes de participantes en jornadas de capacitación (contrato + ficha alumno). */
const {
  TIPO_CERTIFICADO_GLOBAL,
  TIPO_CERTIFICADO_POR_CLASE,
  TIPOS_CERTIFICADO_CONTRATO,
} = require('./jornadaCapacitacion');

const ORIGENES_JORNADA_CAP = ['colegio', 'estamento', 'empresa', 'operativo'];

/** Subtipos del origen institución educativa (clave API sigue siendo `colegio`). */
const TIPOS_INSTITUCION_EDUCATIVA = ['colegio', 'instituto', 'universidad'];

const ORIGEN_JORNADA_LABELS = {
  colegio: 'Institución educativa',
  estamento: 'Estamento público',
  empresa: 'Empresa',
  operativo: 'Operativo / calle',
};

const TIPO_INSTITUCION_LABELS = {
  colegio: 'Colegio',
  instituto: 'Instituto técnico',
  universidad: 'Universidad',
};

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
  if (t.includes('univers')) return 'universidad';
  if (t.includes('instit') || t.includes('tecnico') || t.includes('sena')) return 'instituto';
  if (t.includes('coleg') || t.includes('escuela') || t.includes('basica') || t.includes('media')) {
    return 'colegio';
  }
  return '';
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
  origenesContratoDefault,
  certificacionOrigenDefault,
  configCertOrigenDefault,
  normalizarOrigenJornadaCap,
  normalizarTipoInstitucionEducativa,
  normalizarOrigenesContrato,
  normalizarCertificacionOrigen,
  normalizarTipoCertContrato,
  configCertificacionParaOrigen,
  origenActivoEnContrato,
};
