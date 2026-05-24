const Certificado = require('../models/Certificado');
const PlantillaCertificado = require('../models/PlantillaCertificado');
const Liquidacion = require('../models/Liquidacion');
const { models: cat } = require('../models/catalogos');
const { obtenerConfigCertificado, siguienteCodigoCertificado } = require('../services/configCertificado');
const { buscarPrograma } = require('../services/programaServicio');
const { parseNumDoc, numDocFromParams, numDocEquals, numDocQuery } = require('../utils/numDoc');
const {
  clasificarProgramaAsync,
  TIPOS,
  TIPOS_LABEL,
  idPlantillaPorTipo,
  orientacionPorTipo,
} = require('../services/clasificacionCertificado');
function num(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
  return Number(v) || 0;
}

async function resolverPlantilla(prog, config, idPlantillaManual) {
  if (idPlantillaManual) {
    const p = await PlantillaCertificado.findById(idPlantillaManual).lean();
    if (p && p.activa !== false) return p;
  }
  const tipo = await clasificarProgramaAsync(prog, cat.catTipoCapacitacion);
  const idDef = idPlantillaPorTipo(config, tipo);
  if (idDef) {
    const p = await PlantillaCertificado.findById(idDef).lean();
    if (p && p.activa !== false) return p;
  }
  const ori = orientacionPorTipo(config, tipo);
  return PlantillaCertificado.findOne({
    tipoCertificado: tipo,
    orientacion: ori,
    activa: { $ne: false },
  })
    .sort({ updatedAt: -1 })
    .lean();
}

exports.tiposCertificado = async (_req, res) => {
  res.json(
    Object.values(TIPOS).map((id) => ({
      id,
      label: TIPOS_LABEL[id],
    })),
  );
};

async function programaPorId(idProg) {
  return buscarPrograma(idProg);
}

async function descrPrograma(idProg) {
  const p = await programaPorId(idProg);
  return p?.descripcion || p?.nombreProg || p?.nomCert || null;
}

function encabezadoCurso(prog) {
  return (prog?.nomCert || prog?.descripcion || prog?.nombreProg || '').trim();
}

