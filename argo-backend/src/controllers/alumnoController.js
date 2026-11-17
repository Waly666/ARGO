const DatosAlumno = require('../models/DatosAlumno');
const Cliente     = require('../models/Cliente');
const { models } = require('../models/catalogos');
const divipola = models.divipola;
const jornadaModel = models.jornada;
const estadoCivilModel = models.estadoCivil;
const actorVialModel = models.actorVial;
const upload = require('../middleware/upload');
const { procesarCedulaImagen } = require('../services/cedulaOcr');
const { procesarCedulaMrz } = require('../services/cedulaMrz');
const { obtenerConfigRequisitosDocumentos } = require('../services/configRequisitosDocumentos');
const { calcularDocumentosRequeridos, patchDocsAlumno, validarDocumentosParaPrograma, validarDocumentosPendientesAlumno, mensajeDocumentosPendientes } = require('../services/alumnoDocumentos');
const { enriquecerIndicadoresLista, movimientosHoyPorAlumnos } = require('../services/alumnoIndicadores');
const { listarComprobantesRecientes } = require('../services/comprobantesAlertas');
const {
  resolverJornadasFiltro,
  numDocsParticipantesJornadas,
  numDocsConCertificadoJornada,
  filtroAlumnosPorNumDocs,
  enriquecerCertificadoJornada,
} = require('../services/alumnosJornadaCapLista');
const mongoose = require('mongoose');
const { parseNumDoc, numDocFromParams, numDocQueryNativo, numDocInvalidMessage } = require('../utils/numDoc');
const {
  normalizarAlertaPagoEnDto,
  listarAlertasPagoHoy,
} = require('../services/alertaPagoAlumno');

function claveNumDocIndicador(numDoc) {
  const n = parseNumDoc(numDoc);
  return n != null ? n : numDoc;
}
const { esAdmin, normalizarRol } = require('../utils/roles');
const { filtroBusquedaAlumno } = require('../utils/busquedaAlumnoNombre');
const {
  TIPO_ALUMNO_DEFAULT,
  TIPO_JORNADAS_CAPACITACION,
  normalizarTipoAlumno,
} = require('../constants/tipoAlumno');
const { calcularEdad, rangoEdadLabel } = require('../utils/edad');
const { ORIGEN_SISTEMA, ORIGEN_WEB, normalizarOrigenAlumno } = require('../constants/origenAlumno');
const { ACTOR_VIAL_DEF } = require('../constants/actorVialCatalogo');
const { ensureActorVialCatalogo } = require('../services/actorVialCatalogo');
const { parseFechaCalendario } = require('../utils/fechaCalendario');
const { publicOriginFromReq } = require('../utils/publicOrigin');
const XLSX = require('xlsx');
const { obtenerConfigRecibo } = require('../services/configRecibo');
const {
  informeGoogleFontsLinkHtml,
  informeDocumentoBaseCss,
  htmlEncabezadoEmpresa,
} = require('../services/informeEncabezadoEmpresa');
const { resolverBasePortal } = require('../utils/portalPublicUrl');
const {
  provisionarAccesoPortalSiVirtual,
  enviarAccesoPortalAlumno,
  estadoAccesoPortalPorNumDoc,
  resetearPasswordPortalAlumno,
} = require('../services/portalAccesoAlumno');
const {
  resolverAlcanceGestorMovil,
  filtroAlumnosAlcanceGestor,
  assertAlumnoAccesibleGestor,
  assertAlumnoPorNumDocGestor,
  esPerfilGestor,
} = require('../services/alcanceGestorUsuario');

const GENEROS_VALIDOS = new Set(['M', 'F', 'I']);
const TIPOS_SANGRE_VALIDOS = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

function normalizarGenero(v) {
  const t = String(v || '').toUpperCase().trim();
  if (t === 'M' || t.startsWith('MASC')) return 'M';
  if (t === 'F' || t.startsWith('FEM')) return 'F';
  if (t === 'I' || t.startsWith('INTER')) return 'I';
  return GENEROS_VALIDOS.has(t) ? t : '';
}

function normalizarTipoSangre(v) {
  const t = String(v || '').toUpperCase().replace(/\s/g, '');
  const m = t.match(/^(AB|A|B|O)(\+|-)$/);
  if (m && TIPOS_SANGRE_VALIDOS.has(`${m[1]}${m[2]}`)) return `${m[1]}${m[2]}`;
  return TIPOS_SANGRE_VALIDOS.has(t) ? t : '';
}

const DEFAULT_JORNADAS = [
  { idJornada: '1', descripcion: '1) DIURNA' },
  { idJornada: '2', descripcion: '2) NOCTURNA' },
  { idJornada: '3', descripcion: '3) FIN DE SEMANA' },
];
const DEFAULT_ESTADOS_CIVIL = [
  { idEstadoCivil: '1', descripcion: '1) SOLTERO' },
  { idEstadoCivil: '2', descripcion: '2) CASADO' },
  { idEstadoCivil: '3', descripcion: '3) UNIÓN LIBRE' },
  { idEstadoCivil: '4', descripcion: '4) SEPARADO' },
  { idEstadoCivil: '5', descripcion: '5) VIUDO' },
  { idEstadoCivil: '6', descripcion: '6) DIVORCIADO' },
  { idEstadoCivil: '7', descripcion: '7) SIN INFORMACIÓN' },
];

let cacheJornadaLabels = null;
let cacheEstadoCivilLabels = null;
let cacheActorVialLabels = null;

function codigoDesdeDoc(doc, codeFields) {
  for (const f of codeFields) {
    if (doc[f] != null && doc[f] !== '') return String(doc[f]).trim();
  }
  const desc = doc.descripcion ? String(doc.descripcion).trim() : '';
  const m = desc.match(/^(\d+)/);
  return m ? m[1] : '';
}

function etiquetaDesdeDoc(doc) {
  if (doc.descripcion) return String(doc.descripcion).trim();
  if (doc.nombre) return String(doc.nombre).trim();
  return '';
}

async function buildLabelMap(model, codeFields, defaults) {
  const docs = await model.find({}).lean();
  const lista = docs.length ? docs : defaults;
  const map = new Map();

  const registrar = (codigo, etiqueta) => {
    if (!codigo || !etiqueta) return;
    const c = String(codigo).trim();
    const e = String(etiqueta).trim();
    map.set(c, e);
    const m = c.match(/^(\d+)/);
    if (m) map.set(m[1], e);
  };

  for (const doc of lista) {
    const etiqueta = etiquetaDesdeDoc(doc) || codigoDesdeDoc(doc, codeFields);
    const codigo = codigoDesdeDoc(doc, codeFields);
    if (codigo) registrar(codigo, etiqueta);
    if (doc.descripcion) registrar(String(doc.descripcion).trim(), etiqueta);
  }
  return map;
}

