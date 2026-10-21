const PesvConfig = require('../../models/PesvConfig');
const PesvAutodiagnostico = require('../../models/PesvAutodiagnostico');
const PesvFase1Registro = require('../../models/PesvFase1Registro');
const PesvFase2Registro = require('../../models/PesvFase2Registro');
const Vehiculo = require('../../models/Vehiculo');
const InspeccionVehiculo = require('../../models/InspeccionVehiculo');
const {
  CATALOGO_FASE1,
  MOTIVOS_FASE1,
  itemAplicaAlNivel,
  sugerenciaRespuestaItem,
} = require('../../constants/pesv/catalogoFase1');
const catalogoFase2 = require('../../constants/pesv/catalogoFase2');
const { calcularNivelPesv, etiquetaNivel } = require('../../constants/pesv/nivelPesv');
const { metaDocumentoItem, MODO_DOCUMENTO } = require('../../constants/pesv/catalogoDocumentos');
const upload = require('../../middleware/upload');

const CONFIG_KEY = 'default';

async function obtenerConfig() {
  let doc = await PesvConfig.findOne({ singletonKey: CONFIG_KEY }).lean();
  if (!doc) {
    doc = (
      await PesvConfig.create({
        singletonKey: CONFIG_KEY,
        vigenciaActiva: new Date().getFullYear(),
      })
    ).toObject();
  }
  return doc;
}

async function guardarConfig(body, user) {
  const update = {
    vigenciaActiva: Number(body.vigenciaActiva) || new Date().getFullYear(),
    tipoOrganizacion: body.tipoOrganizacion === 'empresa' ? 'empresa' : 'cea',
    razonSocial: String(body.razonSocial || '').trim(),
    nit: String(body.nit || '').trim(),
    userChangeRecord: user?.usuario || user?.email || '',
  };
  const doc = await PesvConfig.findOneAndUpdate(
    { singletonKey: CONFIG_KEY },
    { $set: update, $setOnInsert: { singletonKey: CONFIG_KEY } },
    { upsert: true, new: true, lean: true },
  );
  return doc;
}

async function obtenerAutodiagnostico(vigencia) {
  const v = Number(vigencia) || (await obtenerConfig()).vigenciaActiva;
  const doc = await PesvAutodiagnostico.findOne({ vigencia: v, vigente: true }).lean();
  return { vigencia: v, registro: doc };
}

async function guardarAutodiagnostico(body, user) {
  const vigencia = Number(body.vigencia) || new Date().getFullYear();
  const misionalidad = Number(body.misionalidad) === 1 ? 1 : 2;
  const totalVehiculos = Math.max(0, Number(body.totalVehiculos) || 0);
  const totalConductores = Math.max(0, Number(body.totalConductores) || 0);
  const nivelCalculado = calcularNivelPesv({ misionalidad, totalVehiculos, totalConductores });
  const userChangeRecord = user?.usuario || user?.email || '';

  await PesvAutodiagnostico.updateMany({ vigencia, vigente: true }, { $set: { vigente: false } });
  const doc = await PesvAutodiagnostico.create({
    vigencia,
    misionalidad,
    totalVehiculos,
    totalConductores,
    nivelCalculado,
    observaciones: String(body.observaciones || '').trim(),
    vigente: true,
    userChangeRecord,
  });
  return doc.toObject();
}

function nivelVigenteDesdeAuto(auto) {
  return auto?.registro?.nivelCalculado || 'basico';
}

function mergeItemsFase1(registro, nivelOrg) {
  const map = new Map((registro?.items || []).map((i) => [i.itemNo, i]));
  return CATALOGO_FASE1.map((cat) => {
    const saved = map.get(cat.itemNo);
    const aplica = itemAplicaAlNivel(cat, nivelOrg);
    const sugerencia = sugerenciaRespuestaItem(cat, nivelOrg);
    let item = saved ? { ...saved } : { itemNo: cat.itemNo };
    if (!aplica && !saved?.existe && sugerencia) {
      item = { ...item, ...sugerencia };
    }
    const documento = metaDocumentoItem(cat.itemNo);
    return {
      ...cat,
      aplica,
      documento,
      respuesta: item,
    };
  });
}

async function obtenerFase1(vigencia) {
  const v = Number(vigencia) || (await obtenerConfig()).vigenciaActiva;
  const auto = await obtenerAutodiagnostico(v);
  const nivel = nivelVigenteDesdeAuto(auto);
  let reg = await PesvFase1Registro.findOne({ vigencia: v }).lean();
  if (!reg) {
    reg = { vigencia: v, items: [], enviadoSt: false };
  }
  return {
    vigencia: v,
    nivel,
    nivelLabel: etiquetaNivel(nivel),
    motivos: MOTIVOS_FASE1,
    enviadoSt: !!reg.enviadoSt,
    items: mergeItemsFase1(reg, nivel),
  };
}