exports.elegibles = async (req, res, next) => {
  try {
    const numDoc = numDocFromParams(req.params.numDoc);
    if (numDoc == null) return res.status(400).json({ message: 'numDoc inválido' });
    const q = numDocQuery(numDoc);
    const liqs = await Liquidacion.find({ $and: [q, { idProg: { $ne: null } }] }).lean();
    const certs = await Certificado.find(q).lean();
    const certIds = new Set(certs.map((c) => String(c.idLiquidacion)));

    const out = [];
    for (const it of liqs) {
      const saldo = num(it.saldo);
      if (saldo > 0.0001) continue;
      if (certIds.has(String(it._id))) continue;
      const prog = await programaPorId(it.idProg);
      const tipoCert = await clasificarProgramaAsync(prog, cat.catTipoCapacitacion);
      const cfg = await obtenerConfigCertificado();
      const plantillaSug = await resolverPlantilla(prog, cfg, null);
      out.push({
        ...it,
        valor: num(it.valor),
        abonado: num(it.abonado),
        saldo,
        programaDescr: prog?.descripcion || prog?.nombreProg || null,
        nomCert: prog?.nomCert || null,
        horas: prog?.horas != null ? Number(prog.horas) : null,
        tipoCertificado: tipoCert,
        tipoCertificadoLabel: TIPOS_LABEL[tipoCert],
        formatoOrientacion: plantillaSug?.orientacion || orientacionPorTipo(cfg, tipoCert),
        plantillaSugeridaId: plantillaSug?._id ? String(plantillaSug._id) : null,
        plantillaSugeridaNombre: plantillaSug?.nombre || null,
        tieneFormato: !!plantillaSug,
      });
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
};

exports.listarPorAlumno = async (req, res, next) => {
  try {
    const numDoc = numDocFromParams(req.params.numDoc);
    if (numDoc == null) return res.status(400).json({ message: 'numDoc inválido' });
    const certs = await Certificado.find(numDocQuery(numDoc)).sort({ fechaEmision: -1 }).lean();
    const out = [];
    for (const c of certs) {
      const descr = await descrPrograma(c.idProg);
      const prog = await programaPorId(c.idProg);
      out.push({
        ...c,
        programaDescr: descr,
        nomCert: prog?.nomCert || null,
      });
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { numDoc: numDocRaw, idLiquidacion, idPlantilla, numActa, numFolio, numRunt, observaciones, fechaEmision } =
      req.body || {};
    const numDoc = parseNumDoc(numDocRaw);
    if (numDoc == null || !idLiquidacion) {
      return res.status(400).json({ message: 'numDoc e idLiquidacion son obligatorios' });
    }
    const liq = await Liquidacion.findById(idLiquidacion);
    if (!liq) return res.status(404).json({ message: 'Item de liquidación no encontrado' });
    if (!numDocEquals(liq.numDoc, numDoc)) return res.status(400).json({ message: 'No corresponde al alumno' });
    if (!liq.idProg) return res.status(400).json({ message: 'El ítem no es de un programa educativo' });
    if (num(liq.saldo) > 0.0001) return res.status(400).json({ message: 'El programa no está totalmente pagado' });

    const dup = await Certificado.findOne({ idLiquidacion });
    if (dup) return res.status(409).json({ message: 'Ya existe un certificado para este programa' });

    const cfg = await obtenerConfigCertificado();
    const prog = await programaPorId(liq.idProg);
    const tipoCert = await clasificarProgramaAsync(prog, cat.catTipoCapacitacion);
    const plantilla = await resolverPlantilla(prog, cfg, idPlantilla);
    if (!plantilla) {
      return res.status(400).json({
        message: `No hay plantilla de certificado para «${TIPOS_LABEL[tipoCert]}». Configúrela en Config. Certificados.`,
      });
    }

    const fechaEm = fechaEmision ? new Date(fechaEmision) : new Date();
    let fechaVe = null;
    const dias = Number(prog?.diasVencimiento || prog?.vigenciaDias || 0);
    if (dias > 0) fechaVe = new Date(fechaEm.getTime() + dias * 24 * 60 * 60 * 1000);

    const codigoCert = await siguienteCodigoCertificado();
    const encabezado = encabezadoCurso(prog);

    const cert = await Certificado.create({
      numDoc,
      idLiquidacion: liq._id,
      idProg: liq.idProg,
      codigoCert,
      encabezado,
      idPlantilla: plantilla._id,
      orientacion: plantilla.orientacion || 'vertical',
      tipoCertificado: tipoCert,
      numActa,
      numFolio,
      numRunt,
      observaciones,
      fechaEmision: fechaEm,
      fechaVencimiento: fechaVe,
    });
    const descr = await descrPrograma(cert.idProg);
    res.status(201).json({
      ...cert.toObject(),
      programaDescr: descr,
      nomCert: prog?.nomCert || null,
      encabezado,
      tipoCertificado: tipoCert,
      tipoCertificadoLabel: TIPOS_LABEL[tipoCert],
    });
  } catch (e) {
    next(e);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const c = await Certificado.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ message: 'Certificado no encontrado' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

const CAMPOS_EDITABLES = [
  'numActa',
  'numFolio',
  'numRunt',
  'observaciones',
  'encabezado',
  'fechaEmision',
  'fechaVencimiento',
];

function pickCertificadoEdit(body) {
  const dto = {};
  for (const k of CAMPOS_EDITABLES) {
    if (body[k] !== undefined) dto[k] = body[k];
  }
  if (dto.numActa !== undefined) dto.numActa = String(dto.numActa || '').trim();
  if (dto.numFolio !== undefined) dto.numFolio = String(dto.numFolio || '').trim();
  if (dto.numRunt !== undefined) dto.numRunt = String(dto.numRunt || '').trim();
  if (dto.observaciones !== undefined) dto.observaciones = String(dto.observaciones || '').trim();
  if (dto.encabezado !== undefined) dto.encabezado = String(dto.encabezado || '').trim();
  if (dto.fechaEmision !== undefined) {
    if (!dto.fechaEmision) return { error: 'fechaEmision inválida' };
    const d = new Date(dto.fechaEmision);
    if (isNaN(d.getTime())) return { error: 'fechaEmision inválida' };
    dto.fechaEmision = d;
  }
  if (dto.fechaVencimiento !== undefined) {
    if (dto.fechaVencimiento === null || dto.fechaVencimiento === '') {
      dto.fechaVencimiento = null;
    } else {
      const d = new Date(dto.fechaVencimiento);
      if (isNaN(d.getTime())) return { error: 'fechaVencimiento inválida' };
      dto.fechaVencimiento = d;
    }
  }
  return { dto };
}

exports.actualizar = async (req, res, next) => {
  try {
    const cert = await Certificado.findById(req.params.id);
    if (!cert) return res.status(404).json({ message: 'Certificado no encontrado' });

    const picked = pickCertificadoEdit(req.body || {});
    if (picked.error) return res.status(400).json({ message: picked.error });
    if (!Object.keys(picked.dto).length) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    Object.assign(cert, picked.dto);
    await cert.save();

    const descr = await descrPrograma(cert.idProg);
    const prog = await programaPorId(cert.idProg);
    res.json({
      ...cert.toObject(),
      programaDescr: descr,
      nomCert: prog?.nomCert || null,
      tipoCertificadoLabel: TIPOS_LABEL[cert.tipoCertificado] || cert.tipoCertificado,
    });
  } catch (e) {
    next(e);
  }
};
