const DatosAlumno = require('../models/DatosAlumno');
const { models } = require('../models/catalogos');
const { calcularEdad, rangoEdadLabel, RANGOS_EDAD } = require('../utils/edad');
const {
  normalizarOrigenJornadaCap,
  normalizarTipoInstitucionEducativa,
  normalizarPerfilInstitucionEducativa,
  labelPerfilInstitucionEducativa,
  labelAreaImparteColegio,
  ORIGEN_JORNADA_LABELS,
  TIPO_INSTITUCION_LABELS,
  ORIGENES_JORNADA_CAP,
} = require('../constants/origenJornadaCap');

const CAMPOS_CATALOGO = [
  { key: 'estadoCivil', out: 'porEstadoCivil', model: models.estadoCivil, codeFields: ['idEstadoCivil', 'id', 'codigo'] },
  { key: 'estrato', out: 'porEstrato', model: models.estrato, codeFields: ['idEstrato', 'id', 'codigo'] },
  { key: 'regimenSalud', out: 'porRegimenSalud', model: models.catRegimenSalud, codeFields: ['idRegimen', 'id', 'codigo'] },
  { key: 'nivelFormacion', out: 'porNivelFormacion', model: models.nivelFormacion, codeFields: ['idNivel', 'id', 'codigo'] },
  { key: 'ocupacion', out: 'porOcupacion', model: models.ocupacion, codeFields: ['idOcupacion', 'id', 'codigo'] },
  { key: 'discapacidad', out: 'porDiscapacidad', model: models.discapacidad, codeFields: ['idDiscapacidad', 'id', 'codigo'] },
  { key: 'multiCulturalidad', out: 'porMultiCulturalidad', model: models.multiCulturalidad, codeFields: ['id', 'codigo'] },
];

const labelCache = new Map();

function etiquetaGenero(raw) {
  const t = String(raw || '').trim().toUpperCase();
  if (!t) return 'Sin dato';
  if (t === 'M' || t.startsWith('MASC')) return 'Masculino';
  if (t === 'F' || t.startsWith('FEM')) return 'Femenino';
  return String(raw).trim();
}

function codigoDoc(doc, codeFields) {
  for (const f of codeFields || []) {
    if (doc[f] != null && String(doc[f]).trim() !== '') return String(doc[f]).trim();
  }
  const desc = doc.descripcion ? String(doc.descripcion).trim() : '';
  const m = desc.match(/^(\d+)/);
  return m ? m[1] : '';
}

function etiquetaDoc(doc) {
  if (doc.descripcion) return String(doc.descripcion).trim();
  if (doc.nombre) return String(doc.nombre).trim();
  return '';
}

async function mapaCatalogo(model, codeFields, cacheKey) {
  if (!model) return new Map();
  if (labelCache.has(cacheKey)) return labelCache.get(cacheKey);
  let docs = [];
  try {
    docs = await model.find({}).lean();
  } catch {
    docs = [];
  }
  const map = new Map();
  for (const doc of docs) {
    const etiqueta = etiquetaDoc(doc);
    const codigo = codigoDoc(doc, codeFields);
    if (!etiqueta) continue;
    if (codigo) {
      map.set(codigo, etiqueta);
      const m = codigo.match(/^(\d+)/);
      if (m) map.set(m[1], etiqueta);
    }
    map.set(etiqueta, etiqueta);
  }
  labelCache.set(cacheKey, map);
  return map;
}

function labelDe(map, raw) {
  const t = String(raw || '').trim();
  if (!t) return 'Sin dato';
  return map.get(t) || map.get(t.replace(/^(\d+).*/, '$1')) || t;
}

function contar(map, label) {
  map.set(label, (map.get(label) || 0) + 1);
}

function aLista(map, ordenFijo) {
  const rows = [...map.entries()].map(([label, value]) => ({ label, value }));
  if (ordenFijo?.length) {
    const order = new Map(ordenFijo.map((l, i) => [l, i]));
    rows.sort((a, b) => {
      const ia = order.has(a.label) ? order.get(a.label) : 999;
      const ib = order.has(b.label) ? order.get(b.label) : 999;
      if (ia !== ib) return ia - ib;
      return b.value - a.value;
    });
  } else {
    rows.sort((a, b) => {
      if (a.label === 'Sin dato') return 1;
      if (b.label === 'Sin dato') return -1;
      return b.value - a.value;
    });
  }
  return rows;
}

function labelOrigenAlumno(a) {
  const o = normalizarOrigenJornadaCap(a?.origenJornadaCap) || 'operativo';
  return ORIGEN_JORNADA_LABELS[o] || o;
}

function labelTipoInstitucion(a) {
  const t = normalizarTipoInstitucionEducativa(a?.tipoInstitucionEducativa);
  if (!t) return 'Sin tipo';
  return TIPO_INSTITUCION_LABELS[t] || t;
}

