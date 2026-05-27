const { CATALOGOS } = require('../models/catalogos');

/** Catálogos con pantallas dedicadas (no editar aquí). */
const EXCLUIDOS_ADMIN = new Set(['programas', 'servicios']);

const ETIQUETAS = {
  catTipoDoc: 'Tipos de documento',
  catTipoCapacitacion: 'Tipos de capacitación',
  catTipServicio: 'Tipos de servicio',
  cuentasBancarias: 'Cuentas bancarias',
  bancos: 'Bancos',
  catTipoPago: 'Tipos de pago',
  tipoIngreso: 'Tipos de ingreso',
  tipoEgreso: 'Tipos de egreso',
  catRegimenSalud: 'Régimen de salud',
  jornada: 'Jornadas',
  estrato: 'Estratos',
  nivelFormacion: 'Nivel de formación',
  ocupacion: 'Ocupaciones',
  discapacidad: 'Discapacidades',
  estadoCivil: 'Estado civil',
  genero: 'Género',
  tipoSangre: 'Tipo de sangre',
  multiCulturalidad: 'Multiculturalidad',
  claseVehiculo: 'Clases de vehículo',
  marcasVehiculos: 'Marcas de vehículos',
  lineasVehiculos: 'Líneas de vehículos',
  coloresVehiculos: 'Colores de vehículos',
  carrocerias: 'Carrocerías',
  divipola: 'Divipola (municipios)',
  aulas: 'Aulas',
  itemDocumentosVehiculo: 'Documentos vehículo',
  itemDocumentosInstructores: 'Documentos instructores',
  itemsEstGral: 'Ítems estado general',
  adaptaciones: 'Adaptaciones',
  aspecto1: 'Aspecto 1',
  aspecto2: 'Aspecto 2',
};

const ID_FIELDS_HINT = {
  catTipoDoc: ['idTipoDoc'],
  catTipoCapacitacion: ['idTipCap'],
  catTipServicio: ['idTipoServ'],
  cuentasBancarias: ['idCuenta'],
  bancos: ['idBanco'],
  catTipoPago: ['idTipoPago'],
  tipoIngreso: ['idTipoIngreso'],
  tipoEgreso: ['idTipoEgreso'],
  catRegimenSalud: ['idRegimen'],
  jornada: ['idJornada'],
  estrato: ['idEstrato'],
  nivelFormacion: ['idNivel'],
  ocupacion: ['idOcupacion'],
  discapacidad: ['idDiscapacidad'],
  estadoCivil: ['idEstadoCivil'],
  genero: ['idGenero'],
  tipoSangre: ['idTipoSangre'],
  multiCulturalidad: ['idMulti'],
  claseVehiculo: ['idClase'],
  marcasVehiculos: ['idMarca'],
  lineasVehiculos: ['idLinea'],
  coloresVehiculos: ['idColor'],
  carrocerias: ['idCarroceria'],
  divipola: ['codMunicipio'],
  aulas: ['idAula'],
  itemDocumentosVehiculo: ['idDocVehi'],
  itemDocumentosInstructores: ['idDocInst'],
  itemsEstGral: ['idItemEsGral'],
};

/** Campos válidos por catálogo (evita columnas basura del Excel en admin). */
const CAMPOS_ESQUEMA = {
  itemDocumentosVehiculo: ['idDocVehi', 'documentoVehi', 'descripcionDocVehi', 'controlaVencimiento'],
  itemDocumentosInstructores: ['idDocInst', 'documentoInst', 'descripcionDocInst', 'controlaVencimiento'],
  itemsEstGral: ['idItemEsGral', 'item', 'idClases'],
  adaptaciones: ['idAdaptacion', 'nombre', 'idClases'],
  aspecto1: ['idAspecto1', 'aspecto1', 'idClases'],
  aspecto2: ['idAspecto2', 'aspecto2', 'idClases'],
  tipoEgreso: ['idTipoEgreso', 'tipo', 'requiereEmpleado', 'efectoNomina', 'requiereVehiculo'],
};

/** Catálogos del checklist preoperacional (asignación por clase en cada ítem). */
const CATALOGOS_INSPECCION = new Set(['itemsEstGral', 'aspecto1', 'aspecto2', 'adaptaciones']);

/** Catálogos maestros de tipos de documento (vehículo / instructor). */
const CATALOGOS_DOCUMENTOS = new Set(['itemDocumentosVehiculo', 'itemDocumentosInstructores']);

function normBoolCatalogo(v) {
  if (v === true || v === 1 || v === '1' || v === 'true' || v === 'si' || v === 'Sí') return true;
  if (v === false || v === 0 || v === '0' || v === 'false' || v === 'no' || v === 'No') return false;
  return null;
}

function normalizeIdClases(v) {
  if (v == null || v === '') return [];
  if (Array.isArray(v)) {
    return [...new Set(v.map((c) => String(c).trim()).filter(Boolean))];
  }
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return [];
    if (t.startsWith('[')) {
      try {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed)) return normalizeIdClases(parsed);
      } catch {
        /* ignore */
      }
    }
    return [t];
  }
  return [String(v).trim()].filter(Boolean);
}

function camposEsquema(nombre) {
  return CAMPOS_ESQUEMA[nombre] || null;
}

function docSegunEsquema(nombre, body) {
  const campos = camposEsquema(nombre);
  const doc = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (k === '_id' || k === '__v') continue;
    if (campos && !campos.includes(k)) continue;
    if (k === 'idClases') {
      doc[k] = normalizeIdClases(v);
      continue;
    }
    if (k === 'controlaVencimiento') {
      doc[k] = normBoolCatalogo(v) ?? true;
      continue;
    }
    if (typeof v === 'string') {
      const t = v.trim();
      doc[k] = t === '' ? null : t;
    } else {
      doc[k] = v;
    }
  }
  return doc;
}

function resolverCamposListado(nombre, row) {
  const esquema = camposEsquema(nombre);
  if (esquema?.length) return ['_id', ...esquema];
  if (row) {
    return Object.keys(row).filter((k) => k !== '__v' && !/^col\d+$/i.test(k));
  }
  return [];
}

function nombreValido(nombre) {
  return !!CATALOGOS[nombre] && !EXCLUIDOS_ADMIN.has(nombre);
}

function metaCatalogo(nombre) {
  if (!nombreValido(nombre)) return null;
  return {
    nombre,
    label: ETIQUETAS[nombre] || nombre,
    idFields: ID_FIELDS_HINT[nombre] || [],
    grande: nombre === 'divipola',
    esInspeccionChecklist: CATALOGOS_INSPECCION.has(nombre),
    esCatalogoDocumento: CATALOGOS_DOCUMENTOS.has(nombre),
  };
}

function listarMeta() {
  return Object.keys(CATALOGOS)
    .filter((k) => nombreValido(k))
    .map((k) => metaCatalogo(k))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

function inferirCamposId(doc, hints = []) {
  const keys = Object.keys(doc || {}).filter((k) => k !== '_id' && k !== '__v');
  const fromHint = hints.filter((h) => doc && doc[h] != null);
  if (fromHint.length) return fromHint;
  const idLike = keys.filter((k) => /^id[A-Z_]|^cod[A-Z_]/i.test(k));
  return idLike.length ? idLike : keys.slice(0, 1);
}

module.exports = {
  EXCLUIDOS_ADMIN,
  normalizeIdClases,
  CATALOGOS_INSPECCION,
  CATALOGOS_DOCUMENTOS,
  nombreValido,
  metaCatalogo,
  listarMeta,
  inferirCamposId,
  camposEsquema,
  docSegunEsquema,
  resolverCamposListado,
};
