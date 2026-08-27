const DatosAlumno = require('../models/DatosAlumno');
const Liquidacion = require('../models/Liquidacion');
const Matricula = require('../models/Matricula');
const ProgresoVirtualCurso = require('../models/ProgresoVirtualCurso');
const AulaVirtualAccesoPlazoAviso = require('../models/AulaVirtualAccesoPlazoAviso');
const CapacitacionVirtualConfig = require('../models/CapacitacionVirtualConfig');
const { TARIFA_VIRTUAL } = require('../constants/tarifa');
const { numDocQuery } = require('../utils/numDoc');
const { num } = require('./programaServicio');
const { requierePagoParaCursar } = require('./aulaVirtualConfig');
const { configPorPrograma } = require('./aulaVirtualCatalogo');
const {
  enviarAvisoVencimientoAcceso,
  enviarAccesoExpirado,
} = require('./aulaVirtualAccesoPlazoMail');

function matriculaSvc() {
  return require('./aulaVirtualMatricula');
}

const MS_DIA = 24 * 60 * 60 * 1000;
const QUERY_MATRICULA_ACTIVA = { estado: { $regex: /^activo?a?$/i } };

function inicioDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function diasAccesoSinPagoCfg(cfg) {
  const n = Number(cfg?.diasAccesoSinPago);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

function diasAvisoAlumnoCfg(cfg) {
  const n = Number(cfg?.diasAvisoAlumno);
  if (!Number.isFinite(n) || n < 0) return 8;
  return Math.floor(n);
}

function aplicaPlazoAccesoGratuito(cfg, pago) {
  if (requierePagoParaCursar(cfg)) return false;
  if (pago?.pagado) return false;
  return diasAccesoSinPagoCfg(cfg) > 0;
}

function calcularFechaVencimientoAcceso(fechaMat, diasAcceso) {
  if (!fechaMat || diasAcceso <= 0) return null;
  return new Date(inicioDia(fechaMat).getTime() + diasAcceso * MS_DIA);
}

function calcularEstadoPlazoAcceso({ cfg, matricula, pago }) {
  const base = {
    aplica: false,
    diasAccesoSinPago: 0,
    diasAvisoAlumno: diasAvisoAlumnoCfg(cfg),
    diasRestantes: null,
    fechaVencimiento: null,
    enVentanaAviso: false,
    vencido: false,
  };
  if (!matricula || !cfg) return base;
  if (!aplicaPlazoAccesoGratuito(cfg, pago)) return base;

  const dias = diasAccesoSinPagoCfg(cfg);
  const diasAviso = diasAvisoAlumnoCfg(cfg);
  const fechaVenc = calcularFechaVencimientoAcceso(matricula.fechaMat, dias);
  if (!fechaVenc) return base;

  const hoy = inicioDia();
  const vencido = hoy.getTime() >= fechaVenc.getTime();
  const diasRestantes = vencido ? 0 : Math.ceil((fechaVenc.getTime() - hoy.getTime()) / MS_DIA);

  return {
    aplica: true,
    diasAccesoSinPago: dias,
    diasAvisoAlumno: diasAviso,
    diasRestantes,
    fechaVencimiento: fechaVenc,
    enVentanaAviso: !vencido && diasRestantes <= diasAviso,
    vencido,
  };
}

function nombreAlumnoRow(al) {
  if (!al) return '';
  return [al.nombre1, al.nombre2, al.apellido1, al.apellido2].filter(Boolean).join(' ').trim();
}

async function resolverEmailAlumno(numDoc, alumno) {
  const al =
    alumno ||
    (await DatosAlumno.findOne(numDocQuery(numDoc)).lean());
  const mail = String(al?.correo || '').trim().toLowerCase();
  return mail || null;
}

async function expirarAccesoVirtual({
  numDoc,
  idPrograma,
  matricula,
  enviarCorreo = true,
  motivo = 'Acceso sin pago expirado — aula virtual',
}) {
  const idProg = String(idPrograma);
  const mat =
    matricula ||
    (await Matricula.findOne({
      ...numDocQuery(numDoc),
      idProg,
      ...QUERY_MATRICULA_ACTIVA,
      tarifa: TARIFA_VIRTUAL,
    }).lean());
  if (!mat) return { ok: false, motivo: 'sin_matricula' };

  await ProgresoVirtualCurso.deleteOne({ ...numDocQuery(numDoc), idPrograma: idProg });

  await Matricula.updateOne(
    { _id: mat._id },
    {
      $set: {
        estado: 'anulada',
        observaciones: String(mat.observaciones || '')
          .trim()
          ? `${String(mat.observaciones).trim()} · ${motivo}`
          : motivo,
      },
    },
  );

  const liq = await Liquidacion.findOne({ idMat: mat._id, idProg }).lean();
  if (liq && num(liq.abonado) <= 0.0001) {
    await Liquidacion.deleteOne({ _id: liq._id });
  }

  if (enviarCorreo) {
    try {
      const alumno = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();
      const email = await resolverEmailAlumno(numDoc, alumno);
      const cfg = await configPorPrograma(idProg);
      const { buscarPrograma } = require('./programaServicio');
      const prog = await buscarPrograma(idProg);
      const nombreCurso = prog?.nombreProg || idProg;
      const ya = await AulaVirtualAccesoPlazoAviso.findOne({
        numDoc,
        idPrograma: idProg,
        idMatricula: mat._id,
        tipo: 'expiracion_alumno',
      }).lean();
      if (email && !ya) {
        await enviarAccesoExpirado({
          email,
          nombreAlumno: nombreAlumnoRow(alumno),
          nombreCurso,
        });
        await AulaVirtualAccesoPlazoAviso.create({
          numDoc,
          idPrograma: idProg,
          idMatricula: mat._id,
          tipo: 'expiracion_alumno',
          diasRestantes: 0,
        });
      }
    } catch (e) {
      console.warn('[AulaVirtual] correo expiración acceso:', e.message);
    }
  }

  return { ok: true };
}

async function asegurarAccesoVigente(numDoc, idPrograma, ctx = {}) {
  const idProg = String(idPrograma);
  const matricula = ctx.matricula;
  const mat =
    matricula ||
    (await Matricula.findOne({
      ...numDocQuery(numDoc),
      idProg,
      ...QUERY_MATRICULA_ACTIVA,
      tarifa: TARIFA_VIRTUAL,
    }).lean());
  if (!mat) return { vigente: true, expirado: false };

  const cfg = ctx.cfg || (await configPorPrograma(idProg));
  const pago = ctx.pago || (await matriculaSvc().estadoPagoVirtual(numDoc, idProg));
  const plazo = calcularEstadoPlazoAcceso({ cfg, matricula: mat, pago });
  if (!plazo.aplica || !plazo.vencido) {
    return { vigente: true, expirado: false, plazo };
  }

  await expirarAccesoVirtual({ numDoc, idPrograma: idProg, matricula: mat });
  return { vigente: false, expirado: true, plazo };
}

async function enviarAvisoSiCorresponde({ numDoc, idPrograma, matricula, cfg, pago, alumno, nombreCurso }) {
  const plazo = calcularEstadoPlazoAcceso({ cfg, matricula, pago });
  if (!plazo.aplica || !plazo.enVentanaAviso || plazo.vencido) return { enviado: false };

  const ya = await AulaVirtualAccesoPlazoAviso.findOne({
    numDoc,
    idPrograma: String(idPrograma),
    idMatricula: matricula._id,
    tipo: 'aviso_alumno',
  }).lean();
  if (ya) return { enviado: false, motivo: 'ya_enviado' };

  const email = await resolverEmailAlumno(numDoc, alumno);
  if (!email) return { enviado: false, motivo: 'sin_correo' };

  try {
    await enviarAvisoVencimientoAcceso({
      email,
      nombreAlumno: nombreAlumnoRow(alumno),
      nombreCurso: nombreCurso || idPrograma,
      diasRestantes: plazo.diasRestantes,
      fechaVencimiento: plazo.fechaVencimiento,
    });
    await AulaVirtualAccesoPlazoAviso.create({
      numDoc,
      idPrograma: String(idPrograma),
      idMatricula: matricula._id,
      tipo: 'aviso_alumno',
      diasRestantes: plazo.diasRestantes,
    });
    return { enviado: true };
  } catch (e) {
    console.warn('[AulaVirtual] aviso plazo acceso:', e.message);
    return { enviado: false, motivo: e.message };
  }
}

async function iterarMatriculasPlazoActivo(handler) {
  const configs = await CapacitacionVirtualConfig.find({
    requierePagoParaCursar: { $ne: true },
    diasAccesoSinPago: { $gt: 0 },
  }).lean();
  const cfgMap = new Map(configs.map((c) => [String(c.idPrograma), c]));
  if (!cfgMap.size) return 0;

  const mats = await Matricula.find({
    ...QUERY_MATRICULA_ACTIVA,
    tarifa: TARIFA_VIRTUAL,
    idProg: { $in: [...cfgMap.keys()] },
  }).lean();

  let n = 0;
  for (const mat of mats) {
    const idProg = String(mat.idProg);
    const cfg = cfgMap.get(idProg);
    if (!cfg) continue;
    const pago = await matriculaSvc().estadoPagoVirtual(mat.numDoc, idProg);
    if (pago.pagado) continue;
    const plazo = calcularEstadoPlazoAcceso({ cfg, matricula: mat, pago });
    if (!plazo.aplica) continue;
    await handler({ mat, cfg, pago, plazo, idProg });
    n += 1;
  }
  return n;
}

async function procesarExpiracionesAcceso() {
  let expirados = 0;
  await iterarMatriculasPlazoActivo(async ({ mat, plazo, idProg }) => {
    if (!plazo.vencido) return;
    const r = await expirarAccesoVirtual({
      numDoc: mat.numDoc,
      idPrograma: idProg,
      matricula: mat,
    });
    if (r.ok) expirados += 1;
  });
  return { expirados };
}

async function procesarAvisosAccesoAlumno() {
  let avisos = 0;
  const { buscarPrograma } = require('./programaServicio');
  await iterarMatriculasPlazoActivo(async ({ mat, cfg, pago, plazo, idProg }) => {
    if (plazo.vencido || !plazo.enVentanaAviso) return;
    const alumno = await DatosAlumno.findOne(numDocQuery(mat.numDoc)).lean();
    const prog = await buscarPrograma(idProg);
    const r = await enviarAvisoSiCorresponde({
      numDoc: mat.numDoc,
      idPrograma: idProg,
      matricula: mat,
      cfg,
      pago,
      alumno,
      nombreCurso: prog?.nombreProg || idProg,
    });
    if (r.enviado) avisos += 1;
  });
  return { avisos };
}

async function listarAccesosPorVencer({ diasAntelacion = 1 } = {}) {
  const ventana = Math.max(1, Math.floor(Number(diasAntelacion) || 1));
  const items = [];
  const { buscarPrograma } = require('./programaServicio');
  const alDocs = new Set();

  await iterarMatriculasPlazoActivo(async ({ mat, plazo, idProg }) => {
    if (plazo.vencido) return;
    if (plazo.diasRestantes == null || plazo.diasRestantes > ventana) return;
    alDocs.add(mat.numDoc);
    const prog = await buscarPrograma(idProg);
    items.push({
      id: `${mat._id}:${idProg}`,
      numDoc: mat.numDoc,
      idPrograma: idProg,
      nombrePrograma: prog?.nombreProg || idProg,
      fechaMat: mat.fechaMat,
      fechaVencimiento: plazo.fechaVencimiento,
      diasRestantes: plazo.diasRestantes,
      diasAccesoSinPago: plazo.diasAccesoSinPago,
    });
  });

  items.sort((a, b) => (a.diasRestantes ?? 99) - (b.diasRestantes ?? 99));

  const alumnos = await DatosAlumno.find({ numDoc: { $in: [...alDocs] } }).lean();
  const alMap = new Map(alumnos.map((a) => [a.numDoc, a]));
  for (const it of items) {
    const al = alMap.get(it.numDoc);
    it.nombreAlumno = nombreAlumnoRow(al);
    it.email = al?.correo || null;
  }

  const venceManana = items.filter((i) => i.diasRestantes === 1).length;
  const venceHoy = items.filter((i) => i.diasRestantes <= 0).length;

  return {
    total: items.length,
    diasVentana: ventana,
    venceHoy,
    venceManana,
    items: items.slice(0, 100),
  };
}

module.exports = {
  inicioDia,
  diasAccesoSinPagoCfg,
  diasAvisoAlumnoCfg,
  aplicaPlazoAccesoGratuito,
  calcularFechaVencimientoAcceso,
  calcularEstadoPlazoAcceso,
  expirarAccesoVirtual,
  asegurarAccesoVigente,
  enviarAvisoSiCorresponde,
  procesarExpiracionesAcceso,
  procesarAvisosAccesoAlumno,
  listarAccesosPorVencer,
};