async function getJornadaLabels() {
  if (!cacheJornadaLabels) {
    cacheJornadaLabels = await buildLabelMap(jornadaModel, ['idJornada', 'id', 'codigo'], DEFAULT_JORNADAS);
  }
  return cacheJornadaLabels;
}

async function getEstadoCivilLabels() {
  if (!cacheEstadoCivilLabels) {
    cacheEstadoCivilLabels = await buildLabelMap(
      estadoCivilModel,
      ['idEstadoCivil', 'id', 'codigo'],
      DEFAULT_ESTADOS_CIVIL,
    );
  }
  return cacheEstadoCivilLabels;
}

async function getActorVialLabels() {
  if (!cacheActorVialLabels) {
    await ensureActorVialCatalogo();
    cacheActorVialLabels = await buildLabelMap(actorVialModel, ['idActorVial', 'id', 'codigo'], ACTOR_VIAL_DEF);
  }
  return cacheActorVialLabels;
}

function labelCatalogo(map, valor) {
  if (valor == null || valor === '') return '';
  const v = String(valor).trim();
  if (map.has(v)) return map.get(v);
  const m = v.match(/^(\d+)/);
  if (m && map.has(m[1])) return map.get(m[1]);
  return v;
}

async function aplicarArchivos(dto, files, alumnoPrev) {
  const config = await obtenerConfigRequisitosDocumentos();
  if (files?.foto?.[0]) dto.urlFoto = upload.publicUrl('alumnos', files.foto[0].filename);
  if (files?.cedula?.[0]) {
    const url = upload.publicUrl('alumnos', files.cedula[0].filename);
    dto.urlCedula = url;
    const tipo = config.tiposDocumento.find((t) => t.codigo === 'CEDULA');
    if (tipo) Object.assign(dto, patchDocsAlumno(alumnoPrev || dto, tipo.id, url, config));
  }
  if (files?.licencia?.[0]) {
    const url = upload.publicUrl('alumnos', files.licencia[0].filename);
    dto.urlLicencia = url;
    const tipo = config.tiposDocumento.find((t) => t.codigo === 'LICENCIA');
    if (tipo) Object.assign(dto, patchDocsAlumno(alumnoPrev || dto, tipo.id, url, config));
  }
}

function nombreCompleto(a) {
  const n = [a.nombre1, a.nombre2].filter(Boolean).join(' ').trim();
  const ap = [a.apellido1, a.apellido2].filter(Boolean).join(' ').trim();
  return { nombres: n, apellidos: ap, nombreCompleto: [ap, n].filter(Boolean).join(' ').trim() };
}

const SORT_ALUMNOS_KEYS = {
  fechaReg: ['fechaReg'],
  numDoc: ['numDoc'],
  nombre: ['apellido1', 'apellido2', 'nombre1', 'nombre2'],
  fechaNac: ['fechaNac'],
  jornada: ['jornada'],
  estadoCivil: ['estadoCivil'],
  actorVial: ['actorVial'],
  correo: ['correo'],
  celular: ['celular'],
  direccion: ['direccion'],
  munOrigen: ['codMunicipio', 'munOrigen'],
};

function resolveSortAlumnos(sortRaw, dirRaw) {
  const sortKey = String(sortRaw || '').trim() || 'fechaReg';
  const dir = String(dirRaw || '').toLowerCase() === 'asc' ? 1 : -1;
  if (sortKey === 'fechaReg') {
    return { fechaReg: dir, _id: dir };
  }
  const fields = SORT_ALUMNOS_KEYS[sortKey] || SORT_ALUMNOS_KEYS.fechaReg;
  const out = {};
  for (const f of fields) out[f] = dir;
  return out;
}

function mapListaItem(doc) {
  const extra = nombreCompleto(doc);
  const codMun = doc.codMunicipio || doc.munOrigen || '';
  const edad = calcularEdad(doc.fechaNac);
  return {
    _id: doc._id,
    numDoc: doc.numDoc,
    tipoDoc: doc.tipoDoc,
    tipoAlumno: doc.tipoAlumno,
    origen: normalizarOrigenAlumno(doc.origen),
    expedida: doc.expedida,
    nombre1: doc.nombre1,
    nombre2: doc.nombre2,
    apellido1: doc.apellido1,
    apellido2: doc.apellido2,
    nombres: extra.nombres,
    apellidos: extra.apellidos,
    nombreCompleto: extra.nombreCompleto,
    genero: doc.genero,
    identidadGenero: doc.identidadGenero,
    orientacionSexual: doc.orientacionSexual,
    fechaNac: doc.fechaNac,
    edad,
    grupoEdad: edad == null ? null : rangoEdadLabel(edad),
    tipoSangre: doc.tipoSangre,
    jornada: doc.jornada,
    estadoCivil: doc.estadoCivil,
    actorVial: doc.actorVial,
    estrato: doc.estrato,
    celular: doc.celular,
    correo: doc.correo,
    direccion: doc.direccion,
    munOrigen: doc.munOrigen,
    codMunicipio: codMun || undefined,
    codDepartamento: doc.codDepartamento || undefined,
    nombreDepartamento: doc.nombreDepartamento || undefined,
    nombreMunicipio: doc.nombreMunicipio || undefined,
    urlFoto: doc.urlFoto,
    urlCedula: doc.urlCedula,
    urlLicencia: doc.urlLicencia,
    docsAlumno: doc.docsAlumno,
    fechaReg: doc.fechaReg || doc.fechaAudi || null,
    fechaMod: doc.fechaMod || doc.fechaAudi,
    empresaId: doc.empresaId || null,
    empresaNombre: null,
    manejoGestorEmpresa: doc.manejoGestorEmpresa === true,
    tipoReferidorComercial: doc.tipoReferidorComercial || null,
    gestorId: doc.gestorId || null,
    gestorNombre: doc.gestorNombre || null,
    referidorEmpresaId: doc.referidorEmpresaId || null,
    referidorEmpresaNombre: doc.referidorEmpresaNombre || null,
  };
}

/** Resuelve el nombre de la empresa (Cliente) para una lista de items. */
async function enriquecerEmpresas(items) {
  const ids = [...new Set(items.map((i) => String(i.empresaId || '')).filter(Boolean))];
  if (!ids.length) return items;
  const mongoose = require('mongoose');
  const clientes = await Cliente.find({
    _id: { $in: ids.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id)) },
  }, { razonSocial: 1, nombres: 1, nombreComercial: 1, identificacion: 1 }).lean();
  const map = new Map(clientes.map((c) => [String(c._id), c]));
  return items.map((it) => {
    if (!it.empresaId) return it;
    const cli = map.get(String(it.empresaId));
    if (!cli) return it;
    const nombre = cli.razonSocial?.trim() || cli.nombreComercial?.trim() || cli.nombres?.trim() || cli.identificacion || '';
    return { ...it, empresaNombre: nombre || null };
  });
}