async function guardarFase1(body, user) {
  const vigencia = Number(body.vigencia) || new Date().getFullYear();
  const itemsIn = Array.isArray(body.items) ? body.items : [];
  const items = itemsIn
    .map((i) => ({
      itemNo: Number(i.itemNo),
      existe: i.existe === 'si' || i.existe === 'no' ? i.existe : null,
      motivoCodigo: String(i.motivoCodigo || '').trim(),
      observacion: String(i.observacion || '').trim(),
      datosCapturados: i.datosCapturados ?? null,
      documentoGeneradoRuta: i.documentoGeneradoRuta || null,
      documentoGeneradoEn: i.documentoGeneradoEn || null,
      adjuntoRuta: i.adjuntoRuta || null,
      adjuntoNombre: i.adjuntoNombre || null,
    }))
    .filter((i) => i.itemNo > 0);

  const doc = await PesvFase1Registro.findOneAndUpdate(
    { vigencia },
    {
      $set: {
        items,
        enviadoSt: !!body.enviadoSt,
        userChangeRecord: user?.usuario || user?.email || '',
      },
    },
    { upsert: true, new: true, lean: true },
  );
  return doc;
}

async function adjuntarFase1Item(vigencia, itemNo, file, user) {
  const v = Number(vigencia);
  const no = Number(itemNo);
  const cat = CATALOGO_FASE1.find((c) => c.itemNo === no);
  if (!cat) {
    const err = new Error('Ítem no válido');
    err.status = 400;
    throw err;
  }
  const meta = metaDocumentoItem(no);
  if (meta.modo !== MODO_DOCUMENTO.CERT_REPRESENTANTE_LEGAL) {
    const err = new Error(
      'Este ítem se resuelve generando el documento en ARGO desde datos capturados, no subiendo PDF manual.',
    );
    err.status = 400;
    err.code = 'PESV_NO_ADJUNTO_MANUAL';
    throw err;
  }
  const rel = upload.publicUrl('pesv-evidencias', file.filename);
  const reg = await PesvFase1Registro.findOne({ vigencia: v }).lean();
  const items = [...(reg?.items || [])];
  const idx = items.findIndex((i) => i.itemNo === no);
  const row = idx >= 0 ? { ...items[idx] } : { itemNo: no };
  row.adjuntoRuta = rel;
  row.adjuntoNombre = file.originalname;
  if (idx >= 0) items[idx] = row;
  else items.push(row);

  await PesvFase1Registro.findOneAndUpdate(
    { vigencia: v },
    {
      $set: {
        items,
        userChangeRecord: user?.usuario || user?.email || '',
      },
    },
    { upsert: true },
  );
  return { itemNo: no, adjuntoRuta: rel, adjuntoNombre: file.originalname };
}

async function generarDocumentoFase1(vigencia, itemNo, user) {
  const no = Number(itemNo);
  const cat = CATALOGO_FASE1.find((c) => c.itemNo === no);
  if (!cat) {
    const err = new Error('Ítem no válido');
    err.status = 400;
    throw err;
  }
  const meta = metaDocumentoItem(no);
  if (meta.modo === MODO_DOCUMENTO.CERT_REPRESENTANTE_LEGAL) {
    const err = new Error(
      'Use el formulario de certificación del representante legal y adjunte el PDF firmado; la generación automática de esta plantilla se habilitará pronto.',
    );
    err.status = 400;
    throw err;
  }
  if (meta.modo === MODO_DOCUMENTO.NA) {
    const err = new Error('Ítem sin documento asociado.');
    err.status = 400;
    throw err;
  }
  const v = Number(vigencia);
  const reg = await PesvFase1Registro.findOne({ vigencia: v }).lean();
  const row = (reg?.items || []).find((i) => i.itemNo === no);
  if (!row?.datosCapturados && meta.modo !== MODO_DOCUMENTO.DERIVADO_FLOTA) {
    const err = new Error('Capture primero los datos del documento antes de generar.');
    err.status = 400;
    err.code = 'PESV_SIN_DATOS';
    throw err;
  }
  const err = new Error(
    'Motor de generación PDF/Excel en implementación (plantillas del pack PESV). Los datos ya quedaron guardados.',
  );
  err.status = 501;
  err.code = 'PESV_GENERACION_PENDIENTE';
  err.meta = { itemNo: no, tituloDocumento: meta.tituloDocumento, salida: meta.salida };
  throw err;
}