function labelColegio(a) {
  const nom = String(a?.colegioNombre || '').trim();
  if (!nom) return 'Sin institución';
  const perfil = normalizarPerfilInstitucionEducativa(a?.perfilInstitucionEducativa) || 'estudiante';
  if (perfil === 'profesor') {
    const area = labelAreaImparteColegio(a?.areaImparteColegio) || 'Sin área';
    return `${nom} · Profesor · ${area}`;
  }
  const grado = parseInt(a?.gradoColegio, 10);
  if (Number.isFinite(grado) && grado >= 1 && grado <= 11) {
    return `${nom} · Grado ${grado}`;
  }
  const prog = String(a?.programaInstitucion || '').trim();
  if (prog) return `${nom} · ${prog}`;
  return nom;
}

function labelGrado(a) {
  const perfil = normalizarPerfilInstitucionEducativa(a?.perfilInstitucionEducativa) || 'estudiante';
  if (perfil === 'profesor') {
    return `Profesor · ${labelAreaImparteColegio(a?.areaImparteColegio) || 'Sin área'}`;
  }
  const grado = parseInt(a?.gradoColegio, 10);
  if (Number.isFinite(grado) && grado >= 1 && grado <= 11) return `Grado ${grado}`;
  const prog = String(a?.programaInstitucion || '').trim();
  if (prog) return prog;
  return 'Sin grado / programa';
}

function labelPerfilInstitucion(a) {
  return labelPerfilInstitucionEducativa(a?.perfilInstitucionEducativa || 'estudiante');
}

function labelAreaProfesor(a) {
  return labelAreaImparteColegio(a?.areaImparteColegio) || 'Sin área';
}

function labelEstamento(a) {
  return String(a?.estamentoNombre || '').trim() || 'Sin estamento';
}

function labelCargo(a) {
  return String(a?.cargoEstamento || '').trim() || 'Sin cargo';
}

function labelDependencia(a) {
  return String(a?.dependenciaEstamento || '').trim() || 'Sin dependencia';
}

function labelEmpresa(a) {
  return String(a?.empresaNombre || '').trim() || 'Sin empresa';
}

/** Estudiante / Profesor (solo origen institución educativa). */
function textoPerfilAlumnoInforme(a) {
  const origen = normalizarOrigenJornadaCap(a?.origenJornadaCap) || 'operativo';
  if (origen !== 'colegio') return '—';
  return labelPerfilInstitucionEducativa(
    normalizarPerfilInstitucionEducativa(a?.perfilInstitucionEducativa) || 'estudiante',
  );
}

/**
 * Detalle de caracterización por origen para tablas de informes PDF.
 * Operativo y empresa no llevan detalle adicional (solo la etiqueta de origen).
 */
function textoCaracterizacionAlumnoInforme(a) {
  const origen = normalizarOrigenJornadaCap(a?.origenJornadaCap) || 'operativo';
  if (origen === 'operativo' || origen === 'empresa') return '—';

  if (origen === 'colegio') {
    const parts = [];
    const inst = String(a?.colegioNombre || '').trim();
    if (inst) parts.push(inst);
    const tipo = normalizarTipoInstitucionEducativa(a?.tipoInstitucionEducativa);
    if (tipo) parts.push(TIPO_INSTITUCION_LABELS[tipo] || tipo);
    const perfil = normalizarPerfilInstitucionEducativa(a?.perfilInstitucionEducativa) || 'estudiante';
    if (perfil === 'profesor') {
      const area = labelAreaImparteColegio(a?.areaImparteColegio);
      if (area && area !== 'Sin área') parts.push(area);
    } else {
      const grado = parseInt(a?.gradoColegio, 10);
      if (Number.isFinite(grado) && grado >= 1 && grado <= 11) {
        parts.push(`Grado ${grado}`);
      }
      const sem = parseInt(a?.semestreInstitucion, 10);
      if (Number.isFinite(sem) && sem >= 1) parts.push(`Semestre ${sem}`);
      const prog = String(a?.programaInstitucion || '').trim();
      if (prog) parts.push(prog);
    }
    return parts.length ? parts.join(' · ') : '—';
  }

  if (origen === 'estamento') {
    const parts = [];
    const est = String(a?.estamentoNombre || '').trim();
    if (est) parts.push(est);
    const cargo = String(a?.cargoEstamento || '').trim();
    if (cargo) parts.push(`Cargo: ${cargo}`);
    const dep = String(a?.dependenciaEstamento || '').trim();
    if (dep) parts.push(`Dependencia: ${dep}`);
    return parts.length ? parts.join(' · ') : '—';
  }

  return '—';
}

/** Etiqueta de origen para tablas de informes PDF. */
function textoOrigenAlumnoInforme(a) {
  return labelOrigenAlumno(a);
}

/**
 * Agrega demografía + origen de jornada a partir de documentos DatosAlumno ya cargados.
 * @param {Array<object>} docs
 * @returns {Promise<object>}
 */