async function enriquecerCatalogos(items) {
  const [jMap, eMap, aMap] = await Promise.all([
    getJornadaLabels(),
    getEstadoCivilLabels(),
    getActorVialLabels(),
  ]);
  return items.map((it) => ({
    ...it,
    jornadaLabel: labelCatalogo(jMap, it.jornada) || it.jornada,
    estadoCivilLabel: labelCatalogo(eMap, it.estadoCivil) || it.estadoCivil,
    actorVialLabel: labelCatalogo(aMap, it.actorVial) || it.actorVial,
  }));
}

async function enriquecerMunicipios(items) {
  const codes = [
    ...new Set(
      items
        .map((i) => String(i.codMunicipio || i.munOrigen || '').trim())
        .filter(Boolean),
    ),
  ];
  if (!codes.length) return items;
  const munis = await divipola.find({ codMunicipio: { $in: codes } }).lean();
  const map = Object.fromEntries(
    munis.map((r) => [
      String(r.codMunicipio),
      {
        munOrigenLabel: String(r.nombreMunicipio || '').trim(),
        nombreMunicipio: r.nombreMunicipio,
        nombreDepartamento: r.nombreDepto,
        nombreDepto: r.nombreDepto,
        codDepartamento: r.codDepto,
      },
    ]),
  );
  return items.map((it) => {
    const cod = String(it.codMunicipio || it.munOrigen || '').trim();
    const m = cod ? map[cod] : null;
    return m ? { ...it, ...m } : it;
  });
}

function finDiaLocal(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Rango inclusivo de fechaReg (día civil local). Null si no hay fechas. */
function condicionFechaRegistro(desdeRaw, hastaRaw) {
  const desde = parseFechaCalendario(desdeRaw);
  const hasta = parseFechaCalendario(hastaRaw);
  if (!desde && !hasta) return null;
  if (desde && hasta && desde.getTime() > hasta.getTime()) {
    const err = new Error('La fecha inicial de registro no puede ser posterior a la final.');
    err.status = 400;
    throw err;
  }
  const rango = {};
  if (desde) rango.$gte = desde;
  if (hasta) rango.$lte = finDiaLocal(hasta);
  return { fechaReg: rango };
}

/**
 * Filtro compartido entre el listado paginado y la exportación.
 * @returns {Promise<{
 *   filter: object,
 *   sort: object,
 *   jornadaIds: unknown[],
 *   filtroJornadaActivo: boolean,
 *   vacio: boolean,
 *   mensajeVacio: string,
 * }>}
 */
async function armarFiltroListaAlumnos(req) {
  const q = (req.query.q || '').toString().trim();
  const tipoQ = (req.query.tipoAlumno || '').toString().trim();
  const idJornada = (req.query.idJornada || '').toString().trim();
  const fechaJornada = (req.query.fechaJornada || '').toString().trim();
  const certJornada = (req.query.certJornada || '').toString().trim().toLowerCase();
  const empresaId = (req.query.empresaId || '').toString().trim();
  const origenQ = (req.query.origen || '').toString().trim();
  const jornadaCat = (req.query.jornada || '').toString().trim();
  const actorVialCat = (req.query.actorVial || '').toString().trim();
  const fechaRegDesde = (req.query.fechaRegDesde || '').toString().trim();
  const fechaRegHasta = (req.query.fechaRegHasta || '').toString().trim();
  const condiciones = [];
  if (tipoQ) {
    condiciones.push({ tipoAlumno: normalizarTipoAlumno(tipoQ) });
  }
  if (q) {
    condiciones.push(filtroBusquedaAlumno(q));
  }
  if (empresaId && mongoose.Types.ObjectId.isValid(empresaId)) {
    condiciones.push({ empresaId: new mongoose.Types.ObjectId(empresaId) });
  }
  if (origenQ) {
    const origen = normalizarOrigenAlumno(origenQ);
    if (origen === ORIGEN_WEB) {
      condiciones.push({ origen: ORIGEN_WEB });
    } else {
      condiciones.push({
        $or: [
          { origen: { $exists: false } },
          { origen: null },
          { origen: '' },
          { origen: ORIGEN_SISTEMA },
        ],
      });
    }
  }
  if (jornadaCat) {
    const esc = jornadaCat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    condiciones.push({
      $or: [
        { jornada: jornadaCat },
        { jornada: new RegExp(`^${esc}(\\D|$)`, 'i') },
      ],
    });
  }
  if (actorVialCat) {
    const esc = actorVialCat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    condiciones.push({
      $or: [
        { actorVial: actorVialCat },
        { actorVial: new RegExp(`^${esc}(\\D|$)`, 'i') },
      ],
    });
  }
  const condFecha = condicionFechaRegistro(fechaRegDesde, fechaRegHasta);
  if (condFecha) condiciones.push(condFecha);

  let jornadaIds = [];
  const filtroJornadaActivo = !!(idJornada || fechaJornada);
  if (filtroJornadaActivo) {
    jornadaIds = await resolverJornadasFiltro({ idJornada, fechaJornada });
    if (!jornadaIds.length) {
      return {
        filter: { _id: null },
        sort: resolveSortAlumnos(req.query.sort, req.query.dir),
        jornadaIds: [],
        filtroJornadaActivo: true,
        vacio: true,
        mensajeVacio: 'No hay jornadas para el filtro indicado.',
      };
    }
    let numDocs = await numDocsParticipantesJornadas(jornadaIds);
    if (certJornada === 'con' || certJornada === 'sin') {
      const conCert = new Set(await numDocsConCertificadoJornada(jornadaIds));
      numDocs =
        certJornada === 'con'
          ? numDocs.filter((nd) => conCert.has(nd))
          : numDocs.filter((nd) => !conCert.has(nd));
    }
    if (!numDocs.length) {
      return {
        filter: { _id: null },
        sort: resolveSortAlumnos(req.query.sort, req.query.dir),
        jornadaIds,
        filtroJornadaActivo: true,
        vacio: true,
        mensajeVacio: 'No hay alumnos inscritos o con asistencia para el filtro indicado.',
      };
    }
    const filtroNum = filtroAlumnosPorNumDocs(numDocs);
    if (filtroNum) condiciones.push(filtroNum);
  }

  const alcanceGestor = await resolverAlcanceGestorMovil(req);
  const filtroGestor = filtroAlumnosAlcanceGestor(alcanceGestor);
  if (filtroGestor) condiciones.push(filtroGestor);

  const filter = condiciones.length === 0 ? {} : condiciones.length === 1 ? condiciones[0] : { $and: condiciones };
  return {
    filter,
    sort: resolveSortAlumnos(req.query.sort, req.query.dir),
    jornadaIds,
    filtroJornadaActivo,
    vacio: false,
    mensajeVacio: '',
  };
}

exports.listar = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);
    const consulta = await armarFiltroListaAlumnos(req);
    if (consulta.vacio) {
      return res.json({
        items: [],
        total: 0,
        skip,
        limit,
        jornadaFiltro: {
          activo: true,
          jornadaIds: consulta.jornadaIds.map(String),
          mensaje: consulta.mensajeVacio,
        },
      });
    }
    const { filter, sort, jornadaIds, filtroJornadaActivo } = consulta;
    const [docs, total] = await Promise.all([
      DatosAlumno.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      DatosAlumno.countDocuments(filter),
    ]);
    let items = await enriquecerMunicipios(docs.map(mapListaItem));
    items = await enriquecerCatalogos(items);
    items = await enriquecerEmpresas(items);
    items = await enriquecerIndicadoresLista(items);
    if (filtroJornadaActivo && jornadaIds.length) {
      items = await enriquecerCertificadoJornada(items, jornadaIds);
    }
    const payload = { items, total, skip, limit };
    if (filtroJornadaActivo) {
      payload.jornadaFiltro = { activo: true, jornadaIds: jornadaIds.map(String) };
    }
    res.json(payload);
  } catch (e) {
    next(e);
  }
};