function mapToObj(m) {
  if (!m) return {};
  if (m instanceof Map) return Object.fromEntries(m.entries());
  return { ...m };
}

function defaultFase2(vigencia, mes) {
  return {
    vigencia,
    mes,
    obligado: true,
    siniestros: {},
    administrativo: { variables: [] },
    funcionamiento: { variables: {}, evidencias: [] },
    vehiculos: { variables: {}, evidencias: [] },
    estado: 'borrador',
  };
}

async function obtenerFase2(vigencia, mes) {
  const v = Number(vigencia) || (await obtenerConfig()).vigenciaActiva;
  const m = Number(mes) || new Date().getMonth() + 1;
  let doc = await PesvFase2Registro.findOne({ vigencia: v, mes: m }).lean();
  if (!doc) doc = defaultFase2(v, m);
  else {
    doc.funcionamiento = doc.funcionamiento || { variables: {}, evidencias: [] };
    doc.vehiculos = doc.vehiculos || { variables: {}, evidencias: [] };
    doc.funcionamiento.variables = mapToObj(doc.funcionamiento.variables);
    doc.vehiculos.variables = mapToObj(doc.vehiculos.variables);
  }
  return {
    vigencia: v,
    mes: m,
    catalogo: catalogoFase2,
    registro: doc,
    mesesCarga: {
      siniestros: catalogoFase2.mesPermiteCarga('siniestros', m),
      administrativo: catalogoFase2.mesPermiteCarga('administrativo', m),
      funcionamiento: catalogoFase2.mesPermiteCarga('funcionamiento', m),
      vehiculos: catalogoFase2.mesPermiteCarga('vehiculos', m),
    },
    sugerenciasFlota: await sugerenciasFlota(v, m),
  };
}

async function guardarFase2(body, user) {
  const vigencia = Number(body.vigencia) || new Date().getFullYear();
  const mes = Number(body.mes);
  if (!mes || mes < 1 || mes > 12) {
    const err = new Error('Mes inválido');
    err.status = 400;
    throw err;
  }
  const payload = {
    obligado: body.obligado !== false,
    siniestros: body.siniestros || {},
    administrativo: body.administrativo || { variables: [] },
    funcionamiento: body.funcionamiento || { variables: {}, evidencias: [] },
    vehiculos: body.vehiculos || { variables: {}, evidencias: [] },
    estado: body.estado === 'enviado_st' ? 'enviado_st' : 'borrador',
    userChangeRecord: user?.usuario || user?.email || '',
  };

  const doc = await PesvFase2Registro.findOneAndUpdate(
    { vigencia, mes },
    { $set: payload },
    { upsert: true, new: true, lean: true },
  );
  if (doc.funcionamiento) doc.funcionamiento.variables = mapToObj(doc.funcionamiento.variables);
  if (doc.vehiculos) doc.vehiculos.variables = mapToObj(doc.vehiculos.variables);
  return doc;
}

async function sugerenciasFlota(vigencia, mes) {
  const y = Number(vigencia) || new Date().getFullYear();
  const m = Number(mes) || new Date().getMonth() + 1;
  const pref = `${y}-${String(m).padStart(2, '0')}`;
  const docs = await InspeccionVehiculo.find({ fecha: new RegExp(`^${escRegex(pref)}`) })
    .select('placa fecha')
    .lean()
    .catch(() => []);
  const paresPlacaFecha = new Set(docs.map((d) => `${String(d.placa || '').trim()}|${d.fecha}`));
  const placas = new Set(docs.map((d) => String(d.placa || '').trim()).filter(Boolean));
  const vehiculosEnFlota = await Vehiculo.countDocuments({}).catch(() => 0);

  return {
    vigencia: y,
    mes: m,
    inspeccionesRegistradas: docs.length,
    registrosPlacaDia: paresPlacaFecha.size,
    placasConInspeccionEnMes: placas.size,
    vehiculosEnFlota,
    sugerido: {
      '9.1': paresPlacaFecha.size,
      '9.2': placas.size,
      '7.1': vehiculosEnFlota,
      '7.2': vehiculosEnFlota,
    },
    nota: 'Valores sugeridos desde inspecciones ARGO; valídelos contra la definición SISI antes de enviar a ST.',
  };
}