async function caracterizarDesdeDocs(docs) {
  const list = Array.isArray(docs) ? docs : [];
  const mapas = {};
  await Promise.all(
    CAMPOS_CATALOGO.map(async (c) => {
      mapas[c.key] = await mapaCatalogo(c.model, c.codeFields, c.key);
    }),
  );

  const porEdad = new Map(RANGOS_EDAD.map((r) => [r.label, 0]));
  porEdad.set('Sin dato', 0);
  const porGenero = new Map();
  const buckets = {};
  for (const c of CAMPOS_CATALOGO) buckets[c.out] = new Map();

  const porOrigenJornada = new Map(
    ORIGENES_JORNADA_CAP.map((k) => [ORIGEN_JORNADA_LABELS[k], 0]),
  );
  const porTipoInstitucion = new Map();
  const porPerfilInstitucion = new Map();
  const porColegio = new Map();
  const porGradoColegio = new Map();
  const porAreaProfesor = new Map();
  const porEstamento = new Map();
  const porCargoEstamento = new Map();
  const porDependenciaEstamento = new Map();
  const porEmpresa = new Map();

  for (const a of list) {
    const edad = calcularEdad(a.fechaNac);
    contar(porEdad, rangoEdadLabel(edad));
    contar(porGenero, etiquetaGenero(a.genero));
    for (const c of CAMPOS_CATALOGO) {
      contar(buckets[c.out], labelDe(mapas[c.key], a[c.key]));
    }

    const origen = normalizarOrigenJornadaCap(a.origenJornadaCap) || 'operativo';
    contar(porOrigenJornada, labelOrigenAlumno(a));

    if (origen === 'colegio') {
      contar(porTipoInstitucion, labelTipoInstitucion(a));
      contar(porPerfilInstitucion, labelPerfilInstitucion(a));
      contar(porColegio, labelColegio(a));
      contar(porGradoColegio, labelGrado(a));
      const perfil = normalizarPerfilInstitucionEducativa(a.perfilInstitucionEducativa) || 'estudiante';
      if (perfil === 'profesor') contar(porAreaProfesor, labelAreaProfesor(a));
    } else if (origen === 'estamento') {
      contar(porEstamento, labelEstamento(a));
      contar(porCargoEstamento, labelCargo(a));
      contar(porDependenciaEstamento, labelDependencia(a));
    } else if (origen === 'empresa') {
      contar(porEmpresa, labelEmpresa(a));
    }
  }

  const ordenOrigen = ORIGENES_JORNADA_CAP.map((k) => ORIGEN_JORNADA_LABELS[k]);

  return {
    total: list.length,
    porEdad: aLista(porEdad, [...RANGOS_EDAD.map((r) => r.label), 'Sin dato']),
    porGenero: aLista(porGenero),
    porEstadoCivil: aLista(buckets.porEstadoCivil),
    porEstrato: aLista(buckets.porEstrato),
    porRegimenSalud: aLista(buckets.porRegimenSalud),
    porNivelFormacion: aLista(buckets.porNivelFormacion),
    porOcupacion: aLista(buckets.porOcupacion),
    porDiscapacidad: aLista(buckets.porDiscapacidad),
    porMultiCulturalidad: aLista(buckets.porMultiCulturalidad),
    porOrigenJornada: aLista(porOrigenJornada, ordenOrigen),
    porTipoInstitucion: aLista(porTipoInstitucion),
    porPerfilInstitucion: aLista(porPerfilInstitucion),
    porColegio: aLista(porColegio),
    porGradoColegio: aLista(porGradoColegio),
    porAreaProfesor: aLista(porAreaProfesor),
    porEstamento: aLista(porEstamento),
    porCargoEstamento: aLista(porCargoEstamento),
    porDependenciaEstamento: aLista(porDependenciaEstamento),
    porEmpresa: aLista(porEmpresa),
  };
}

/**
 * Caracterización global (todos los alumnos) o filtrada por numDocs.
 * @param {{ numDocs?: number[] }} [opts]
 */
async function caracterizarPoblacion(opts = {}) {
  const filter = {};
  if (Array.isArray(opts.numDocs)) {
    if (!opts.numDocs.length) return caracterizarDesdeDocs([]);
    filter.numDoc = { $in: opts.numDocs };
  }
  const docs = await DatosAlumno.find(filter)
    .select(
      [
        'fechaNac',
        'genero',
        'estadoCivil',
        'estrato',
        'regimenSalud',
        'nivelFormacion',
        'ocupacion',
        'discapacidad',
        'multiCulturalidad',
        'origenJornadaCap',
        'tipoInstitucionEducativa',
        'perfilInstitucionEducativa',
        'colegioCodigo',
        'colegioNombre',
        'gradoColegio',
        'areaImparteColegio',
        'programaInstitucion',
        'estamentoId',
        'estamentoNombre',
        'cargoEstamento',
        'dependenciaEstamento',
        'empresaId',
        'empresaNombre',
      ].join(' '),
    )
    .lean();
  return caracterizarDesdeDocs(docs);
}

module.exports = {
  calcularEdad,
  rangoEdadLabel,
  caracterizarDesdeDocs,
  caracterizarPoblacion,
  textoOrigenAlumnoInforme,
  textoPerfilAlumnoInforme,
  textoCaracterizacionAlumnoInforme,
};