const EXPORT_LISTA_MAX = 4000;
const EXPORT_LISTA_HEADERS = [
  'Nombre',
  'Documento',
  'Ciudad',
  'Actor vial',
  'Correo',
  'Celular',
  'Fecha registro',
];

function ciudadExportAlumno(it) {
  const mun = String(it.nombreMunicipio || it.munOrigenLabel || '').trim();
  const dep = String(it.nombreDepartamento || it.nombreDepto || '').trim();
  if (mun && dep) return `${mun} (${dep})`;
  if (mun) return mun;
  return String(it.codMunicipio || it.munOrigen || '').trim();
}

function fechaRegExport(val) {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function ymdLegible(raw) {
  const d = parseFechaCalendario(raw);
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function filasUbicacionExport(items) {
  return items.map((it) => [
    it.nombreCompleto || '',
    it.numDoc != null ? String(it.numDoc) : '',
    ciudadExportAlumno(it),
    it.actorVialLabel || it.actorVial || '',
    it.correo || '',
    it.celular || '',
    fechaRegExport(it.fechaReg),
  ]);
}

function escHtmlExport(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resumenFiltroExport(req, total) {
  const desde = ymdLegible(req.query.fechaRegDesde);
  const hasta = ymdLegible(req.query.fechaRegHasta);
  let rango = 'Todas las fechas de registro';
  if (desde && hasta) rango = `Registro del ${desde} al ${hasta}`;
  else if (desde) rango = `Registro desde el ${desde}`;
  else if (hasta) rango = `Registro hasta el ${hasta}`;
  const q = (req.query.q || '').toString().trim();
  const extra = q ? ` · Búsqueda: ${q}` : '';
  return `${rango}${extra} · ${total} alumno${total === 1 ? '' : 's'}`;
}

async function itemsParaExportar(req) {
  const consulta = await armarFiltroListaAlumnos(req);
  if (consulta.vacio) return { items: [], total: 0, resumen: consulta.mensajeVacio || 'Sin alumnos' };
  const total = await DatosAlumno.countDocuments(consulta.filter);
  if (total > EXPORT_LISTA_MAX) {
    const err = new Error(
      `Hay ${total} alumnos con el filtro actual. Reduzca el rango de fechas u otros filtros (máximo ${EXPORT_LISTA_MAX} por archivo).`,
    );
    err.status = 400;
    throw err;
  }
  const docs = await DatosAlumno.find(consulta.filter).sort(consulta.sort).limit(EXPORT_LISTA_MAX).lean();
  let items = await enriquecerMunicipios(docs.map(mapListaItem));
  items = await enriquecerCatalogos(items);
  return { items, total, resumen: resumenFiltroExport(req, total) };
}

function nombreArchivoExport(ext) {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  return `alumnos-ubicacion-${y}-${m}-${d}.${ext}`;
}

function htmlInformeAlumnosInscritos({ config, resumen, filas, generado }) {
  const thead = EXPORT_LISTA_HEADERS.map((h) => `<th>${escHtmlExport(h)}</th>`).join('');
  const tbody = filas.length
    ? filas
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escHtmlExport(cell)}</td>`).join('')}</tr>`,
        )
        .join('')
    : `<tr><td colspan="${EXPORT_LISTA_HEADERS.length}">No hay alumnos para el filtro indicado.</td></tr>`;
  const pie = String(config?.mensajePie || '').trim();
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  ${informeGoogleFontsLinkHtml()}
  <title>Informe alumnos inscritos</title>
  <style>
    @page { size: A4 landscape; margin: 12mm 10mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    ${informeDocumentoBaseCss()}
    html, body {
      margin: 0; padding: 0;
      background: #fff; color: #1a1a1a;
      font-size: 9pt; line-height: 1.35;
    }
    .doc-titulo-block {
      text-align: center; margin: 12px 0 14px;
      border-top: 1px solid #ccc; border-bottom: 1px solid #ccc;
      padding: 10px 0; background: #f8f9fb;
    }
    .doc-titulo-block h2 {
      margin: 0; font-size: 12pt; text-transform: uppercase; letter-spacing: 1px;
      color: #1e3a5f; font-weight: 700;
    }
    .doc-titulo-block p { margin: 4px 0 0; font-size: 9pt; color: #444; }
    table.tbl { width: 100%; border-collapse: collapse; font-size: 8pt; }
    table.tbl th, table.tbl td {
      border: 1px solid #999; padding: 3px 5px; vertical-align: top;
      text-align: left; word-break: break-word;
    }
    table.tbl th { background: #1a365d; color: #fff; font-weight: 700; }
    table.tbl tbody tr:nth-child(even) td { background: #f8fafc; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    .doc-footer {
      margin-top: 14px; padding-top: 8px; border-top: 1px solid #ccc;
      font-size: 8pt; color: #666; text-align: center;
    }
    .doc-footer p { margin: 0; }
  </style>
</head>
<body>
  ${htmlEncabezadoEmpresa(config || {}, escHtmlExport)}
  <div class="doc-titulo-block">
    <h2>Informe alumnos inscritos</h2>
    <p>${escHtmlExport(resumen)}</p>
    <p>Generado ${escHtmlExport(generado)}</p>
  </div>
  <table class="tbl">
    <thead><tr>${thead}</tr></thead>
    <tbody>${tbody}</tbody>
  </table>
  ${pie ? `<footer class="doc-footer"><p>${escHtmlExport(pie)}</p></footer>` : ''}
</body>
</html>`;
}

exports.exportarLista = async (req, res, next) => {
  try {
    const formato = String(req.query.formato || 'xlsx').trim().toLowerCase();
    if (formato !== 'xlsx' && formato !== 'pdf') {
      return res.status(400).json({ message: 'Formato no soportado. Use xlsx o pdf.' });
    }
    const { items, resumen } = await itemsParaExportar(req);
    const filas = filasUbicacionExport(items);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');

    if (formato === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([EXPORT_LISTA_HEADERS, ...filas]);
      ws['!cols'] = [
        { wch: 36 },
        { wch: 16 },
        { wch: 32 },
        { wch: 28 },
        { wch: 32 },
        { wch: 16 },
        { wch: 16 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const filename = nombreArchivoExport('xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    }

    const { launchBrowser, htmlToPdfBuffer } = require('../services/htmlToPdf');
    const config = await obtenerConfigRecibo().catch(() => ({}));
    const generado = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    const html = htmlInformeAlumnosInscritos({ config, resumen, filas, generado });
    const browser = await launchBrowser();
    try {
      const pdf = await htmlToPdfBuffer(browser, html);
      const filename = nombreArchivoExport('pdf');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(pdf);
    } finally {
      await browser.close().catch(() => {});
    }
  } catch (e) {
    next(e);
  }
};

exports.escanearCedula = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file?.buffer?.length) {
      return res.status(400).json({ message: 'Envíe una imagen del frente de la cédula en el campo "imagen".' });
    }
    if (!/^image\//.test(file.mimetype || '')) {
      return res.status(400).json({ message: 'El archivo debe ser una imagen (JPEG, PNG, etc.).' });
    }
    const resultado = await procesarCedulaImagen(file.buffer);
    const sugerido = { ...resultado.sugerido };
    sugerido.genero = normalizarGenero(sugerido.genero);
    sugerido.tipoSangre = normalizarTipoSangre(sugerido.tipoSangre);
    if (sugerido.numDoc) sugerido.numDoc = parseNumDoc(sugerido.numDoc) ?? sugerido.numDoc;
    res.json({
      sugerido,
      meta: resultado.meta,
    });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.escanearCedulaMrz = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file?.buffer?.length) {
      return res.status(400).json({ message: 'Envíe una imagen del reverso (zona MRZ) en el campo "imagen".' });
    }
    if (!/^image\//.test(file.mimetype || '')) {
      return res.status(400).json({ message: 'El archivo debe ser una imagen (JPEG, PNG, etc.).' });
    }
    const resultado = await procesarCedulaMrz(file.buffer);
    const sugerido = { ...resultado.sugerido };
    sugerido.genero = normalizarGenero(sugerido.genero);
    if (sugerido.numDoc) sugerido.numDoc = parseNumDoc(sugerido.numDoc) ?? sugerido.numDoc;
    res.json({
      sugerido,
      meta: resultado.meta,
    });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.porId = async (req, res, next) => {
  try {
    const a = await buscarAlumnoPorIdParam(req.params.id);
    if (!a) return res.status(404).json({ message: 'Alumno no encontrado' });
    await assertAlumnoAccesibleGestor(req, a);
    let empresaNombre = null;
    if (a.empresaId) {
      const cli = await Cliente.findById(a.empresaId, { razonSocial: 1, nombres: 1, nombreComercial: 1, identificacion: 1 }).lean();
      if (cli) {
        empresaNombre = cli.razonSocial?.trim() || cli.nombreComercial?.trim() || cli.nombres?.trim() || cli.identificacion || null;
      }
    }
    let gestorNombre = a.gestorNombre || null;
    if (!gestorNombre && a.gestorId) {
      const Gestor = require('../models/Gestor');
      const g = await Gestor.findById(a.gestorId, { nombres: 1, apellidos: 1, seudonimo: 1, numero: 1 }).lean();
      if (g) {
        gestorNombre =
          String(g.seudonimo || '').trim() ||
          [g.nombres, g.apellidos].filter(Boolean).join(' ').trim() ||
          String(g.numero || '');
      }
    }
    let referidorEmpresaNombre = a.referidorEmpresaNombre || null;
    if (!referidorEmpresaNombre && a.referidorEmpresaId) {
      const cli = await Cliente.findById(a.referidorEmpresaId, {
        razonSocial: 1,
        nombres: 1,
        nombreComercial: 1,
        identificacion: 1,
      }).lean();
      if (cli) {
        referidorEmpresaNombre =
          cli.razonSocial?.trim() ||
          cli.nombreComercial?.trim() ||
          cli.nombres?.trim() ||
          cli.identificacion ||
          null;
      }
    }
    res.json({
      ...a,
      empresaNombre,
      gestorNombre,
      referidorEmpresaNombre,
      manejoGestorEmpresa: a.manejoGestorEmpresa === true,
    });
  } catch (e) {
    next(e);
  }
};

/** Comprobantes / facturas recientes (alertas globales en cabecera). */
exports.comprobantesRecientes = async (req, res, next) => {
  try {
    let desde = null;
    if (req.query.desde) {
      const d = new Date(String(req.query.desde));
      if (!Number.isNaN(d.getTime())) desde = d;
    }
    const rows = await listarComprobantesRecientes(desde);
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

/** Alumnos con recordatorio de cobro programado para hoy (cajero). */
exports.alertasPagoHoy = async (req, res, next) => {
  try {
    const rows = await listarAlertasPagoHoy(new Date());
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

/** Comprobantes y factura emitidos hoy (alarmas en ficha y lista). */
exports.indicadoresHoy = async (req, res, next) => {
  try {
    const a = await buscarAlumnoPorIdParam(req.params.id);
    if (!a) return res.status(404).json({ message: 'Alumno no encontrado' });
    await assertAlumnoAccesibleGestor(req, a);
    if (a.numDoc == null) {
      return res.json({
        comprobanteIngresoHoy: null,
        comprobanteEgresoHoy: null,
        facturaHoy: null,
      });
    }
    const map = await movimientosHoyPorAlumnos([a.numDoc]);
    const mov = map.get(claveNumDocIndicador(a.numDoc)) || {
      ingreso: null,
      egreso: null,
      factura: null,
    };
    res.json({
      comprobanteIngresoHoy: mov.ingreso,
      comprobanteEgresoHoy: mov.egreso,
      facturaHoy: mov.factura,
    });
  } catch (e) {
    next(e);
  }
};

exports.documentosRequeridos = async (req, res, next) => {
  try {
    const a = await buscarAlumnoPorIdParam(req.params.id);
    if (!a) return res.status(404).json({ message: 'Alumno no encontrado' });
    await assertAlumnoAccesibleGestor(req, a);
    res.json(await calcularDocumentosRequeridos(a));
  } catch (e) {
    next(e);
  }
};

exports.validarDocumentos = async (req, res, next) => {
  try {
    const a = await buscarAlumnoPorIdParam(req.params.id);
    if (!a) return res.status(404).json({ message: 'Alumno no encontrado' });
    await assertAlumnoAccesibleGestor(req, a);
    const idPrograma = req.query.idPrograma;
    if (idPrograma) {
      const val = await validarDocumentosParaPrograma(a, idPrograma);
      if (val.error) return res.status(404).json({ message: val.error });
      return res.json(val);
    }
    res.json(await validarDocumentosPendientesAlumno(a));
  } catch (e) {
    next(e);
  }
};

exports.subirDocumento = async (req, res, next) => {
  try {
    const idDoc = String(req.params.idDoc || '').trim();
    const file = req.file;
    if (!idDoc) return res.status(400).json({ message: 'Tipo de documento inválido' });
    if (!file?.filename) {
      return res.status(400).json({ message: 'Envíe el archivo en el campo "archivo"' });
    }

    const config = await obtenerConfigRequisitosDocumentos();
    const meta = config.tiposDocumento.find((t) => t.id === idDoc && t.activo !== false);
    if (!meta) return res.status(400).json({ message: 'Tipo de documento no configurado' });

    const prev = await buscarAlumnoPorIdParam(req.params.id);
    if (!prev) return res.status(404).json({ message: 'Alumno no encontrado' });
    await assertAlumnoAccesibleGestor(req, prev);

    const url = upload.publicUrl('alumnos', file.filename);
    const dto = {
      ...patchDocsAlumno(prev, idDoc, url, config),
      fechaMod: new Date(),
      userChangeRecord: req.user?.username || req.user?.sub || 'sistema',
    };

    const requeridos = await calcularDocumentosRequeridos(prev);
    const permitido = requeridos.documentos.some((d) => d.id === idDoc);
    if (!permitido) {
      return res.status(400).json({
        message: 'Este documento no es requerido según las matrículas del alumno',
      });
    }

    const a = await DatosAlumno.findByIdAndUpdate(prev._id, dto, { new: true }).lean();
    const resumen = await calcularDocumentosRequeridos(a);
    res.json({ alumno: a, ...resumen });
  } catch (e) {
    next(e);
  }
};

exports.porDocumento = async (req, res, next) => {
  try {
    const numDoc = numDocFromParams(req.params.numDoc);
    if (numDoc == null) return res.status(400).json({ message: 'numDoc inválido' });
    await assertAlumnoPorNumDocGestor(req, numDoc);
    const a = await buscarAlumnoPorIdParam(String(numDoc));
    if (!a) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json(a);
  } catch (e) {
    next(e);
  }
};

exports.verificarDocumento = async (req, res, next) => {
  try {
    const numDoc = numDocFromParams(req.params.numDoc);
    const excludeId = req.query.excludeId;
    if (numDoc == null) return res.status(400).json({ message: 'numDoc requerido o inválido' });
    const a = await alumnoConMismoNumDoc(numDoc, excludeId || null);
    if (!a) return res.json({ existe: false });
    res.json({
      existe: true,
      _id: a._id,
      numDoc: a.numDoc,
      nombreCompleto: nombreCompleto(a).nombreCompleto,
      nombres: nombreCompleto(a).nombres,
      apellidos: nombreCompleto(a).apellidos,
    });
  } catch (e) {
    next(e);
  }
};

const { validarGestorEmpresaAlumno } = require('../services/gestorEmpresaMatricula');
const { aplicarReferidorGestorUsuario } = require('../services/gestorUsuarioReferidor');

const CAMPOS_ALUMNO = [
  'tipoAlumno', 'tipoDoc', 'numDoc', 'expedida', 'apellido1', 'apellido2', 'nombre1', 'nombre2',
  'fechaNac', 'observaciones', 'genero', 'identidadGenero', 'orientacionSexual', 'tipoSangre', 'jornada', 'estadoCivil', 'estrato',
  'regimenSalud', 'nivelFormacion', 'ocupacion', 'actorVial', 'discapacidad', 'munOrigen', 'codMunicipio',
  'codDepartamento', 'nombreDepartamento', 'nombreMunicipio',
  'correo', 'direccion', 'celular', 'multiCulturalidad', 'urlFoto', 'urlCedula', 'urlLicencia',
  'duracionSesionPracticaCea', 'empresaId', 'alertaPago', 'alertaPagoFrecuencia',
  'manejoGestorEmpresa', 'tipoReferidorComercial', 'gestorId', 'gestorNombre',
  'referidorEmpresaId', 'referidorEmpresaNombre',
  /* Origen en jornada Cap. (≠ canal inscripción SISTEMA|WEB en `origen`) */
  'origenJornadaCap', 'tipoInstitucionEducativa', 'perfilInstitucionEducativa',
  'colegioCodigo', 'colegioNombre', 'gradoColegio', 'semestreInstitucion',
  'titulacionCodigo', 'areaImparteColegio',
  'programaInstitucion', 'estamentoId', 'estamentoNombre',
  'cargoEstamento', 'dependenciaEstamento',
];

function nombreMayusculas(v) {
  return String(v || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function coleccionAlumnos() {
  return mongoose.connection.collection('datosAlumnos');
}

/** Acepta _id Mongo o numDoc en la URL (ej. /alumnos/1007122432). */
async function buscarAlumnoPorIdParam(idParam) {
  const raw = String(idParam || '').trim();
  if (!raw) return null;

  if (mongoose.isValidObjectId(raw)) {
    const porId = await DatosAlumno.findById(raw).lean();
    if (porId) return porId;
  }

  const numDoc = parseNumDoc(raw);
  if (numDoc == null) return null;
  const filter = numDocQueryNativo(numDoc);
  if (!filter) return null;
  return coleccionAlumnos().findOne(filter);
}

function filtroNumDocExcluyendo(numDoc, excludeId) {
  const q = numDocQueryNativo(numDoc);
  if (!q) return null;
  if (!excludeId) return q;
  const id =
    excludeId instanceof mongoose.Types.ObjectId
      ? excludeId
      : mongoose.Types.ObjectId.isValid(String(excludeId))
        ? new mongoose.Types.ObjectId(String(excludeId))
        : excludeId;
  return { $and: [q, { _id: { $ne: id } }] };
}

/** Búsqueda en colección nativa: Mongoose no encuentra numDoc guardado como string. */
async function alumnoConMismoNumDoc(numDoc, excludeId = null) {
  const filter = filtroNumDocExcluyendo(numDoc, excludeId);
  if (!filter) return null;
  return coleccionAlumnos().findOne(filter);
}

function respuestaDuplicado(res, existe) {
  return res.status(409).json({
    message: 'Ya existe un alumno con ese número de documento',
    existingId: existe._id,
    numDoc: existe.numDoc,
    ...nombreCompleto(existe),
  });
}

function pickAlumno(body) {
  const dto = {};
  for (const k of CAMPOS_ALUMNO) {
    if (body[k] !== undefined && body[k] !== '') dto[k] = body[k];
  }
  // Segundo nombre/apellido opcionales: hay que poder dejarlos vacíos (no se rellena con punto).
  if (body.nombre2 !== undefined) {
    dto.nombre2 = String(body.nombre2 || '').trim();
  }
  if (body.apellido2 !== undefined) {
    dto.apellido2 = String(body.apellido2 || '').trim();
  }
  for (const k of ['apellido1', 'apellido2', 'nombre1', 'nombre2']) {
    if (dto[k]) dto[k] = nombreMayusculas(dto[k]);
  }
  for (const k of [
    'colegioNombre',
    'programaInstitucion',
    'estamentoNombre',
    'cargoEstamento',
    'dependenciaEstamento',
  ]) {
    if (dto[k]) dto[k] = nombreMayusculas(dto[k]);
  }
  const { aplicarOrigenJornadaCapEnDto } = require('../services/origenJornadaCapAlumno');
  aplicarOrigenJornadaCapEnDto(dto, body);

  // codMunicipio debe coincidir con munOrigen (código divipola)
  if (dto.munOrigen) dto.codMunicipio = String(dto.munOrigen).trim();
  else if (dto.codMunicipio) dto.munOrigen = String(dto.codMunicipio).trim();
  if (dto.codDepartamento != null) {
    dto.codDepartamento = String(dto.codDepartamento || '')
      .replace(/\D/g, '')
      .padStart(2, '0');
    if (dto.codDepartamento === '00') delete dto.codDepartamento;
  }
  if (dto.numDoc != null && dto.numDoc !== '') {
    const nd = parseNumDoc(dto.numDoc);
    if (nd != null) dto.numDoc = nd;
  }
  if (body.tipoAlumno !== undefined || dto.tipoAlumno !== undefined) {
    dto.tipoAlumno = normalizarTipoAlumno(dto.tipoAlumno);
  }
  if (body.alertaPagoFrecuencia) dto.alertaPagoFrecuencia = body.alertaPagoFrecuencia;
  if (body.alertaPago) dto.alertaPago = body.alertaPago;
  if (body.manejoGestorEmpresa !== undefined) {
    dto.manejoGestorEmpresa = body.manejoGestorEmpresa === true || body.manejoGestorEmpresa === 'true';
  }
  if (dto.fechaNac) dto.fechaNac = new Date(dto.fechaNac);

  normalizarAlertaPagoEnDto(dto);
  return dto;
}

function exigirFechaNacimiento(raw) {
  if (raw == null || raw === '') {
    return { error: 'La fecha de nacimiento es obligatoria' };
  }
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime()) || calcularEdad(d) == null) {
    return { error: 'La fecha de nacimiento no es válida' };
  }
  return { value: d };
}

/** Completa cod/nombre de departamento y municipio desde DIVIPOLA. */
async function completarGeoOrigenAlumno(dto) {
  if (!dto || typeof dto !== 'object') return dto;
  const codMun = String(dto.codMunicipio || dto.munOrigen || '').trim();
  if (!codMun) return dto;
  const { models: cat } = require('../models/catalogos');
  const pad = String(codMun).replace(/\D/g, '').padStart(5, '0');
  const geo = await cat.divipola
    .findOne({
      $or: [{ codMunicipio: codMun }, { codMunicipio: pad }, { codMunicipio: Number(pad) }],
    })
    .lean();
  if (!geo) return dto;
  dto.codMunicipio = String(geo.codMunicipio);
  dto.munOrigen = String(geo.codMunicipio);
  dto.nombreMunicipio = geo.nombreMunicipio;
  dto.codDepartamento = String(geo.codDepto || '').padStart(2, '0');
  dto.nombreDepartamento = geo.nombreDepto;
  return dto;
}

exports.crear = async (req, res, next) => {
  try {
    const body = req.body;
    const dto = pickAlumno(body);
    if (dto.numDoc == null || !dto.nombre1 || !dto.apellido1) {
      return res.status(400).json({ message: 'Documento, primer nombre y primer apellido son obligatorios' });
    }
    dto.numDoc = parseNumDoc(dto.numDoc);
    if (dto.numDoc == null) {
      return res.status(400).json({ message: numDocInvalidMessage() });
    }
    const fechaNac = exigirFechaNacimiento(dto.fechaNac);
    if (fechaNac.error) return res.status(400).json({ message: fechaNac.error });
    dto.fechaNac = fechaNac.value;
    const existe = await alumnoConMismoNumDoc(dto.numDoc);
    if (existe) return respuestaDuplicado(res, existe);

    await aplicarArchivos(dto, req.files);
    const now = new Date();
    dto.fechaReg = dto.fechaReg ? new Date(dto.fechaReg) : now;
    dto.fechaAudi = now;
    dto.fechaMod = now;
    dto.userAddReg = dto.userAddReg || req.user?.username || req.user?.sub || 'sistema';
    const esJornadaCap =
      body.esJornadaCap === true ||
      body.esJornadaCap === 'true' ||
      body.esJornadaCap === '1' ||
      body.esJornadaCap === 1;
    dto.tipoAlumno =
      body.tipoAlumno !== undefined && body.tipoAlumno !== ''
        ? normalizarTipoAlumno(body.tipoAlumno)
        : esJornadaCap
          ? TIPO_JORNADAS_CAPACITACION
          : TIPO_ALUMNO_DEFAULT;
    // Canal de inscripción: altas ERP/cajero/recepción = SISTEMA (no spoofear WEB desde el cliente).
    dto.origen = ORIGEN_SISTEMA;
    await completarGeoOrigenAlumno(dto);
    await aplicarReferidorGestorUsuario(dto, req.user, {
      forzarPropioGestor: true,
      exigirVinculo: true,
    });
    await validarGestorEmpresaAlumno(dto);

    let a;
    try {
      a = await DatosAlumno.create(dto);
    } catch (err) {
      if (err?.code === 11000) {
        const dup = await alumnoConMismoNumDoc(dto.numDoc);
        if (dup) return respuestaDuplicado(res, dup);
      }
      throw err;
    }
    const lean = a.toObject ? a.toObject() : a;
    const portalAcceso = await provisionarAccesoPortalSiVirtual(lean, {
      portalBaseUrl: resolverBasePortal({
        portalBaseUrl: body.portalBaseUrl,
        origin: req.get('origin') || publicOriginFromReq(req),
      }),
      origin: req.get('origin') || publicOriginFromReq(req),
    });
    res.status(201).json(portalAcceso ? { ...lean, portalAcceso } : lean);
  } catch (e) {
    next(e);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const prev = await buscarAlumnoPorIdParam(req.params.id);
    if (!prev) return res.status(404).json({ message: 'Alumno no encontrado' });
    await assertAlumnoAccesibleGestor(req, prev);
    const body = req.body;
    const dto = pickAlumno(body);
    if (dto.manejoGestorEmpresa === undefined) {
      dto.manejoGestorEmpresa = prev.manejoGestorEmpresa === true;
      if (dto.tipoReferidorComercial === undefined) dto.tipoReferidorComercial = prev.tipoReferidorComercial;
      if (dto.gestorId === undefined) dto.gestorId = prev.gestorId;
      if (dto.gestorNombre === undefined) dto.gestorNombre = prev.gestorNombre;
      if (dto.referidorEmpresaId === undefined) dto.referidorEmpresaId = prev.referidorEmpresaId;
      if (dto.referidorEmpresaNombre === undefined) dto.referidorEmpresaNombre = prev.referidorEmpresaNombre;
    }
    if (dto.numDoc != null) {
      dto.numDoc = parseNumDoc(dto.numDoc);
      if (dto.numDoc == null) {
        return res.status(400).json({ message: numDocInvalidMessage() });
      }
      const dup = await alumnoConMismoNumDoc(dto.numDoc, prev._id);
      if (dup) return respuestaDuplicado(res, dup);
    }
    await aplicarArchivos(dto, req.files, prev);
    dto.fechaMod = new Date();
    dto.userChangeRecord = dto.userChangeRecord || req.user?.username || req.user?.sub || 'sistema';
    const fechaNac = exigirFechaNacimiento(
      dto.fechaNac !== undefined ? dto.fechaNac : prev.fechaNac,
    );
    if (fechaNac.error) return res.status(400).json({ message: fechaNac.error });
    dto.fechaNac = fechaNac.value;
    await completarGeoOrigenAlumno(dto);
    await aplicarReferidorGestorUsuario(dto, req.user, {
      forzarPropioGestor: esPerfilGestor(req.user?.rol),
      exigirVinculo: false,
    });
    await validarGestorEmpresaAlumno(dto);

    const unset = {};
    if (
      body.alertaPagoFrecuencia === ''
      || body.alertaPago === ''
      || (body.alertaPagoFrecuencia == null && body.alertaPago == null
        && ('alertaPagoFrecuencia' in body || 'alertaPago' in body))
    ) {
      unset.alertaPagoFrecuencia = '';
      unset.alertaPago = '';
      delete dto.alertaPagoFrecuencia;
      delete dto.alertaPago;
    }

    const op = { $set: dto };
    if (Object.keys(unset).length) op.$unset = unset;

    const a = await DatosAlumno.findByIdAndUpdate(prev._id, op, { new: true }).lean();
    const portalAcceso = await provisionarAccesoPortalSiVirtual(a, {
      portalBaseUrl: resolverBasePortal({
        portalBaseUrl: body.portalBaseUrl,
        origin: req.get('origin') || publicOriginFromReq(req),
      }),
      origin: req.get('origin') || publicOriginFromReq(req),
    });
    res.json(portalAcceso ? { ...a, portalAcceso } : a);
  } catch (e) {
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const prev = await buscarAlumnoPorIdParam(req.params.id);
    if (!prev) return res.status(404).json({ message: 'Alumno no encontrado' });
    await assertAlumnoAccesibleGestor(req, prev);
    const { eliminarAlumno } = require('../services/eliminacionEntidades');
    const resultado = await eliminarAlumno(req.params.id);
    if (!resultado.ok) {
      return res.status(resultado.status || 400).json({ message: resultado.message, code: resultado.code });
    }
    res.json(resultado);
  } catch (e) {
    next(e);
  }
};

/** Crea/actualiza acceso portal y envía correo con usuario y contraseña. */
exports.enviarAccesoPortal = async (req, res, next) => {
  try {
    const alumno = await buscarAlumnoPorIdParam(req.params.id);
    if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });
    await assertAlumnoAccesibleGestor(req, alumno);
    const body = req.body || {};
    const out = await enviarAccesoPortalAlumno(alumno, {
      email: body.email,
      password: body.password,
      portalBaseUrl: resolverBasePortal({
        portalBaseUrl: body.portalBaseUrl,
        origin: req.get('origin') || publicOriginFromReq(req),
      }),
      origin: req.get('origin') || publicOriginFromReq(req),
    });
    res.json(out);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

/** Estado de acceso al aula virtual (UsuarioPortal) del alumno. */
exports.estadoPortal = async (req, res, next) => {
  try {
    const alumno = await buscarAlumnoPorIdParam(req.params.id);
    if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });
    await assertAlumnoAccesibleGestor(req, alumno);
    const out = await estadoAccesoPortalPorNumDoc(alumno.numDoc);
    res.json(out);
  } catch (e) {
    next(e);
  }
};

/** Restablece contraseña del portal (no modifica el correo). */
exports.resetearPasswordPortal = async (req, res, next) => {
  try {
    const alumno = await buscarAlumnoPorIdParam(req.params.id);
    if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });
    await assertAlumnoAccesibleGestor(req, alumno);
    const body = req.body || {};
    const out = await resetearPasswordPortalAlumno(alumno, {
      password: body.password,
      generarPassword: body.generarPassword,
      enviarCorreo: body.enviarCorreo,
      portalBaseUrl: resolverBasePortal({
        portalBaseUrl: body.portalBaseUrl,
        origin: req.get('origin') || publicOriginFromReq(req),
      }),
      origin: req.get('origin') || publicOriginFromReq(req),
    });
    res.json(out);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};