function escRegex(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TABLERO_VARS = {
  funcionamiento: ['6.1', '6.2', '8.1', '8.2'],
  vehiculos: ['9.1', '9.2'],
};

async function obtenerTablero(vigencia) {
  const v = Number(vigencia) || (await obtenerConfig()).vigenciaActiva;
  const registros = await PesvFase2Registro.find({ vigencia: v }).sort({ mes: 1 }).lean();
  const byMes = new Map(registros.map((r) => [r.mes, r]));

  const meses = [];
  for (let mes = 1; mes <= 12; mes += 1) {
    const r = byMes.get(mes);
    const funcVars = mapToObj(r?.funcionamiento?.variables);
    const vehVars = mapToObj(r?.vehiculos?.variables);
    const row = {
      mes,
      estado: r?.estado || null,
      obligado: r?.obligado !== false,
    };
    for (const id of TABLERO_VARS.funcionamiento) row[id] = funcVars[id] ?? null;
    for (const id of TABLERO_VARS.vehiculos) row[id] = vehVars[id] ?? null;
    meses.push(row);
  }

  return {
    vigencia: v,
    variables: TABLERO_VARS,
    meses,
  };
}

async function adjuntarFase2Evidencia(vigencia, mes, tab, evidenciaId, file, user) {
  const v = Number(vigencia);
  const m = Number(mes);
  const rel = upload.publicUrl('pesv-evidencias', file.filename);
  const ext = String(file.originalname || '').toLowerCase();
  const tipo = ext.endsWith('.xlsx') ? 'xlsx' : 'pdf';

  const data = await obtenerFase2(v, m);
  const reg = { ...data.registro, vigencia: v, mes: m };

  if (tab === 'siniestros' && evidenciaId === 'a1') {
    reg.siniestros = { adjuntoRuta: rel, adjuntoNombre: file.originalname };
  } else if (tab === 'funcionamiento' || tab === 'vehiculos') {
    const block = reg[tab] || { variables: {}, evidencias: [] };
    const evs = [...(block.evidencias || [])];
    const idx = evs.findIndex((e) => e.id === evidenciaId);
    const row = {
      id: evidenciaId,
      tipo,
      valorEntero: null,
      adjuntoRuta: rel,
      adjuntoNombre: file.originalname,
    };
    if (idx >= 0) evs[idx] = { ...evs[idx], ...row };
    else evs.push(row);
    block.evidencias = evs;
    reg[tab] = block;
  } else {
    const err = new Error('Tab o evidencia no válida');
    err.status = 400;
    throw err;
  }

  await guardarFase2(reg, user);
  return { adjuntoRuta: rel, adjuntoNombre: file.originalname, tipo };
}

async function resumen(vigencia) {
  const v = Number(vigencia) || (await obtenerConfig()).vigenciaActiva;
  const config = await obtenerConfig();
  const auto = await obtenerAutodiagnostico(v);
  const fase1 = await obtenerFase1(v);
  const nivel = fase1.nivel;

  const aplicables = fase1.items.filter((i) => i.aplica);
  const conRespuesta = aplicables.filter((i) => i.respuesta?.existe);
  const conCaptura = aplicables.filter((i) => i.respuesta?.datosCapturados);

  const totalVehiculosFlota = await Vehiculo.countDocuments({}).catch(() => 0);

  const y = v;
  const mesActual = new Date().getMonth() + 1;
  const prefMes = `${y}-${String(mesActual).padStart(2, '0')}`;
  const inspeccionesMes = await InspeccionVehiculo.countDocuments({
    fecha: new RegExp(`^${prefMes}`),
  }).catch(() => 0);

  const fase2Mes = await PesvFase2Registro.findOne({ vigencia: v, mes: mesActual }).lean();

  return {
    config,
    autodiagnostico: auto.registro,
    nivel,
    nivelLabel: etiquetaNivel(nivel),
    fase1: {
      totalItems: CATALOGO_FASE1.length,
      aplicables: aplicables.length,
      conRespuesta: conRespuesta.length,
      conCaptura: conCaptura.length,
      enviadoSt: fase1.enviadoSt,
    },
    flota: {
      vehiculosActivos: totalVehiculosFlota,
      inspeccionesMesActual: inspeccionesMes,
    },
    fase2MesActual: fase2Mes
      ? { mes: mesActual, estado: fase2Mes.estado }
      : { mes: mesActual, estado: null },
  };
}

module.exports = {
  obtenerConfig,
  guardarConfig,
  obtenerAutodiagnostico,
  guardarAutodiagnostico,
  obtenerFase1,
  guardarFase1,
  adjuntarFase1Item,
  generarDocumentoFase1,
  obtenerFase2,
  guardarFase2,
  adjuntarFase2Evidencia,
  sugerenciasFlota,
  obtenerTablero,
  resumen,
  catalogoFase1: () => ({ items: CATALOGO_FASE1, motivos: MOTIVOS_FASE1 }),
  catalogoFase2: () => catalogoFase2,
};
