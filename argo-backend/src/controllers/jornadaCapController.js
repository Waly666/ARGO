const Contratacion = require('../models/Contratacion');
const Cliente = require('../models/Cliente');
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/upload');
const Supervisor = require('../models/Supervisor');
const JornadaCap = require('../models/JornadaCap');
const ClaseJornadaCap = require('../models/ClaseJornadaCap');
const AsisClasJorCap = require('../models/AsisClasJorCap');
const InscripcionClase = require('../models/InscripcionClase');
const Certificado = require('../models/Certificado');
const DatosAlumno = require('../models/DatosAlumno');
const Matricula = require('../models/Matricula');
const { parseNumDoc, numDocQuery } = require('../utils/numDoc');
const { filtroBusquedaAlumno, coincideBusquedaAlumno, coincideBusquedaTexto, coincideBusquedaDocumento } = require('../utils/busquedaAlumnoNombre');
const { parseFechaCalendario, fechaCalendarioParaGuardar, fechaCalendarioIso } = require('../utils/fechaCalendario');
const { calcNumeObjeJornada, generarJornadasContrato } = require('../services/programacionJornadas');
const {
  generarClasesFaltantesContrato,
  generarClasesFaltantesJornada,
} = require('../services/programacionClasesJornada');
const { obtenerAvanceContratoJornada } = require('../services/avanceContratoJornada');
const { syncContadoresContrato, siguienteIndiceEnDia } = require('../services/contratoJornadaSync');
const {
  TIPOS_CERTIFICADO_CONTRATO,
  TIPO_CERTIFICADO_GLOBAL,
  TIPO_CERTIFICADO_POR_CLASE,
} = require('../constants/jornadaCapacitacion');
const { cumplimientoParaJornada } = require('../services/cumplimientoJornadaCap');
const { num: numMoney, roundMoney } = require('../utils/coerceTypes');
const {
  serializarPlanCobro,
  normalizarPlanCobroEntrada,
  estadoCobroContrato,
  generarCuentaCobroContrato,
  htmlCuentaCobroContrato,
  generarComprobanteIngresoContrato,
} = require('../services/contratoCobroCap');
const {
  auditoriaUsuario,
  asegurarTipoAlumnoJornada,
  asignarEmpresaContratoAlumno,
  esProgramaJornadasCap,
  TIPO_JORNADAS_CAPACITACION,
} = require('../services/jornadaCapacitacion');
const {
  registrarAsistenciaAlumnoEnClase,
  registrarAsistenciasInscritosPendientes,
  emitirCertificadosAsistentesClase,
  postCierreClaseJornada,
  fusionarCertificadosEmitidos,
} = require('../services/asistenciaJornadaCap');
const {
  MOTIVOS_CERT,
  progresoCertificacion,
  crearContextoCertificadoContrato,
  certificadoExistenteClase,
} = require('../services/certificadoJornadaAuto');
const { buscarPrograma } = require('../services/programaServicio');
const { normalizarTipoRegularJornada } = require('../constants/tipoRegularJornada');
const { TIPOS_LABEL } = require('../services/clasificacionCertificado');
const {
  autorizarAnulacionSimple,
  metadatosAnulacion,
  sufijoAutoriza,
} = require('../services/anulacionComprobante');
const { esComprobanteAnulado } = require('../utils/comprobanteEstado');
const { crearMatriculaDesdeBody } = require('../services/matriculaCreator');
const { ESTADOS_CLASE, UBICACIONES_CLASE, DETE_GEOREFE_VALORES, ESTADO_JORNADA_EN_PROCESO, ESTADO_JORNADA_FINALIZADO, ESTADOS_JORNADA } = require('../constants/jornadaCapacitacion');
const {
  sincronizarEstadoJornada,
  sincronizarEstadosJornadas,
  estadoJornadaPorFecha,
  inicioDia,
} = require('../services/estadoJornadaCap');
const {
  bloqueoOperacionJornada,
  bloqueoIniciarClaseJornada,
  bloqueoCrearClaseJornada,
  estadoOperacionEspecialJornadas,
  operacionFueraDeDiaActiva,
} = require('../services/jornadasOperacionEspecial');
const {
  obtenerConfigJornadasOperacion,
  actualizarConfigJornadasOperacion,
} = require('../services/configJornadasOperacion');
const { validarServicioCapacitacionContrato } = require('../services/servicioContratoCap');
const { registrarAuditoria, registrarEliminacion } = require('../services/auditoria');
const { municipioPorCoords } = require('../services/georefMunicipio');
const {
  normalizarEstadoContrato,
  contratoEstaEnEjecucion,
  cerrarJornadasActivasContrato,
  finalizarContratoCap,
  reactivarContratoCap,
} = require('../services/contratoFinalizacionCap');
const {
  resolverInstructorParaClase,
  listarInstructoresConUsuario,
  enriquecerClases,
  aplicarFiltroClasesQueryPorRol,
  asegurarInstructorOperandoClase,
} = require('../services/instructorJornada');
const { tieneAlguno, permisosParaRol } = require('../services/rolesPermisos');

async function dtoClaseConJornada(claseDoc) {
  const plain = claseDoc?.toObject ? claseDoc.toObject() : { ...claseDoc };
  const j = await sincronizarEstadoJornada(plain.idJornada);
  if (!plain.fechaClase && j?.fechaProgramacion) {
    plain.fechaClase = inicioDia(j.fechaProgramacion);
  }
  let codContrato = '';
  let contratoLabel = '';
  let clienteNombre = '';
  if (j?.idContrato) {
    const contrato = await Contratacion.findById(j.idContrato)
      .select('codContrato nombreComercial razoSocial')
      .lean();
    if (contrato) {
      codContrato = String(contrato.codContrato || '').trim();
      const cliente = String(contrato.nombreComercial || contrato.razoSocial || '').trim();
      clienteNombre = cliente;
      contratoLabel = codContrato
        ? `${codContrato} — ${cliente || 'Contrato'}`
        : cliente || '';
    }
  }
  const [enriched] = await enriquecerClases([
    {
      ...plain,
      fechaJornada: j?.fechaProgramacion,
      jornadaEstado: j?.estado,
      idContrato: j?.idContrato,
      municipioJornada: j?.municipio,
      indiceEnDia: j?.indiceEnDia,
      codContrato,
      contratoLabel,
      clienteNombre,
    },
  ]);
  return enriched;
}

function parseCoord(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseDeteGeorefe(v) {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim().toUpperCase();
  if (!s) return '';
  if (!DETE_GEOREFE_VALORES.includes(s)) {
    const err = new Error(`deteGeorefe inválido. Use: ${DETE_GEOREFE_VALORES.join(', ')}`);
    err.status = 400;
    throw err;
  }
  return s;
}

function resumenContratoSync(contrato) {
  if (!contrato) return null;
  const c = contrato.toObject ? contrato.toObject() : contrato;
  return {
    _id: c._id,
    numerojornadas: c.numerojornadas,
    jornadasPorDia: c.jornadasPorDia,
    numeObjeJornada: c.numeObjeJornada,
    clasesPorJornada: c.clasesPorJornada,
    jornadasGeneradas: c.jornadasGeneradas,
    jornadasExistentes: c.jornadasExistentes,
  };
}

const ESTADOS_CONTRATO = ['En Ejecución', 'Ejecutado'];

const TIPO_ID_DESDE_CLIENTE = {
  '31': 'NIT',
  '13': 'CC',
  '22': 'CE',
  '12': 'TI',
  '41': 'PP',
};

async function syncContratoDesdeCliente(dto) {
  const cli = await Cliente.findById(dto.idClienteFacturacion).lean();
  if (!cli) {
    const err = new Error('Cliente no encontrado. Créelo en Configuración → Clientes.');
    err.status = 400;
    throw err;
  }
  if (cli.activo === false) {
    const err = new Error('El cliente seleccionado está inactivo.');
    err.status = 400;
    throw err;
  }
  dto.numeroIdentificacion = String(cli.identificacion || '').trim();
  dto.tipoIdentificacion =
    TIPO_ID_DESDE_CLIENTE[String(cli.identificationDocumentCode || '').trim()] ||
    String(cli.identificationDocumentCode || 'NIT').trim() ||
    'NIT';
  dto.razoSocial = String(cli.razonSocial || cli.nombres || '').trim();
  dto.nombreComercial = String(cli.nombreComercial || '').trim();
  dto.email = String(cli.correo || '').trim();
  dto.telefono = String(cli.telefono || '').trim();
  if (!String(dto.direccion || '').trim() && cli.direccion) {
    dto.direccion = String(cli.direccion).trim();
  }
  if (!String(dto.codMunicipio || '').trim() && cli.municipioCodigo) {
    dto.codMunicipio = String(cli.municipioCodigo).trim();
  }
  if (!String(dto.ciudad || '').trim() && cli.municipioNombre) {
    dto.ciudad = String(cli.municipioNombre).trim();
  }
  return dto;
}

function enrichContratoRespuesta(c, clienteMap) {
  const cli = c.idClienteFacturacion ? clienteMap.get(String(c.idClienteFacturacion)) : null;
  const base = {
    ...c,
    estado: normalizarEstadoContrato(c.estado),
    valorContrato: roundMoney(numMoney(c.valorContrato)),
    planCobro: serializarPlanCobro(c.planCobro),
    comprobantesIngresoCaja: !!c.comprobantesIngresoCaja,
  };
  if (!cli) return base;
  const nombre = String(cli.nombreComercial || cli.razonSocial || cli.nombres || '').trim();
  return {
    ...base,
    clienteNombre: nombre,
    clienteIdentificacion: cli.identificacion || null,
    razoSocial: String(cli.razonSocial || cli.nombres || base.razoSocial || '').trim(),
    nombreComercial: String(cli.nombreComercial || base.nombreComercial || '').trim(),
    numeroIdentificacion: String(cli.identificacion || base.numeroIdentificacion || '').trim(),
  };
}

async function enrichContratosRespuesta(rows) {
  const ids = [
    ...new Set(
      rows.map((r) => r.idClienteFacturacion).filter(Boolean).map((id) => String(id)),
    ),
  ];
  const clientes = ids.length ? await Cliente.find({ _id: { $in: ids } }).lean() : [];
  const map = new Map(clientes.map((cl) => [String(cl._id), cl]));
  return rows.map((c) => enrichContratoRespuesta(c, map));
}

function pickContrato(body) {
  const fields = [
    'tipoIdentificacion',
    'numeroIdentificacion',
    'codContrato',
    'razoSocial',
    'nombreComercial',
    'email',
    'telefono',
    'direccion',
    'codMunicipio',
    'ciudad',
    'departamento',
    'pais',
    'codigoPostal',
    'estado',
    'fechacontrato',
    'objeto',
    'objetoContrato',
    'supervisor',
    'idSupervisor',
    'numerojornadas',
    'jornadasPorDia',
    'clasesPorJornada',
    'horasPorClase',
    'tipoCertificado',
    'idProgramaCertificacion',
    'numeroAlumnos',
    'nombreCertificacion',
    'numeroHorascert',
    'incluiSab',
    'incluiDom',
    'incluiFest',
    'fechaInicJornadas',
    'fechaFinJornadas',
    'numSesCert',
    'idProgramas',
    'idClienteFacturacion',
    'valorContrato',
    'comprobantesIngresoCaja',
    'planCobro',
  ];
  const dto = {};
  for (const k of fields) {
    if (body[k] !== undefined) dto[k] = body[k];
  }
  if (dto.codContrato != null) dto.codContrato = String(dto.codContrato).trim();
  if (dto.estado != null) dto.estado = normalizarEstadoContrato(dto.estado);
  if (dto.numerojornadas != null) dto.numerojornadas = Math.max(0, parseInt(dto.numerojornadas, 10) || 0);
  if (dto.jornadasPorDia != null) {
    dto.jornadasPorDia = Math.max(1, Math.min(20, parseInt(dto.jornadasPorDia, 10) || 1));
  }
  if (dto.clasesPorJornada != null) {
    dto.clasesPorJornada = Math.max(0, Math.min(20, parseInt(dto.clasesPorJornada, 10) || 0));
  }
  if (dto.horasPorClase != null) {
    dto.horasPorClase = Math.max(0, Number(dto.horasPorClase) || 0);
  }
  if (dto.tipoCertificado != null) {
    const t = String(dto.tipoCertificado).trim().toLowerCase();
    dto.tipoCertificado = TIPOS_CERTIFICADO_CONTRATO.includes(t) ? t : TIPO_CERTIFICADO_GLOBAL;
  }
  if (dto.idProgramaCertificacion !== undefined) {
    dto.idProgramaCertificacion = String(dto.idProgramaCertificacion || '').trim();
  }
  if (dto.numeroAlumnos != null) dto.numeroAlumnos = Math.max(0, parseInt(dto.numeroAlumnos, 10) || 0);
  if (dto.numSesCert != null) dto.numSesCert = Math.max(1, parseInt(dto.numSesCert, 10) || 1);
  if (dto.valorContrato != null) dto.valorContrato = Math.max(0, Number(dto.valorContrato) || 0);
  if (dto.comprobantesIngresoCaja != null) dto.comprobantesIngresoCaja = !!dto.comprobantesIngresoCaja;
  if (dto.idClienteFacturacion === '' || dto.idClienteFacturacion == null) {
    dto.idClienteFacturacion = null;
  }
  if (dto.fechaInicJornadas != null && dto.fechaInicJornadas !== '') {
    dto.fechaInicJornadas = fechaCalendarioParaGuardar(dto.fechaInicJornadas);
  }
  if (dto.fechaFinJornadas != null && dto.fechaFinJornadas !== '') {
    dto.fechaFinJornadas = fechaCalendarioParaGuardar(dto.fechaFinJornadas);
  } else if (dto.fechaFinJornadas === '' || dto.fechaFinJornadas == null) {
    dto.fechaFinJornadas = null;
  }
  if (dto.idProgramas !== undefined) {
    dto.idProgramas = Array.isArray(dto.idProgramas)
      ? dto.idProgramas.map((x) => String(x).trim()).filter(Boolean)
      : [];
  }
  dto.numeObjeJornada = calcNumeObjeJornada(dto.numeroAlumnos, dto.numerojornadas);
  return dto;
}

async function enrichContratoDto(dto, prev = null) {
  const clienteId =
    dto.idClienteFacturacion !== undefined
      ? dto.idClienteFacturacion
      : prev?.idClienteFacturacion || null;
  if (!clienteId) {
    const err = new Error(
      'Seleccione la empresa desde el catálogo de clientes (Configuración → Clientes).',
    );
    err.status = 400;
    throw err;
  }
  dto.idClienteFacturacion = clienteId;
  await syncContratoDesdeCliente(dto);
  if (dto.idSupervisor) {
    const sup = await Supervisor.findById(dto.idSupervisor).lean();
    if (sup?.nombre) dto.supervisor = sup.nombre;
  }
  if (dto.idProgramas !== undefined) {
    const { normalizarYValidarProgramasContrato } = require('../services/programasContratoJornada');
    dto.idProgramas = await normalizarYValidarProgramasContrato(dto.idProgramas);
  }
  if (dto.fechaInicJornadas && dto.fechaFinJornadas) {
    const ini = parseFechaCalendario(dto.fechaInicJornadas);
    const fin = parseFechaCalendario(dto.fechaFinJornadas);
    if (ini && fin && fin.getTime() < ini.getTime()) {
      const err = new Error('La fecha fin de jornadas debe ser igual o posterior al inicio.');
      err.status = 400;
      throw err;
    }
  }
  const valorRef =
    dto.valorContrato != null ? dto.valorContrato : prev ? numMoney(prev.valorContrato) : 0;
  if (dto.planCobro !== undefined) {
    dto.planCobro = normalizarPlanCobroEntrada(dto.planCobro, valorRef, prev);
  }
  return dto;
}

exports.listarContratos = async (_req, res, next) => {
  try {
    const rows = await Contratacion.find().sort({ createdAt: -1 }).lean();
    res.json(await enrichContratosRespuesta(rows));
  } catch (e) {
    next(e);
  }
};

exports.obtenerContrato = async (req, res, next) => {
  try {
    const c = await Contratacion.findById(req.params.id).lean();
    if (!c) return res.status(404).json({ message: 'Contrato no encontrado' });
    const [enriched] = await enrichContratosRespuesta([c]);
    res.json(enriched);
  } catch (e) {
    next(e);
  }
};

exports.avanceContrato = async (req, res, next) => {
  try {
    const avance = await obtenerAvanceContratoJornada(req.params.id);
    if (!avance) return res.status(404).json({ message: 'Contrato no encontrado' });
    res.json(avance);
  } catch (e) {
    next(e);
  }
};

exports.informeDashboardContrato = async (req, res, next) => {
  try {
    const {
      obtenerDashboardInformeContrato,
    } = require('../services/informeDashboardContrato');
    const data = await obtenerDashboardInformeContrato(req.params.id, req.query || {});
    if (!data) return res.status(404).json({ message: 'Contrato no encontrado' });
    res.json(data);
  } catch (e) {
    next(e);
  }
};

/** PDF del informe (alcance=contrato|jornada|clase|programa|instructor). */
exports.informeContratoPdf = async (req, res, next) => {
  try {
    const {
      obtenerDashboardInformeContrato,
      buildHtmlInformeContratoPdf,
    } = require('../services/informeDashboardContrato');
    const { launchBrowser, htmlToPdfBuffer } = require('../services/htmlToPdf');
    const alcance = String(req.query.alcance || 'contrato').trim().toLowerCase();
    const alcancesOk = new Set([
      'contrato',
      'jornada',
      'clase',
      'programa',
      'instructor',
      'desarrollo-general',
    ]);
    if (!alcancesOk.has(alcance)) {
      return res.status(400).json({ message: 'alcance inválido' });
    }
    if (alcance === 'jornada' && !req.query.idJornada) {
      return res.status(400).json({ message: 'Indique idJornada para el informe de jornada' });
    }
    if (alcance === 'clase' && !req.query.idClase) {
      return res.status(400).json({ message: 'Indique idClase para el informe de clase' });
    }
    if (alcance === 'programa' && !req.query.idPrograma) {
      return res.status(400).json({ message: 'Indique idPrograma para el informe por programa' });
    }
    const data = await obtenerDashboardInformeContrato(req.params.id, req.query || {});
    if (!data) return res.status(404).json({ message: 'Contrato no encontrado' });

    const html = await buildHtmlInformeContratoPdf(data, alcance);
    const browser = await launchBrowser();
    try {
      const pdf = await htmlToPdfBuffer(browser, html);
      const cod = String(data.contrato?.codContrato || data.contrato?._id || 'contrato')
        .replace(/[^\w.-]+/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="informe_${alcance}_${cod}.pdf"`,
      );
      res.send(pdf);
    } finally {
      await browser.close().catch(() => {});
    }
  } catch (e) {
    if (e.status && !res.headersSent) {
      return res.status(e.status).json({ message: e.message });
    }
    next(e);
  }
};

exports.crearContrato = async (req, res, next) => {
  try {
    const dto = await enrichContratoDto(pickContrato(req.body || {}));
    dto.userAddReg = auditoriaUsuario(req);
    const c = await Contratacion.create(dto);
    const [enriched] = await enrichContratosRespuesta([c.toObject ? c.toObject() : c]);
    res.status(201).json(enriched);
  } catch (e) {
    next(e);
  }
};

exports.actualizarContrato = async (req, res, next) => {
  try {
    const prev = await Contratacion.findById(req.params.id).lean();
    if (!prev) return res.status(404).json({ message: 'Contrato no encontrado' });
    const dto = await enrichContratoDto(pickContrato(req.body || {}), prev);
    dto.userChangeRecord = auditoriaUsuario(req);
    const pasoAEjecutado =
      dto.estado === 'Ejecutado' && normalizarEstadoContrato(prev.estado) !== 'Ejecutado';
    if (pasoAEjecutado) {
      dto.fechaFinalizacion = fechaCalendarioParaGuardar(new Date());
    }
    const c = await Contratacion.findByIdAndUpdate(req.params.id, { $set: dto }, { new: true }).lean();
    if (!c) return res.status(404).json({ message: 'Contrato no encontrado' });
    if (pasoAEjecutado) {
      await cerrarJornadasActivasContrato(c._id);
    }
    const [enriched] = await enrichContratosRespuesta([c]);
    res.json(enriched);
  } catch (e) {
    next(e);
  }
};

exports.finalizarContrato = async (req, res, next) => {
  try {
    const c = await Contratacion.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Contrato no encontrado' });
    const { contrato, jornadasCerradas } = await finalizarContratoCap(c, {
      fechaFinalizacion: req.body?.fechaFinalizacion,
      userChangeRecord: auditoriaUsuario(req),
    });
    const fechaTxt = contrato.fechaFinalizacion
      ? fechaCalendarioIso(contrato.fechaFinalizacion)
      : fechaCalendarioIso(new Date());
    res.json({
      ok: true,
      contrato: { ...contrato, estado: normalizarEstadoContrato(contrato.estado) },
      jornadasCerradas,
      message: `Contrato finalizado el ${fechaTxt}. ${jornadasCerradas} jornada(s) cerrada(s).`,
    });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.reactivarContrato = async (req, res, next) => {
  try {
    const c = await Contratacion.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Contrato no encontrado' });
    const { contrato, jornadasResincronizadas } = await reactivarContratoCap(c, {
      userChangeRecord: auditoriaUsuario(req),
    });
    registrarAuditoria({
      req,
      accion: 'contrato_reactivar',
      entidad: 'contratacion',
      idEntidad: String(contrato._id),
      resumen: `Contrato reactivado (${contrato.codContrato || contrato._id}): vuelve a En Ejecución`,
    }).catch(() => {});
    res.json({
      ok: true,
      contrato: { ...contrato, estado: normalizarEstadoContrato(contrato.estado) },
      jornadasResincronizadas,
      message:
        `Contrato reactivado: vuelve a «En Ejecución». ${jornadasResincronizadas} jornada(s) sincronizada(s). ` +
        'Puede matricular alumnos faltantes y reprocesar certificados. ' +
        'Si la jornada es de una fecha pasada, active el modo operación especial.',
    });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.eliminarContrato = async (req, res, next) => {
  try {
    const c = await Contratacion.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Contrato no encontrado' });

    const jornadasIds = await JornadaCap.find({ idContrato: c._id }).distinct('_id');
    const totalJornadas = jornadasIds.length;
    const totalClases = totalJornadas
      ? await ClaseJornadaCap.countDocuments({ idJornada: { $in: jornadasIds } })
      : 0;
    const clasesIds = totalClases
      ? await ClaseJornadaCap.find({ idJornada: { $in: jornadasIds } }).distinct('_id')
      : [];
    const totalAsis = clasesIds.length
      ? await AsisClasJorCap.countDocuments({ idclaseJornada: { $in: clasesIds } })
      : 0;

    if (totalAsis > 0 || totalClases > 0) {
      return res.status(400).json({
        message: `No se puede eliminar: el contrato tiene ${totalJornadas} jornada(s), ${totalClases} clase(s) y ${totalAsis} asistencia(s) relacionadas.`,
        relaciones: { jornadas: totalJornadas, clases: totalClases, asistencias: totalAsis },
      });
    }

    if (totalJornadas > 0) {
      await JornadaCap.deleteMany({ _id: { $in: jornadasIds } });
    }
    await Contratacion.deleteOne({ _id: c._id });

    res.json({
      ok: true,
      message: totalJornadas > 0
        ? `Contrato eliminado junto a ${totalJornadas} jornada(s) sin clases.`
        : 'Contrato eliminado.',
      jornadasEliminadas: totalJornadas,
    });
  } catch (e) {
    next(e);
  }
};

exports.generarJornadas = async (req, res, next) => {
  try {
    const c = await Contratacion.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Contrato no encontrado' });
    const userLogin = auditoriaUsuario(req);
    const result = await generarJornadasContrato(c, userLogin);
    const clasesResult = await generarClasesFaltantesContrato(c, userLogin);
    const contratoSync = await syncContadoresContrato(c._id);
    res.json({
      ok: true,
      ...result,
      numeObjeJornada: contratoSync?.numeObjeJornada ?? result.numeObjeJornada,
      clasesCreadas: clasesResult.clasesCreadas,
      jornadasProcesadasClases: clasesResult.jornadasProcesadas,
      contrato: resumenContratoSync(contratoSync),
    });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Error generando jornadas' });
  }
};

/** Jornada adicional manual (extra al plan del contrato). Actualiza numerojornadas en el contrato. */
exports.crearJornadaContrato = async (req, res, next) => {
  try {
    const contrato = await Contratacion.findById(req.params.id);
    if (!contrato) return res.status(404).json({ message: 'Contrato no encontrado' });
    if (normalizarEstadoContrato(contrato.estado) === 'Ejecutado') {
      return res.status(400).json({ message: 'El contrato está ejecutado; no puede agregar jornadas.' });
    }

    const body = req.body || {};
    const fecha = fechaCalendarioParaGuardar(body.fechaProgramacion);
    if (!fecha) return res.status(400).json({ message: 'Fecha de programación inválida' });

    let indiceEnDia = parseInt(body.indiceEnDia, 10);
    if (!Number.isFinite(indiceEnDia) || indiceEnDia < 1) {
      indiceEnDia = await siguienteIndiceEnDia(contrato._id, fecha);
    }

    const dup = await JornadaCap.findOne({
      idContrato: contrato._id,
      fechaProgramacion: fecha,
      indiceEnDia,
    }).lean();
    if (dup) {
      return res.status(400).json({
        message: `Ya existe una jornada del contrato en esa fecha (turno ${indiceEnDia}).`,
      });
    }

    const direccion = String(body.direccion ?? contrato.direccion ?? '').trim();
    if (!direccion) {
      return res.status(400).json({ message: 'La dirección es obligatoria.' });
    }

    const userLogin = auditoriaUsuario(req);
    const prevCount = await JornadaCap.countDocuments({ idContrato: contrato._id });
    const metaJornadas = Math.max(0, parseInt(contrato.numerojornadas, 10) || 0);
    const numeObjePre = calcNumeObjeJornada(
      contrato.numeroAlumnos,
      metaJornadas > 0 ? metaJornadas : prevCount + 1,
    );

    const jornada = await JornadaCap.create({
      idContrato: contrato._id,
      fechaProgramacion: fecha,
      indiceEnDia,
      municipio: String(body.municipio || '').trim(),
      depto: String(body.depto || '').trim(),
      codMunicipio: String(body.codMunicipio || '').trim(),
      direccion,
      lat: parseCoord(body.lat),
      lng: parseCoord(body.lng),
      deteGeorefe: parseDeteGeorefe(body.deteGeorefe) ?? '',
      supervisor: String(body.supervisor ?? contrato.supervisor ?? '').trim(),
      numeObjeJornada: numeObjePre,
      estado: estadoJornadaPorFecha(fecha),
      userAddReg: userLogin,
    });

    let clasesCreadas = 0;
    const generarClases = body.generarClases !== false;
    if (generarClases) {
      const refreshed = await Contratacion.findById(contrato._id).lean();
      const meta = Math.max(0, parseInt(refreshed?.clasesPorJornada, 10) || 0);
      if (meta > 0) {
        const r = await generarClasesFaltantesJornada(
          jornada.toObject ? jornada.toObject() : jornada,
          refreshed,
          userLogin,
        );
        clasesCreadas = r.creadas;
      }
    }

    const contratoSync = await syncContadoresContrato(contrato._id);
    const synced = await sincronizarEstadoJornada(jornada);

    res.status(201).json({
      jornada: synced,
      clasesCreadas,
      contrato: resumenContratoSync(contratoSync),
    });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

/** Jornadas de un día (p. ej. operación en carpa). */
const {
  statsOperacionJornadas,
  evaluarMetaAlumnosJornada,
} = require('../services/metaAlumnosJornada');

exports.jornadasDelDia = async (req, res, next) => {
  try {
    const base = req.query.fecha ? parseFechaCalendario(req.query.fecha) : parseFechaCalendario(new Date());
    if (!base) return res.status(400).json({ message: 'Fecha inválida' });
    const start = new Date(base.getTime());
    const end = new Date(base.getTime());
    end.setHours(23, 59, 59, 999);
    const q = { fechaProgramacion: { $gte: start, $lte: end } };
    if (req.query.idContrato) q.idContrato = req.query.idContrato;
    const rows = await JornadaCap.find(q).sort({ fechaProgramacion: 1, indiceEnDia: 1 }).lean();
    const synced = await sincronizarEstadosJornadas(rows);
    const jornadaIds = synced.map((j) => j._id).filter(Boolean);
    const { clasesPorJornada, alumnosPorJornada } = await statsOperacionJornadas(jornadaIds);
    const out = [];
    for (const j of synced) {
      const c = await Contratacion.findById(j.idContrato).lean();
      const jid = String(j._id);
      const totalClases = clasesPorJornada.get(jid) || 0;
      const alumnosLleva = alumnosPorJornada.get(jid)?.size || 0;
      const metaAlumnos = Math.max(0, parseInt(j.numeObjeJornada, 10) || 0);
      const metaAlcanzada = metaAlumnos > 0 && alumnosLleva >= metaAlumnos;
      const metaSuperada = metaAlumnos > 0 && alumnosLleva > metaAlumnos;
      out.push({
        ...j,
        contratoLabel: c?.codContrato
          ? `${c.codContrato} — ${c?.nombreComercial || c?.razoSocial || ''}`
          : c?.nombreComercial || c?.razoSocial || '',
        codContrato: c?.codContrato || '',
        numSesCert: c?.numSesCert,
        totalClases,
        alumnosLleva,
        metaAlumnos,
        metaAlcanzada,
        metaSuperada,
      });
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
};

async function enrichJornadaConContrato(j) {
  const c = await Contratacion.findById(j.idContrato).lean();
  const cliente = String(c?.nombreComercial || c?.razoSocial || '').trim();
  return {
    ...j,
    contratoLabel: c?.codContrato
      ? `${c.codContrato} — ${cliente || 'Contrato'}`
      : cliente || '',
    codContrato: c?.codContrato || '',
    clienteNombre: cliente,
    numeroAlumnos: Math.max(0, parseInt(c?.numeroAlumnos, 10) || 0),
    numSesCert: c?.numSesCert,
  };
}

async function enrichJornadaEnProceso(j) {
  const c = await Contratacion.findById(j.idContrato).lean();
  const base = await enrichJornadaConContrato(j);
  const cumpl = await cumplimientoParaJornada(j, c);
  return { ...base, ...cumpl };
}

/** Todas las jornadas EN PROCESO hoy, solo contratos en ejecución. */
exports.jornadasEnProceso = async (_req, res, next) => {
  try {
    const rows = await JornadaCap.find({}).sort({ fechaProgramacion: 1, indiceEnDia: 1 }).lean();
    const synced = await sincronizarEstadosJornadas(rows);
    const enProceso = synced.filter((j) => j && j.estado === ESTADO_JORNADA_EN_PROCESO);
    const out = [];
    for (const j of enProceso) {
      const c = await Contratacion.findById(j.idContrato).select('estado').lean();
      if (!contratoEstaEnEjecucion(c?.estado)) continue;
      out.push(await enrichJornadaEnProceso(j));
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
};

exports.listarJornadas = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.idContrato) q.idContrato = req.query.idContrato;
    if (req.query.desde || req.query.hasta) {
      q.fechaProgramacion = {};
      if (req.query.desde) {
        const d = parseFechaCalendario(req.query.desde);
        if (d) q.fechaProgramacion.$gte = d;
      }
      if (req.query.hasta) {
        const h = parseFechaCalendario(req.query.hasta);
        if (h) {
          h.setHours(23, 59, 59, 999);
          q.fechaProgramacion.$lte = h;
        }
      }
    }
    if (req.query.creadoDesde) {
      const d = new Date(String(req.query.creadoDesde));
      if (!Number.isNaN(d.getTime())) q.createdAt = { $gte: d };
    }
    const rows = await JornadaCap.find(q).sort({ fechaProgramacion: 1, indiceEnDia: 1 }).lean();
    res.json(await sincronizarEstadosJornadas(rows));
  } catch (e) {
    next(e);
  }
};

exports.obtenerJornada = async (req, res, next) => {
  try {
    const j = await JornadaCap.findById(req.params.id).lean();
    if (!j) return res.status(404).json({ message: 'Jornada no encontrada' });
    const synced = await sincronizarEstadoJornada(j);
    res.json(await enrichJornadaConContrato(synced));
  } catch (e) {
    next(e);
  }
};

exports.resolverMunicipioGeoref = async (req, res, next) => {
  try {
    const lat = parseCoord(req.query.lat);
    const lng = parseCoord(req.query.lng);
    if (lat == null || lng == null) {
      return res.status(400).json({ message: 'lat y lng son obligatorios' });
    }
    const geo = await municipioPorCoords(lat, lng);
    res.json(geo);
  } catch (e) {
    next(e);
  }
};

exports.actualizarJornada = async (req, res, next) => {
  try {
    const actual = await JornadaCap.findById(req.params.id).lean();
    if (!actual) return res.status(404).json({ message: 'Jornada no encontrada' });

    const { supervisor, municipio, depto, codMunicipio, direccion, lat, lng, deteGeorefe, fechaProgramacion, estado } =
      req.body || {};
    const dto = { userChangeRecord: auditoriaUsuario(req) };
    if (supervisor != null) dto.supervisor = String(supervisor).trim();
    if (direccion != null) dto.direccion = String(direccion).trim();
    if (lat !== undefined) dto.lat = parseCoord(lat);
    if (lng !== undefined) dto.lng = parseCoord(lng);
    if (deteGeorefe !== undefined) dto.deteGeorefe = parseDeteGeorefe(deteGeorefe);
    if (municipio != null) dto.municipio = String(municipio).trim();
    if (depto != null) dto.depto = String(depto).trim();
    if (codMunicipio != null) dto.codMunicipio = String(codMunicipio).trim();

    if (estado != null && (await operacionFueraDeDiaActiva(req))) {
      const est = String(estado).trim().toUpperCase();
      if (!ESTADOS_JORNADA.includes(est)) {
        return res.status(400).json({ message: 'Estado de jornada inválido' });
      }
      dto.estado = est;
      dto.estadoOperacionManual = est === ESTADO_JORNADA_FINALIZADO;
    }

    if (fechaProgramacion != null && fechaProgramacion !== '') {
      const nuevaFecha = fechaCalendarioParaGuardar(fechaProgramacion);
      if (!nuevaFecha) {
        return res.status(400).json({ message: 'Fecha de programación inválida' });
      }
      const mismaFecha =
        fechaCalendarioIso(actual.fechaProgramacion) === fechaCalendarioIso(nuevaFecha);
      if (!mismaFecha) {
        const dup = await JornadaCap.findOne({
          idContrato: actual.idContrato,
          fechaProgramacion: nuevaFecha,
          indiceEnDia: actual.indiceEnDia || 1,
          _id: { $ne: actual._id },
        }).lean();
        if (dup) {
          return res.status(400).json({
            message: `Ya existe otra jornada del contrato en esa fecha (turno ${actual.indiceEnDia || 1}).`,
          });
        }
        dto.fechaProgramacion = nuevaFecha;
      }
    }

    const coordsEnviadas = lat !== undefined || lng !== undefined;
    if (coordsEnviadas) {
      if (dto.lat != null && dto.lng != null) {
        const georefActivo =
          dto.deteGeorefe === 'MAPA' || dto.deteGeorefe === 'DISPOSITIVO_MOVIL';
        const faltaUbicacion = !dto.municipio || !dto.depto;
        if (georefActivo && faltaUbicacion) {
          try {
            const geo = await municipioPorCoords(dto.lat, dto.lng);
            dto.municipio = geo.municipio || dto.municipio || '';
            dto.depto = geo.depto || dto.depto || '';
            if (geo.codMunicipio) dto.codMunicipio = geo.codMunicipio;
          } catch (err) {
            console.warn('[georef] No se pudo resolver municipio:', err.message);
          }
        }
      } else {
        dto.municipio = '';
        dto.depto = '';
        dto.codMunicipio = '';
        dto.deteGeorefe = '';
      }
    }

    const j = await JornadaCap.findByIdAndUpdate(req.params.id, { $set: dto }, { new: true }).lean();
    if (!j) return res.status(404).json({ message: 'Jornada no encontrada' });

    if (dto.fechaProgramacion) {
      await ClaseJornadaCap.updateMany(
        { idJornada: j._id },
        { $set: { fechaClase: parseFechaCalendario(dto.fechaProgramacion) } },
      );
    }

    res.json(await sincronizarEstadoJornada(j));
  } catch (e) {
    next(e);
  }
};

/** Cierra la jornada manualmente (modo operación especial). */
exports.cerrarJornadaOperacion = async (req, res, next) => {
  try {
    if (!(await operacionFueraDeDiaActiva(req))) {
      return res.status(403).json({
        message: 'Cerrar jornada manualmente requiere el modo operación fuera del día activo.',
      });
    }
    const j = await JornadaCap.findByIdAndUpdate(
      req.params.id,
      { $set: { estado: ESTADO_JORNADA_FINALIZADO, estadoOperacionManual: true, userChangeRecord: auditoriaUsuario(req) } },
      { new: true },
    ).lean();
    if (!j) return res.status(404).json({ message: 'Jornada no encontrada' });
    registrarAuditoria({
      req,
      accion: 'jornada_cerrar_operacion',
      entidad: 'jornadaCap',
      idEntidad: String(j._id),
      resumen: 'Jornada cerrada manualmente (modo operación especial)',
    }).catch(() => {});
    res.json(j);
  } catch (e) {
    next(e);
  }
};

/** Reabre la jornada al estado calculado por fecha (modo operación especial). */
exports.reabrirJornadaOperacion = async (req, res, next) => {
  try {
    if (!(await operacionFueraDeDiaActiva(req))) {
      return res.status(403).json({
        message: 'Reabrir jornada requiere el modo operación fuera del día activo.',
      });
    }
    const actual = await JornadaCap.findById(req.params.id).lean();
    if (!actual) return res.status(404).json({ message: 'Jornada no encontrada' });
    await JornadaCap.updateOne(
      { _id: actual._id },
      { $set: { estadoOperacionManual: false, userChangeRecord: auditoriaUsuario(req) } },
    );
    const j = await sincronizarEstadoJornada(actual._id);
    res.json(j);
  } catch (e) {
    next(e);
  }
};

exports.eliminarJornada = async (req, res, next) => {
  try {
    const jornada = await JornadaCap.findById(req.params.id).lean();
    if (!jornada) return res.status(404).json({ message: 'Jornada no encontrada' });

    const clases = await ClaseJornadaCap.find({ idJornada: jornada._id }).lean();
    for (const c of clases) {
      const nAsis = await AsisClasJorCap.countDocuments({ idclaseJornada: c._id });
      if (nAsis > 0) {
        return res.status(400).json({
          message: `No se puede eliminar: una clase de esta jornada tiene ${nAsis} asistencia(s)`,
        });
      }
    }

    await ClaseJornadaCap.deleteMany({ idJornada: jornada._id });
    await JornadaCap.deleteOne({ _id: jornada._id });

    const contratoSync = await syncContadoresContrato(jornada.idContrato);
    const restantes = contratoSync?.jornadasExistentes ?? 0;

    res.json({
      ok: true,
      message: 'Jornada eliminada',
      restantes,
      contrato: resumenContratoSync(contratoSync),
    });
  } catch (e) {
    next(e);
  }
};

exports.listarClases = async (req, res, next) => {
  try {
    const q = {};
    if (req.query.idJornada) q.idJornada = req.query.idJornada;
    if (req.query.idContrato) {
      const jornadaIds = await JornadaCap.find({ idContrato: req.query.idContrato }).distinct('_id');
      q.idJornada = { $in: jornadaIds };
    }
    if (req.query.creadoDesde) {
      const d = new Date(String(req.query.creadoDesde));
      if (!Number.isNaN(d.getTime())) q.createdAt = { $gte: d };
    }

    const { vacio } = await aplicarFiltroClasesQueryPorRol(q, req);
    if (vacio) return res.json([]);

    const rows = await ClaseJornadaCap.find(q)
      .sort({ fechaClase: 1, indiceClaseEnJornada: 1, createdAt: 1 })
      .lean();
    const out = [];
    for (const c of rows) {
      const j = await sincronizarEstadoJornada(c.idJornada);
      out.push({
        ...c,
        fechaJornada: j?.fechaProgramacion,
        jornadaEstado: j?.estado,
        idContrato: j?.idContrato,
        municipioJornada: j?.municipio,
      });
    }
    const enriched = await enriquecerClases(out);
    enriched.sort((a, b) => {
      const fa = a.fechaJornada || a.fechaClase;
      const fb = b.fechaJornada || b.fechaClase;
      const ta = fa ? new Date(fa).getTime() : 0;
      const tb = fb ? new Date(fb).getTime() : 0;
      if (ta !== tb) return ta - tb;
      const ia = a.indiceClaseEnJornada ?? Number.MAX_SAFE_INTEGER;
      const ib = b.indiceClaseEnJornada ?? Number.MAX_SAFE_INTEGER;
      if (ia !== ib) return ia - ib;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });
    res.json(enriched);
  } catch (e) {
    next(e);
  }
};

exports.obtenerClase = async (req, res, next) => {
  try {
    const q = { _id: req.params.id };
    const { vacio } = await aplicarFiltroClasesQueryPorRol(q, req);
    if (vacio) return res.status(404).json({ message: 'Clase no encontrada' });
    const clase = await ClaseJornadaCap.findOne(q).lean();
    if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });
    res.json(await dtoClaseConJornada(clase));
  } catch (e) {
    next(e);
  }
};

/** Clases del día calendario (por defecto hoy): PROGRAMADA, EN PROCESO y FINALIZADO. Admin/ver: todas; instructor: solo las suyas. */
exports.clasesDelDia = async (req, res, next) => {
  try {
    const base = req.query.fecha ? parseFechaCalendario(req.query.fecha) : parseFechaCalendario(new Date());
    if (!base) return res.status(400).json({ message: 'Fecha inválida' });
    const start = inicioDia(base);
    const end = new Date(start.getTime());
    end.setHours(23, 59, 59, 999);

    const q = {
      fechaClase: { $gte: start, $lte: end },
      estado: { $in: ['PROGRAMADA', 'EN PROCESO', 'FINALIZADO'] },
    };

    const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
    const esAdminJornadas = tieneAlguno(permisos, ['jornadas.gestionar']);
    const esInstructorOperar =
      !esAdminJornadas && tieneAlguno(permisos, ['jornadas.operar']);
    if (esInstructorOperar) {
      const { vacio } = await aplicarFiltroClasesQueryPorRol(q, req);
      if (vacio) return res.json([]);
    }

    const rows = await ClaseJornadaCap.find(q).sort({ horaInicio: 1, createdAt: 1 }).lean();
    const raw = [];
    for (const c of rows) {
      const j = await sincronizarEstadoJornada(c.idJornada);
      if (!j) continue;
      const contrato = j.idContrato
        ? await Contratacion.findById(j.idContrato)
            .select('codContrato estado nombreComercial razoSocial')
            .lean()
        : null;
      if (!contratoEstaEnEjecucion(contrato?.estado)) continue;
      const cliente = String(contrato?.nombreComercial || contrato?.razoSocial || '').trim();
      raw.push({
        ...c,
        fechaJornada: j.fechaProgramacion,
        jornadaEstado: j.estado,
        idContrato: j.idContrato,
        municipioJornada: j.municipio,
        direccionJornada: j.direccion,
        indiceEnDia: j.indiceEnDia,
        codContrato: contrato?.codContrato || '',
        contratoLabel: contrato?.codContrato
          ? `${contrato.codContrato} — ${cliente || 'Contrato'}`
          : cliente || '',
        clienteNombre: cliente,
      });
    }

    const enriched = await enriquecerClases(raw);
    enriched.sort((a, b) => {
      const prio = (est) => {
        if (est === 'EN PROCESO') return 0;
        if (est === 'PROGRAMADA') return 1;
        if (est === 'FINALIZADO') return 2;
        return 3;
      };
      const pa = prio(a.estado);
      const pb = prio(b.estado);
      if (pa !== pb) return pa - pb;
      const ha = a.horaInicio ? new Date(a.horaInicio).getTime() : 0;
      const hb = b.horaInicio ? new Date(b.horaInicio).getTime() : 0;
      return ha - hb;
    });
    res.json(enriched);
  } catch (e) {
    next(e);
  }
};

exports.listarInstructores = async (req, res, next) => {
  try {
    res.json(await listarInstructoresConUsuario());
  } catch (e) {
    next(e);
  }
};

exports.crearClase = async (req, res, next) => {
  try {
    const { idJornada, idPrograma, ubicacion, horarioManual, horaInicio, horaFin } = req.body || {};
    if (!idJornada) {
      return res.status(400).json({ message: 'idJornada es obligatorio' });
    }
    const jornada = await sincronizarEstadoJornada(idJornada);
    if (!jornada) return res.status(404).json({ message: 'Jornada no encontrada' });
    const bloqueo = await bloqueoCrearClaseJornada(req, jornada);
    if (bloqueo) return res.status(400).json({ message: bloqueo });
    const idProg = idPrograma != null && String(idPrograma).trim() !== '' ? String(idPrograma).trim() : '';
    if (idProg) {
      const prog = await buscarPrograma(idProg);
      if (!prog) return res.status(404).json({ message: 'Programa no encontrado' });
      if (!(await esProgramaJornadasCap(prog))) {
        return res.status(400).json({ message: 'El programa no es de Jornadas de Capacitación' });
      }
    }
    const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
    const esAdminJornadas = tieneAlguno(permisos, ['jornadas.gestionar']);
    const idEmpInsRaw = req.body?.idEmpleadoInstructor;
    const pid =
      idEmpInsRaw != null && String(idEmpInsRaw).trim() !== '' ? idEmpInsRaw : null;

    let instructor = {
      idinstructor: '',
      idEmpleadoInstructor: null,
      idUsuarioInstructor: '',
    };
    if (pid != null) {
      instructor = await resolverInstructorParaClase(req, req.body || {});
    } else if (!esAdminJornadas) {
      // Instructor operando: al crear manualmente queda asignado a sí mismo.
      instructor = await resolverInstructorParaClase(req, req.body || {});
    }

    const ubi = UBICACIONES_CLASE.includes(ubicacion) ? ubicacion : 'Carpa';
    const { resolverCarpaDesdePrograma } = require('../services/carpaJornada');
    let idCarpaClase = null;
    if (idProg) {
      const prog = await buscarPrograma(idProg);
      const carpa = await resolverCarpaDesdePrograma(prog);
      idCarpaClase = carpa.idCarpa;
    }
    const indiceClaseEnJornada = await siguienteIndiceClaseEnJornada(idJornada);
    const modoEspecial = await operacionFueraDeDiaActiva(req);
    const usaHorarioManual = !modoEspecial && horarioManual === true;
    const inicioManual =
      usaHorarioManual && horaInicio != null && String(horaInicio).trim() !== ''
        ? parseHoraClase(jornada.fechaProgramacion, horaInicio)
        : null;
    const finManual =
      usaHorarioManual && horaFin != null && String(horaFin).trim() !== ''
        ? parseHoraClase(jornada.fechaProgramacion, horaFin)
        : null;
    if (finManual && !inicioManual) {
      return res.status(400).json({ message: 'Indique la hora de inicio antes de la hora de fin.' });
    }
    if (inicioManual && finManual && finManual.getTime() <= inicioManual.getTime()) {
      return res.status(400).json({ message: 'La hora de fin debe ser posterior a la de inicio.' });
    }
    const clase = await ClaseJornadaCap.create({
      idJornada,
      fechaClase: inicioDia(jornada.fechaProgramacion),
      idPrograma: idProg,
      idCarpa: idCarpaClase,
      indiceClaseEnJornada,
      ubicacion: ubi,
      estado: 'PROGRAMADA',
      horaInicio: inicioManual,
      horaFin: finManual,
      horarioManual: usaHorarioManual,
      duracionSegundos:
        inicioManual && finManual
          ? Math.max(0, Math.round((finManual.getTime() - inicioManual.getTime()) / 1000))
          : null,
      idinstructor: instructor.idinstructor,
      idEmpleadoInstructor: instructor.idEmpleadoInstructor,
      idUsuarioInstructor: instructor.idUsuarioInstructor,
      userAddReg: auditoriaUsuario(req),
    });
    const contratoSync = await syncContadoresContrato(jornada.idContrato);
    const dto = await dtoClaseConJornada(clase);
    res.status(201).json({ ...dto, contrato: resumenContratoSync(contratoSync) });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

function parseHoraClase(fechaClase, horaStr) {
  const m = String(horaStr ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) {
    const err = new Error('Formato de hora inválido. Use HH:mm (ej. 08:30).');
    err.status = 400;
    throw err;
  }
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) {
    const err = new Error('Hora fuera de rango.');
    err.status = 400;
    throw err;
  }
  const base = fechaClase ? inicioDia(fechaClase) : inicioDia(new Date());
  base.setHours(h, min, 0, 0);
  return base;
}

exports.actualizarClase = async (req, res, next) => {
  try {
    const clase = await ClaseJornadaCap.findById(req.params.id);
    if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });

    const {
      idPrograma,
      ubicacion,
      idEmpleadoInstructor,
      horaInicio,
      horaFin,
      horarioManual,
      reabrir,
    } = req.body || {};
    const dto = { userChangeRecord: auditoriaUsuario(req) };
    const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
    const esAdminJornadas = tieneAlguno(permisos, ['jornadas.gestionar']);
    const esOperarJornadas = tieneAlguno(permisos, ['jornadas.operar']);
    const puedeEditarHorario = esAdminJornadas || esOperarJornadas;
    const modoEspecial = await operacionFueraDeDiaActiva(req);
    const usaHorarioManual =
      !modoEspecial &&
      (horarioManual !== undefined ? horarioManual === true : clase.horarioManual === true);
    if (!modoEspecial && horarioManual !== undefined && puedeEditarHorario) {
      dto.horarioManual = horarioManual === true;
    }

    // Reabrir clase cerrada por error (p. ej. horarios planificados guardados como finalizada).
    if (reabrir === true && (esAdminJornadas || esOperarJornadas)) {
      const nAsis = await AsisClasJorCap.countDocuments({ idclaseJornada: clase._id });
      if (nAsis > 0) {
        return res.status(400).json({
          message: 'No se puede reabrir la clase: ya tiene asistencias registradas.',
        });
      }
      dto.estado = 'PROGRAMADA';
      dto.duracionSegundos = null;
    }

    // Quien opera (instructor o admin) queda registrado en la clase si estaba libre.
    if (esOperarJornadas || esAdminJornadas) {
      await asegurarInstructorOperandoClase(clase, req);
    }

    if (ubicacion != null) {
      dto.ubicacion = UBICACIONES_CLASE.includes(ubicacion) ? ubicacion : clase.ubicacion;
    }

    if (idEmpleadoInstructor !== undefined && esAdminJornadas) {
      if (idEmpleadoInstructor === null || idEmpleadoInstructor === '') {
        dto.idinstructor = '';
        dto.idEmpleadoInstructor = null;
        dto.idUsuarioInstructor = '';
      } else {
        const instructor = await resolverInstructorParaClase(req, { idEmpleadoInstructor });
        dto.idinstructor = instructor.idinstructor;
        dto.idEmpleadoInstructor = instructor.idEmpleadoInstructor;
        dto.idUsuarioInstructor = instructor.idUsuarioInstructor;
      }
    }

    if (idPrograma != null) {
      const nuevo = String(idPrograma).trim();
      const actual = String(clase.idPrograma || '').trim();
      if (nuevo !== actual) {
        const nAsis = await AsisClasJorCap.countDocuments({ idclaseJornada: clase._id });
        if (nAsis > 0) {
          return res.status(400).json({
            message: 'No puede cambiar el programa: la clase ya tiene asistencias registradas',
          });
        }
        const { resolverCarpaDesdePrograma } = require('../services/carpaJornada');
        if (!nuevo) {
          dto.idPrograma = '';
          dto.idCarpa = null;
        } else {
          const prog = await buscarPrograma(idPrograma);
          if (!prog) return res.status(404).json({ message: 'Programa no encontrado' });
          if (!(await esProgramaJornadasCap(prog))) {
            return res.status(400).json({ message: 'El programa no es de Jornadas de Capacitación' });
          }
          dto.idPrograma = String(prog.idPrograma ?? prog._id ?? idPrograma);
          const carpa = await resolverCarpaDesdePrograma(prog);
          dto.idCarpa = carpa.idCarpa;
        }
      }
    }

    if (
      puedeEditarHorario &&
      (horaInicio !== undefined || horaFin !== undefined) &&
      (modoEspecial || usaHorarioManual)
    ) {
      const bloqueoHorario = await bloqueoOperacionJornada(
        req,
        await sincronizarEstadoJornada(clase.idJornada),
      );
      if (bloqueoHorario) return res.status(400).json({ message: bloqueoHorario });

      let fechaRef = clase.fechaClase;
      if (!fechaRef) {
        const j = await JornadaCap.findById(clase.idJornada).select('fechaProgramacion').lean();
        fechaRef = j?.fechaProgramacion ? inicioDia(j.fechaProgramacion) : null;
      }

      if (horaInicio !== undefined) {
        dto.horaInicio =
          horaInicio === null || String(horaInicio).trim() === ''
            ? null
            : parseHoraClase(fechaRef, horaInicio);
      }
      if (horaFin !== undefined) {
        dto.horaFin =
          horaFin === null || String(horaFin).trim() === ''
            ? null
            : parseHoraClase(fechaRef, horaFin);
      }

      const hi = dto.horaInicio !== undefined ? dto.horaInicio : clase.horaInicio;
      const hf = dto.horaFin !== undefined ? dto.horaFin : clase.horaFin;
      if (hf && !hi) {
        return res.status(400).json({ message: 'Indique la hora de inicio antes de la hora de fin.' });
      }
      if (hi && hf && hf.getTime() <= hi.getTime()) {
        return res.status(400).json({ message: 'La hora de fin debe ser posterior a la de inicio.' });
      }
      const estadoActual = String(clase.estado || '').toUpperCase();
      if (hi && hf) {
        dto.duracionSegundos = Math.max(0, Math.round((hf.getTime() - hi.getTime()) / 1000));
        if (!usaHorarioManual && (estadoActual === 'EN PROCESO' || estadoActual === 'FINALIZADO')) {
          dto.estado = 'FINALIZADO';
        } else if (modoEspecial && estadoActual === 'PROGRAMADA') {
          dto.estado = 'FINALIZADO';
        }
      } else if (hi && !hf) {
        dto.duracionSegundos = null;
        if (!usaHorarioManual && estadoActual !== 'FINALIZADO') dto.estado = 'EN PROCESO';
      } else if (!hi) {
        dto.duracionSegundos = null;
        if (!usaHorarioManual && dto.horaFin === null && estadoActual === 'FINALIZADO') {
          dto.estado = 'PROGRAMADA';
        }
      }
    } else if (
      !modoEspecial &&
      !usaHorarioManual &&
      (horaInicio !== undefined || horaFin !== undefined)
    ) {
      return res.status(400).json({
        message: 'Active el modo de horario manual para editar las horas de la clase.',
      });
    }

    const estadoAntes = String(clase.estado || '').toUpperCase();
    Object.assign(clase, dto);
    await clase.save();
    const estadoDespues = String(clase.estado || '').toUpperCase();
    const dtoResp = await dtoClaseConJornada(clase);

    if (estadoDespues === 'FINALIZADO' && estadoAntes !== 'FINALIZADO') {
      const post = await postCierreClaseJornada(req, clase);
      return res.json({
        ...dtoResp,
        idContrato: post.jornada?.idContrato,
        asistenciasRegistradas: post.asistenciasRegistradas || 0,
        certificadosGenerados: post.certificadosNuevos || 0,
        certificadosEmitidos: post.certificadosEmitidos || [],
        mensajeAsistencias:
          post.asistenciasRegistradas > 0
            ? `Se registró asistencia de ${post.asistenciasRegistradas} alumno(s) al cerrar la clase.`
            : null,
        message:
          post.certificadosNuevos > 0
            ? `Clase finalizada. Certificados emitidos: ${post.certificadosNuevos}.`
            : post.ok
              ? 'Clase finalizada.'
              : 'Clase finalizada. Hubo un aviso al emitir certificados o asistencias pendientes; revise la lista.',
        advertenciaPostCierre: post.ok ? undefined : post.error,
      });
    }

    res.json(dtoResp);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.eliminarClase = async (req, res, next) => {
  try {
    const clase = await ClaseJornadaCap.findById(req.params.id);
    if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });

    const certsVigentes = await Certificado.find({
      idClaseJornada: clase._id,
      estado: { $ne: 'anulado' },
    });
    let certificadosAnulados = 0;
    for (const cert of certsVigentes) {
      const antes = cert.toObject();
      cert.set(
        metadatosAnulacion(req, null, {
          motivo: 'Clase de jornada eliminada',
        }),
      );
      cert.estado = 'anulado';
      await cert.save();
      certificadosAnulados += 1;
      registrarEliminacion(req, 'certificado_jornada', antes, {
        resumen: `Anulación por eliminar clase ${clase._id} · cert ${antes.codigoCert || cert._id}`,
      });
    }

    const asistencias = await AsisClasJorCap.deleteMany({ idclaseJornada: clase._id });
    const inscritos = await InscripcionClase.deleteMany({ idClase: clase._id });
    if (clase.urlforo) {
      const fotoPath = upload.resolvePath(clase.urlforo);
      if (fotoPath && fs.existsSync(fotoPath)) {
        try {
          fs.unlinkSync(fotoPath);
        } catch (_) {
          /* ignore */
        }
      }
    }
    const jornada = await JornadaCap.findById(clase.idJornada).select('idContrato').lean();
    await ClaseJornadaCap.deleteOne({ _id: clase._id });
    const contratoSync = jornada?.idContrato
      ? await syncContadoresContrato(jornada.idContrato)
      : null;
    res.json({
      ok: true,
      message: 'Clase eliminada',
      asistenciasEliminadas: asistencias.deletedCount || 0,
      inscripcionesEliminadas: inscritos.deletedCount || 0,
      certificadosAnulados,
      contrato: resumenContratoSync(contratoSync),
    });
  } catch (e) {
    next(e);
  }
};

exports.iniciarClase = async (req, res, next) => {
  try {
    const clase = await ClaseJornadaCap.findById(req.params.id);
    if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });
    if (clase.estado === 'FINALIZADO') {
      return res.status(409).json({ message: 'La clase ya está finalizada.' });
    }
    if (clase.estado === 'EN PROCESO') {
      return res.status(409).json({ message: 'La clase ya está EN PROCESO.' });
    }
    const jornada = await sincronizarEstadoJornada(clase.idJornada);
    if (!jornada) return res.status(404).json({ message: 'Jornada no encontrada' });
    const bloqueo = await bloqueoIniciarClaseJornada(req, jornada);
    if (bloqueo) return res.status(400).json({ message: bloqueo });
    await asegurarInstructorOperandoClase(clase, req);
    const modoEspecial = await operacionFueraDeDiaActiva(req);
    const body = req.body || {};
    if (!modoEspecial && body.horarioManual !== undefined) {
      clase.horarioManual = body.horarioManual === true;
    }
    const conservarHorarioManual = !modoEspecial && clase.horarioManual === true;
    if (conservarHorarioManual) {
      if (body.horaInicio != null && String(body.horaInicio).trim() !== '') {
        clase.horaInicio = parseHoraClase(clase.fechaClase, body.horaInicio);
      }
      if (body.horaFin != null && String(body.horaFin).trim() !== '') {
        clase.horaFin = parseHoraClase(clase.fechaClase, body.horaFin);
      }
      if (clase.horaFin && !clase.horaInicio) {
        return res.status(400).json({ message: 'Indique la hora de inicio antes de la hora de fin.' });
      }
      if (clase.horaInicio && clase.horaFin && clase.horaFin.getTime() <= clase.horaInicio.getTime()) {
        return res.status(400).json({ message: 'La hora de fin debe ser posterior a la de inicio.' });
      }
      clase.duracionSegundos =
        clase.horaInicio && clase.horaFin
          ? Math.max(0, Math.round((clase.horaFin.getTime() - clase.horaInicio.getTime()) / 1000))
          : null;
    } else {
      clase.horaInicio = new Date();
      clase.horaFin = null;
      clase.duracionSegundos = null;
    }
    clase.estado = 'EN PROCESO';
    clase.userChangeRecord = auditoriaUsuario(req);
    await ClaseJornadaCap.updateOne(
      { _id: clase._id },
      {
        $set: {
          estado: 'EN PROCESO',
          horaInicio: clase.horaInicio,
          horaFin: clase.horaFin,
          horarioManual: clase.horarioManual === true,
          duracionSegundos: clase.duracionSegundos,
          idEmpleadoInstructor: clase.idEmpleadoInstructor ?? null,
          idUsuarioInstructor: String(clase.idUsuarioInstructor || '').trim(),
          idinstructor: String(clase.idinstructor || '').trim(),
          userChangeRecord: clase.userChangeRecord,
        },
      },
    );
    const iniciada = await ClaseJornadaCap.findById(clase._id);
    res.json(await dtoClaseConJornada(iniciada || clase));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

exports.finalizarClase = async (req, res, next) => {
  try {
    const clase = await ClaseJornadaCap.findById(req.params.id);
    if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });
    if (clase.estado === 'FINALIZADO') {
      const post = await postCierreClaseJornada(req, clase);
      return res.json({
        clase: await dtoClaseConJornada(clase),
        idContrato: post.jornada?.idContrato,
        asistenciasRegistradas: post.asistenciasRegistradas || 0,
        certificadosGenerados: post.certificadosNuevos || 0,
        certificadosEmitidos: post.certificadosEmitidos || [],
        reproceso: true,
        message:
          post.certificadosNuevos > 0
            ? `Certificados emitidos: ${post.certificadosNuevos}.`
            : post.ok
              ? 'La clase ya estaba finalizada. No había certificados pendientes.'
              : 'La clase ya estaba finalizada. Hubo un aviso al emitir certificados; revise la lista.',
        advertenciaPostCierre: post.ok ? undefined : post.error,
      });
    }

    await asegurarInstructorOperandoClase(clase, req);

    const jornada = await sincronizarEstadoJornada(clase.idJornada);
    if (!jornada) return res.status(404).json({ message: 'Jornada no encontrada' });
    const bloqueoFin = await bloqueoOperacionJornada(req, jornada);
    if (bloqueoFin) return res.status(400).json({ message: bloqueoFin });

    const body = req.body || {};
    let fechaRef = clase.fechaClase;
    if (!fechaRef) {
      const jRef = await JornadaCap.findById(clase.idJornada).select('fechaProgramacion').lean();
      fechaRef = jRef?.fechaProgramacion ? inicioDia(jRef.fechaProgramacion) : inicioDia(new Date());
    }

    const modoEspecial = await operacionFueraDeDiaActiva(req);
    if (!modoEspecial && body.horarioManual !== undefined) {
      clase.horarioManual = body.horarioManual === true;
    }
    const horarioManualNormal = !modoEspecial && clase.horarioManual === true;

    // Horas manuales (HH:mm). En modo manual o especial no se reemplazan por "ahora".
    if (
      (modoEspecial || horarioManualNormal) &&
      body.horaInicio != null &&
      String(body.horaInicio).trim() !== ''
    ) {
      clase.horaInicio = parseHoraClase(fechaRef, body.horaInicio);
    }
    if (
      (modoEspecial || horarioManualNormal) &&
      body.horaFin != null &&
      String(body.horaFin).trim() !== ''
    ) {
      clase.horaFin = parseHoraClase(fechaRef, body.horaFin);
    } else if ((modoEspecial || horarioManualNormal) && clase.horaFin) {
      // Conservar hora de fin planificada o guardada.
    } else if (modoEspecial || horarioManualNormal) {
      return res.status(400).json({
        message: 'Indique y guarde la hora de fin antes de finalizar la clase.',
      });
    } else {
      clase.horaFin = new Date();
    }

    if (!clase.horaInicio) {
      return res.status(400).json({
        message: 'Indique la hora de inicio (o pulse Iniciar) antes de finalizar la clase.',
      });
    }
    if (clase.horaFin.getTime() <= clase.horaInicio.getTime()) {
      return res.status(400).json({ message: 'La hora de fin debe ser posterior a la de inicio.' });
    }

    clase.duracionSegundos = Math.max(
      0,
      Math.round((clase.horaFin.getTime() - clase.horaInicio.getTime()) / 1000),
    );
    clase.estado = 'FINALIZADO';
    clase.userChangeRecord = auditoriaUsuario(req);
    // Forzar persistencia de instructor + cierre en un solo update.
    await ClaseJornadaCap.updateOne(
      { _id: clase._id },
      {
        $set: {
          estado: 'FINALIZADO',
          horaInicio: clase.horaInicio,
          horaFin: clase.horaFin,
          horarioManual: clase.horarioManual === true,
          duracionSegundos: clase.duracionSegundos,
          idEmpleadoInstructor: clase.idEmpleadoInstructor ?? null,
          idUsuarioInstructor: String(clase.idUsuarioInstructor || '').trim(),
          idinstructor: String(clase.idinstructor || '').trim(),
          userChangeRecord: clase.userChangeRecord,
        },
      },
    );
    const claseFinal = await ClaseJornadaCap.findById(clase._id);
    if (!claseFinal) return res.status(404).json({ message: 'Clase no encontrada' });

    const post = await postCierreClaseJornada(req, claseFinal);
    if (post.ok) {
      res.json({
        clase: await dtoClaseConJornada(claseFinal),
        idContrato: post.jornada?.idContrato,
        asistenciasRegistradas: post.asistenciasRegistradas || 0,
        certificadosGenerados: post.certificadosNuevos || 0,
        certificadosEmitidos: post.certificadosEmitidos || [],
        mensajeAsistencias:
          post.asistenciasRegistradas > 0
            ? `Se registró asistencia de ${post.asistenciasRegistradas} alumno(s) al finalizar la clase.`
            : null,
        message:
          post.certificadosNuevos > 0
            ? `Clase finalizada. Certificados emitidos: ${post.certificadosNuevos}.`
            : 'Clase finalizada.',
      });
    } else {
      console.error('[finalizarClase] post-cierre:', post.error);
      res.json({
        clase: await dtoClaseConJornada(claseFinal),
        idContrato: post.jornada?.idContrato,
        asistenciasRegistradas: post.asistenciasRegistradas || 0,
        certificadosGenerados: post.certificadosNuevos || 0,
        certificadosEmitidos: post.certificadosEmitidos || [],
        message:
          'Clase finalizada. Hubo un aviso al emitir certificados o asistencias pendientes; revise la lista.',
        advertenciaPostCierre: post.error,
      });
    }
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

/** Registra asistencia de todos los inscritos pendientes (clases ya finalizadas). */
exports.sincronizarAsistenciasInscritos = async (req, res, next) => {
  try {
    const clase = await ClaseJornadaCap.findById(req.params.id);
    if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });

    const syncAsis = await registrarAsistenciasInscritosPendientes(req, clase, {
      omitirValidacionJornada: true,
      omitirValidacionEstadoClase: true,
      omitirCertificado: true,
    });

    let certificadosEmitidos = syncAsis.certificadosEmitidos || [];
    if (String(clase.estado || '').toUpperCase() === 'FINALIZADO') {
      const jornada = await JornadaCap.findById(clase.idJornada).lean();
      const ctxCert = jornada?.idContrato
        ? await crearContextoCertificadoContrato(jornada.idContrato)
        : null;
      const certs = await emitirCertificadosAsistentesClase(req, clase, { jornada, ctxCert });
      certificadosEmitidos = fusionarCertificadosEmitidos(
        syncAsis.certificadosEmitidos,
        certs.certificadosEmitidos,
      );
    }
    const certificadosNuevos = certificadosEmitidos.length;

    res.json({
      ...syncAsis,
      certificadosNuevos,
      certificadosEmitidos,
      message:
        syncAsis.registradas > 0 || certificadosNuevos > 0
          ? `Asistencia registrada para ${syncAsis.registradas} alumno(s). Certificados nuevos: ${certificadosNuevos}.`
          : syncAsis.omitidosCertificados > 0
            ? 'Todos los inscritos pendientes ya tienen certificado vigente en el contrato o asistencia registrada.'
            : String(clase.estado || '').toUpperCase() === 'FINALIZADO'
              ? 'No había certificados pendientes por emitir.'
              : 'No había inscritos pendientes de asistencia.',
    });
  } catch (e) {
    next(e);
  }
};

/** Sube foto de evidencia a uploads/evidenciascap/{codContrato}/fotos/ y guarda urlforo. */
exports.subirFotoEvidenciaClase = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Debe enviar una imagen (campo foto)' });
    const clase = req.claseEvidencia;
    if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });

    const rel = path.relative(upload.baseDir, req.file.path).replace(/\\/g, '/');
    const prev = clase.urlforo;
    if (prev && prev !== rel) {
      const prevPath = upload.resolvePath(prev);
      if (prevPath && fs.existsSync(prevPath)) {
        try {
          fs.unlinkSync(prevPath);
        } catch (_) {
          /* ignore */
        }
      }
    }

    clase.urlforo = rel;
    clase.userChangeRecord = auditoriaUsuario(req);
    await clase.save();
    res.json(await dtoClaseConJornada(clase));
  } catch (e) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {
        /* ignore */
      }
    }
    next(e);
  }
};

exports.registrarAsistencia = async (req, res, next) => {
  try {
    const { numDoc: numDocRaw } = req.body || {};
    const claseDoc = await ClaseJornadaCap.findById(req.params.id);
    if (!claseDoc) return res.status(404).json({ message: 'Clase no encontrada' });
    await asegurarInstructorOperandoClase(claseDoc, req);
    await ClaseJornadaCap.updateOne(
      { _id: claseDoc._id },
      {
        $set: {
          idEmpleadoInstructor: claseDoc.idEmpleadoInstructor ?? null,
          idUsuarioInstructor: String(claseDoc.idUsuarioInstructor || '').trim(),
          idinstructor: String(claseDoc.idinstructor || '').trim(),
        },
      },
    );
    const clase = (await ClaseJornadaCap.findById(claseDoc._id).lean()) || claseDoc.toObject();

    const jornada = await sincronizarEstadoJornada(clase.idJornada);
    const ctxCert = jornada?.idContrato
      ? await crearContextoCertificadoContrato(jornada.idContrato)
      : null;
    const payload = await registrarAsistenciaAlumnoEnClase(req, clase, numDocRaw, {
      jornada,
      ctxCert,
      omitirCertificado: true,
    });

    const metaJornada = await evaluarMetaAlumnosJornada(jornada);

    if (payload.duplicada) {
      return res.status(409).json({
        message: 'El alumno ya tiene asistencia registrada en esta clase',
        ...payload,
        metaJornada,
      });
    }

    let message = `Asistencia registrada (${payload.sesiones}/${payload.numSesCert} sesiones del contrato)`;
    if (payload.motivoCertificado === 'diferido_al_finalizar') {
      message = `${message}. El certificado se evaluará al finalizar la clase.`;
    } else if (payload.certificadoGenerado) {
      message = payload.mensajeCertificado || 'Certificado emitido automáticamente.';
    } else if (payload.cumplioSesiones && payload.motivoCertificado === 'ya_certificado') {
      message = 'Asistencia registrada. El alumno ya tiene certificado para este contrato.';
    } else if (payload.motivoCertificado && MOTIVOS_CERT[payload.motivoCertificado]) {
      message = `${message}. Certificado: ${MOTIVOS_CERT[payload.motivoCertificado]}`;
    }
    if (metaJornada.metaAlcanzada && metaJornada.mensaje) {
      message = `${message}. ${metaJornada.mensaje}`;
    }

    res.status(201).json({ ...payload, message, metaJornada });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

/** Borra la asistencia de un alumno en una clase. Instructor: solo EN PROCESO. Admin: siempre. */
exports.eliminarAsistenciaAlumno = async (req, res, next) => {
  try {
    const numDoc = parseNumDoc(req.params.numDoc);
    if (numDoc == null) return res.status(400).json({ message: 'numDoc inválido' });

    const clase = await ClaseJornadaCap.findById(req.params.id).lean();
    if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });

    const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
    const esAdminJornadas = tieneAlguno(permisos, ['jornadas.gestionar']);
    if (!esAdminJornadas) {
      if (clase.estado === 'FINALIZADO') {
        return res.status(400).json({
          message: 'La clase ya está finalizada. Solo un administrador puede borrar asistencias.',
        });
      }
      if (clase.estado !== 'EN PROCESO') {
        return res.status(400).json({
          message: 'Solo puede borrar asistencias cuando la clase está EN PROCESO.',
        });
      }
    }

    const eliminado = await AsisClasJorCap.findOneAndDelete({
      idclaseJornada: clase._id,
      numDocAlumno: numDoc,
    });
    if (!eliminado) {
      return res.status(404).json({ message: 'El alumno no tenía asistencia registrada en esta clase.' });
    }

    res.json({ ok: true, numDoc });
  } catch (e) {
    next(e);
  }
};

/** Quita la inscripción de un alumno en una clase (no afecta la matrícula al programa). */
exports.quitarInscripcionClase = async (req, res, next) => {
  try {
    const numDoc = parseNumDoc(req.params.numDoc);
    if (numDoc == null) return res.status(400).json({ message: 'numDoc inválido' });

    const clase = await ClaseJornadaCap.findById(req.params.id).lean();
    if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });

    const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
    const esAdminJornadas = tieneAlguno(permisos, ['jornadas.gestionar']);
    if (clase.estado === 'FINALIZADO' && !esAdminJornadas) {
      return res.status(400).json({
        message: 'La clase ya está finalizada. Solo un administrador puede quitar alumnos.',
      });
    }

    const asistenciaEliminada = await AsisClasJorCap.findOneAndDelete({
      idclaseJornada: clase._id,
      numDocAlumno: numDoc,
    });

    const eliminado = await InscripcionClase.findOneAndDelete({
      idClase: clase._id,
      numDoc,
    });
    if (!eliminado) {
      return res.status(404).json({ message: 'El alumno no estaba inscrito en esta clase.' });
    }

    res.json({ ok: true, numDoc, asistenciaEliminada: !!asistenciaEliminada });
  } catch (e) {
    next(e);
  }
};

/** HTML imprimible del listado de asistencia de la clase. */
exports.htmlListadoAsistenciaClase = async (req, res, next) => {
  try {
    const { buildHtmlListadoAsistenciaClase } = require('../services/listadoAsistenciaClaseHtml');
    const html = await buildHtmlListadoAsistenciaClase(req.params.id, req.idSede);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

/** Alumnos matriculados al programa de la clase, con bandera de asistencia en ella. */
exports.inscritosClase = async (req, res, next) => {
  try {
    const clase = await ClaseJornadaCap.findById(req.params.id).lean();
    if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });

    const jornada = await JornadaCap.findById(clase.idJornada).lean();
    const inscripciones = await InscripcionClase.find({ idClase: clase._id })
      .sort({ createdAt: 1 })
      .lean();
    const docs = inscripciones
      .map((i) => Number(i.numDoc))
      .filter((n) => Number.isFinite(n));
    const alumnos = docs.length
      ? await DatosAlumno.find({ numDoc: { $in: docs } }).lean()
      : [];
    const mapAlu = new Map(alumnos.map((a) => [Number(a.numDoc), a]));
    const asistencias = await AsisClasJorCap.find({ idclaseJornada: clase._id }).lean();
    const mapAsis = new Map(asistencias.map((a) => [Number(a.numDocAlumno), a]));
    let mapCert = new Map();
    if (jornada?.idContrato && docs.length) {
      const certs = await Certificado.find({
        numDoc: { $in: docs },
        idContrato: jornada.idContrato,
        estado: { $ne: 'anulado' },
      }).lean();
      mapCert = new Map(certs.map((c) => [Number(c.numDoc), c]));
    }
    const out = inscripciones.map((ins) => {
      const nd = Number(ins.numDoc);
      const al = mapAlu.get(nd);
      const asis = mapAsis.get(nd);
      const cert = mapCert.get(nd);
      return {
        numDoc: nd,
        nombreCompleto: al
          ? [al.nombre1, al.nombre2, al.apellido1, al.apellido2].filter(Boolean).join(' ')
          : '',
        tieneAsistencia: !!asis,
        asistenciaAt: asis?.createdAt || null,
        fechaInscripcion: ins.createdAt,
        yaCertificadoContrato: !!cert,
        certificadoCodigo: cert?.codigoCert || null,
        certificadoId: cert?._id ? String(cert._id) : null,
      };
    });
    res.json(out);
  } catch (e) {
    next(e);
  }
};

/**
 * Orden de clases dentro de una jornada para «clase anterior».
 * Si hay índices duplicados o todos son 1 (clases manuales en modo especial), prioriza createdAt.
 */
function ordenarClasesMismaJornada(todas) {
  if (!todas?.length) return [];
  const indices = todas.map((c) => {
    const n = Number(c.indiceClaseEnJornada);
    return Number.isFinite(n) && n > 0 ? n : null;
  });
  const definidos = indices.filter((n) => n != null);
  const hayDup = definidos.length > 0 && new Set(definidos).size < definidos.length;
  const todosUno = definidos.length > 0 && definidos.every((n) => n === 1);
  const usarCreacion = hayDup || todosUno || definidos.length === 0;

  return [...todas].sort((a, b) => {
    if (usarCreacion) {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      if (ta !== tb) return ta - tb;
    }
    const ia = a.indiceClaseEnJornada ?? Number.MAX_SAFE_INTEGER;
    const ib = b.indiceClaseEnJornada ?? Number.MAX_SAFE_INTEGER;
    if (ia !== ib) return ia - ib;
    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
  });
}

async function siguienteIndiceClaseEnJornada(idJornada) {
  const rows = await ClaseJornadaCap.find({ idJornada }).select('indiceClaseEnJornada').lean();
  let max = 0;
  for (const r of rows) {
    const n = Number(r.indiceClaseEnJornada);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

/**
 * Construye respuesta de alumnos de una clase fuente para copiar a la clase destino.
 */
async function construirAlumnosDesdeClaseFuente(claseDestino, claseFuente) {
  const [inscripcionesFuente, inscripcionesActual] = await Promise.all([
    InscripcionClase.find({ idClase: claseFuente._id }).sort({ createdAt: 1 }).lean(),
    InscripcionClase.find({ idClase: claseDestino._id }).lean(),
  ]);
  const yaEnEstaClase = new Set(
    inscripcionesActual.map((i) => Number(i.numDoc)).filter((n) => Number.isFinite(n)),
  );
  const docs = inscripcionesFuente
    .map((i) => Number(i.numDoc))
    .filter((n) => Number.isFinite(n));
  const alumnos = docs.length ? await DatosAlumno.find({ numDoc: { $in: docs } }).lean() : [];
  const mapAlu = new Map(alumnos.map((a) => [Number(a.numDoc), a]));

  const jornadaDestino = await JornadaCap.findById(claseDestino.idJornada).lean();
  let mapCert = new Map();
  if (jornadaDestino?.idContrato && docs.length) {
    const certs = await Certificado.find({
      numDoc: { $in: docs },
      idContrato: jornadaDestino.idContrato,
      estado: { $ne: 'anulado' },
    }).lean();
    mapCert = new Map(certs.map((c) => [Number(c.numDoc), c]));
  }

  const [claseFuenteInfo] = await enriquecerClases([claseFuente]);
  const jornadaFuente = await JornadaCap.findById(claseFuente.idJornada).lean();

  const contrato = jornadaDestino?.idContrato
    ? await Contratacion.findById(jornadaDestino.idContrato).select('tipoCertificado').lean()
    : null;
  const tipoNorm = String(contrato?.tipoCertificado || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
  const esPorClase = tipoNorm === TIPO_CERTIFICADO_POR_CLASE || tipoNorm === 'porclase';

  const alumnosOut = await Promise.all(
    inscripcionesFuente.map(async (ins) => {
      const nd = Number(ins.numDoc);
      const al = mapAlu.get(nd);
      const cert = mapCert.get(nd);
      // Certificado global del contrato no impide matricular en otras clases.
      // En por_clase solo se bloquea si ya tiene certificado de ESTA clase destino.
      let puedeMatricular = !yaEnEstaClase.has(nd);
      if (puedeMatricular && esPorClase && jornadaDestino?.idContrato) {
        const certEstaClase = await certificadoExistenteClase(nd, claseDestino._id);
        if (certEstaClase) puedeMatricular = false;
      }
      return {
        numDoc: nd,
        nombreCompleto: al
          ? [al.nombre1, al.nombre2, al.apellido1, al.apellido2].filter(Boolean).join(' ')
          : '',
        yaInscritoEnEstaClase: yaEnEstaClase.has(nd),
        yaCertificadoContrato: !!cert,
        puedeMatricular,
        certificadoCodigo: cert?.codigoCert || null,
      };
    }),
  );

  return {
    clase: {
      _id: String(claseFuente._id),
      indiceClaseEnJornada: claseFuente.indiceClaseEnJornada ?? null,
      programaNombre: claseFuenteInfo?.programaNombre || '',
      carpaNombre: claseFuenteInfo?.carpaNombre || '',
      estado: claseFuente.estado,
      fechaClase: claseFuente.fechaClase || jornadaFuente?.fechaProgramacion || null,
      fechaJornada: jornadaFuente?.fechaProgramacion || null,
    },
    alumnos: alumnosOut,
  };
}

/**
 * Alumnos de otra clase para copiar matrícula a la clase actual.
 * - Sin query: clase inmediatamente anterior de la misma jornada (auto).
 * - Con `?idClaseFuente=`: clase elegida manualmente (mismo contrato).
 */
exports.alumnosClaseAnterior = async (req, res, next) => {
  try {
    const clase = await ClaseJornadaCap.findById(req.params.id).lean();
    if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });

    const idFuente = String(req.query.idClaseFuente || '').trim();
    let fuente = null;

    if (idFuente) {
      if (idFuente === String(clase._id)) {
        return res.status(400).json({ message: 'Seleccione una clase distinta a la actual.' });
      }
      fuente = await ClaseJornadaCap.findById(idFuente).lean();
      if (!fuente) return res.status(404).json({ message: 'Clase fuente no encontrada' });

      const [jorDest, jorFuente] = await Promise.all([
        JornadaCap.findById(clase.idJornada).select('idContrato').lean(),
        JornadaCap.findById(fuente.idJornada).select('idContrato').lean(),
      ]);
      const idCDest = jorDest?.idContrato ? String(jorDest.idContrato) : '';
      const idCFuente = jorFuente?.idContrato ? String(jorFuente.idContrato) : '';
      if (!idCDest || !idCFuente || idCDest !== idCFuente) {
        return res.status(400).json({
          message: 'La clase elegida debe pertenecer al mismo contrato.',
        });
      }
    } else {
      const todas = ordenarClasesMismaJornada(
        await ClaseJornadaCap.find({ idJornada: clase.idJornada }).lean(),
      );
      const pos = todas.findIndex((c) => String(c._id) === String(clase._id));
      fuente = pos > 0 ? todas[pos - 1] : null;
      if (!fuente) {
        return res.json({ clase: null, alumnos: [] });
      }
    }

    res.json(await construirAlumnosDesdeClaseFuente(clase, fuente));
  } catch (e) {
    next(e);
  }
};

exports.listarAsistenciasClase = async (req, res, next) => {
  try {
    const rows = await AsisClasJorCap.find({ idclaseJornada: req.params.id })
      .sort({ createdAt: -1 })
      .lean();
    const out = [];
    for (const a of rows) {
      const al = await DatosAlumno.findOne(numDocQuery(a.numDocAlumno)).lean();
      out.push({
        ...a,
        nombreCompleto: al
          ? [al.nombre1, al.nombre2, al.apellido1, al.apellido2].filter(Boolean).join(' ')
          : '',
      });
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
};

exports.certificadosGenerados = async (req, res, next) => {
  try {
    const {
      buildQueryCertificadosJornada,
    } = require('../services/certificadosJornadaZip');
    const { q, error } = buildQueryCertificadosJornada(req.query || {});
    if (error) return res.status(400).json({ message: error });
    const rows = await Certificado.find(q).sort({ createdAt: -1, fechaEmision: -1 }).limit(800).lean();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');

    const qRaw = String(req.query.q || '').trim();

    const jornadaIds = [...new Set(rows.map((c) => String(c.idJornada || '')).filter(Boolean))];
    const contratoIds = new Set(rows.map((c) => String(c.idContrato || '')).filter(Boolean));

    const jornadas = jornadaIds.length
      ? await JornadaCap.find({ _id: { $in: jornadaIds } }).select('municipio direccion idContrato').lean()
      : [];
    for (const j of jornadas) {
      if (j.idContrato) contratoIds.add(String(j.idContrato));
    }

    const numDocs = [...new Set(rows.map((c) => c.numDoc).filter((n) => n != null))];

    const [contratos, alumnosRows] = await Promise.all([
      contratoIds.size
        ? Contratacion.find({ _id: { $in: [...contratoIds] } }).select('codContrato').lean()
        : [],
      numDocs.length ? DatosAlumno.find({ numDoc: { $in: numDocs } }).lean() : [],
    ]);

    const jornById = new Map(jornadas.map((j) => [String(j._id), j]));
    const contrById = new Map(contratos.map((c) => [String(c._id), c]));
    const alByDoc = new Map(alumnosRows.map((a) => [a.numDoc, a]));

    const out = [];
    for (const c of rows) {
      const al = alByDoc.get(c.numDoc);
      const nombreCompleto = al
        ? [al.nombre1, al.nombre2, al.apellido1, al.apellido2].filter(Boolean).join(' ')
        : '';
      const jornada = c.idJornada ? jornById.get(String(c.idJornada)) : null;
      const idContrato = c.idContrato || jornada?.idContrato;
      const codContrato = (contrById.get(String(idContrato || ''))?.codContrato || '').trim();
      const municipio = (jornada?.municipio || '').trim();
      const direccion = (jornada?.direccion || '').trim();
      const ubicacionJornada =
        municipio && direccion ? `${municipio} — ${direccion}` : municipio || direccion || '';

      if (qRaw) {
        const hay =
          (al && coincideBusquedaAlumno(al, qRaw)) ||
          coincideBusquedaTexto(nombreCompleto, qRaw) ||
          coincideBusquedaTexto(String(c.encabezado || ''), qRaw) ||
          coincideBusquedaTexto(String(c.codigoCert || ''), qRaw) ||
          coincideBusquedaDocumento(c.numDoc, qRaw) ||
          coincideBusquedaTexto(codContrato, qRaw) ||
          coincideBusquedaTexto(municipio, qRaw) ||
          coincideBusquedaTexto(direccion, qRaw) ||
          coincideBusquedaTexto(ubicacionJornada, qRaw);
        if (!hay) continue;
      }
      out.push({
        ...c,
        nombreCompleto,
        municipio,
        direccion,
        ubicacionJornada,
        codContrato,
        idContrato: idContrato || null,
        idClase: c.idClaseJornada || null,
      });
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
};

/** ZIP con PDFs (sincrónico; compatibilidad). */
exports.exportarCertificadosJornadaZip = async (req, res, next) => {
  try {
    const {
      buildQueryCertificadosJornada,
      streamZipCertificadosJornada,
    } = require('../services/certificadosJornadaZip');
    const { q, error } = buildQueryCertificadosJornada(req.query || {});
    if (error) return res.status(400).json({ message: error });
    const rows = await Certificado.find(q).sort({ fechaEmision: 1, codigoCert: 1 }).lean();
    await streamZipCertificadosJornada(req, res, rows);
  } catch (e) {
    if (e.status && !res.headersSent) {
      return res.status(e.status).json({ message: e.message });
    }
    next(e);
  }
};

/** Inicia generación asíncrona del ZIP con progreso. */
exports.iniciarExportZipCertificadosJob = async (req, res, next) => {
  try {
    const {
      buildQueryCertificadosJornada,
      startZipJob,
      progressSnapshot,
      getZipJob,
    } = require('../services/certificadosJornadaZip');
    const { publicOriginFromReq } = require('../utils/publicOrigin');
    const filtros = { ...(req.body || {}), ...(req.query || {}) };
    const { q, error } = buildQueryCertificadosJornada(filtros);
    if (error) return res.status(400).json({ message: error });
    const rows = await Certificado.find(q).sort({ fechaEmision: 1, codigoCert: 1 }).lean();
    if (!rows.length) {
      return res.status(404).json({ message: 'No hay certificados con los filtros indicados.' });
    }
    const { jobId } = startZipJob({
      rows,
      publicOrigin: publicOriginFromReq(req),
      filtros,
      ownerSub: req.user?.sub || null,
    });
    const job = getZipJob(jobId, req.user?.sub);
    res.status(202).json(progressSnapshot(job));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

/** Estado / progreso de un job ZIP. */
exports.progresoExportZipCertificadosJob = async (req, res, next) => {
  try {
    const { getZipJob, progressSnapshot } = require('../services/certificadosJornadaZip');
    const job = getZipJob(req.params.jobId, req.user?.sub);
    if (!job) return res.status(404).json({ message: 'Job no encontrado o expirado' });
    res.json(progressSnapshot(job));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

/** Descarga el ZIP cuando el job está listo. */
exports.descargarExportZipCertificadosJob = async (req, res, next) => {
  try {
    const fs = require('fs');
    const { takeZipDownload } = require('../services/certificadosJornadaZip');
    const meta = takeZipDownload(req.params.jobId, req.user?.sub);
    if (!meta) return res.status(404).json({ message: 'Job no encontrado o expirado' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${meta.filename}"`);
    const stream = fs.createReadStream(meta.filePath);
    stream.on('close', () => {
      fs.promises.unlink(meta.filePath).catch(() => {});
    });
    stream.on('error', (e) => {
      fs.promises.unlink(meta.filePath).catch(() => {});
      if (!res.headersSent) {
        res.status(500).json({ message: e.message || 'Error al enviar ZIP' });
      } else {
        res.destroy(e);
      }
    });
    stream.pipe(res);
  } catch (e) {
    if (e.status && !res.headersSent) {
      return res.status(e.status).json({ message: e.message });
    }
    next(e);
  }
};

const CAMPOS_CERT_JORNADA_EDIT = [
  'tipoCertificado',
  'numActa',
  'numFolio',
  'numRunt',
  'observaciones',
  'encabezado',
  'codVerificacion',
  'fechaEmision',
  'fechaVencimiento',
];

function pickCertificadoJornadaEdit(body) {
  const dto = {};
  for (const k of CAMPOS_CERT_JORNADA_EDIT) {
    if (body[k] !== undefined) dto[k] = body[k];
  }
  if (dto.numActa !== undefined) dto.numActa = String(dto.numActa || '').trim();
  if (dto.numFolio !== undefined) dto.numFolio = String(dto.numFolio || '').trim();
  if (dto.numRunt !== undefined) dto.numRunt = String(dto.numRunt || '').trim();
  if (dto.observaciones !== undefined) dto.observaciones = String(dto.observaciones || '').trim();
  if (dto.encabezado !== undefined) dto.encabezado = String(dto.encabezado || '').trim();
  if (dto.codVerificacion !== undefined) {
    dto.codVerificacion = String(dto.codVerificacion || '').trim() || null;
  }
  if (dto.tipoCertificado !== undefined) {
    dto.tipoCertificado = normalizarTipoRegularJornada(dto.tipoCertificado);
  }
  if (dto.fechaEmision !== undefined) {
    if (!dto.fechaEmision) return { error: 'fechaEmision inválida' };
    const d = parseFechaCalendario(dto.fechaEmision);
    if (!d) return { error: 'fechaEmision inválida' };
    dto.fechaEmision = d;
  }
  if (dto.fechaVencimiento !== undefined) {
    if (dto.fechaVencimiento === null || dto.fechaVencimiento === '') {
      dto.fechaVencimiento = null;
    } else {
      const d = parseFechaCalendario(dto.fechaVencimiento);
      if (!d) return { error: 'fechaVencimiento inválida' };
      dto.fechaVencimiento = d;
    }
  }
  return { dto };
}

exports.actualizarCertificadoGenerado = async (req, res, next) => {
  try {
    const existente = await Certificado.findById(req.params.id).lean();
    if (!existente) return res.status(404).json({ message: 'Certificado no encontrado' });
    if (!existente.generadoAutoJornada) {
      return res.status(403).json({ message: 'Solo aplica a certificados generados por jornadas.' });
    }
    if (esComprobanteAnulado(existente)) {
      return res.status(409).json({ message: 'Este certificado ya está anulado.' });
    }

    const picked = pickCertificadoJornadaEdit(req.body || {});
    if (picked.error) return res.status(400).json({ message: picked.error });
    if (!Object.keys(picked.dto).length) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    if (picked.dto.codVerificacion) {
      const dup = await Certificado.countDocuments({
        codVerificacion: picked.dto.codVerificacion,
        _id: { $ne: req.params.id },
      });
      if (dup > 0) {
        return res.status(409).json({ message: 'Ya existe otro certificado con ese código de verificación.' });
      }
    }

    const cert = await Certificado.findByIdAndUpdate(
      req.params.id,
      { $set: picked.dto },
      { new: true, runValidators: true },
    );
    if (!cert) return res.status(404).json({ message: 'Certificado no encontrado' });

    const prog = await buscarPrograma(cert.idProg);
    res.json({
      ...cert.toObject(),
      programaDescr: prog?.descripcion || prog?.nombreProg || prog?.nomCert || null,
      nomCert: prog?.nomCert || null,
      tipoFormatoCertLabel: TIPOS_LABEL[cert.tipoFormatoCert] || cert.tipoFormatoCert || null,
      tipoCertificado: cert.tipoCertificado,
    });
  } catch (e) {
    next(e);
  }
};

exports.eliminarCertificadoGenerado = async (req, res, next) => {
  try {
    const c = await Certificado.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Certificado no encontrado' });
    if (!c.generadoAutoJornada) {
      return res.status(403).json({ message: 'Solo aplica a certificados generados por jornadas.' });
    }
    if (esComprobanteAnulado(c)) {
      return res.status(409).json({ message: 'Este certificado ya está anulado.' });
    }

    const auth = await autorizarAnulacionSimple(
      req,
      'Anular certificados requiere autorización de un administrador.',
    );
    if (!auth.ok) {
      return res.status(auth.status).json({ message: auth.message, code: auth.code });
    }

    const antes = c.toObject();
    const motivo = String(req.body?.motivo || req.body?.motivoAnulacion || '').trim() || null;
    c.set(metadatosAnulacion(req, auth.supervisor, { motivo }));
    c.estado = 'anulado';
    await c.save();

    registrarEliminacion(req, 'certificado_jornada', antes, {
      resumen: `Anulación certificado jornada ${antes.codigoCert || req.params.id}${sufijoAutoriza(auth.supervisor)}`,
    });
    res.json({ ok: true, estado: 'anulado' });
  } catch (e) {
    next(e);
  }
};

exports.progresoAlumnoContrato = async (req, res, next) => {
  try {
    const numDoc = parseNumDoc(req.params.numDoc);
    const { idContrato } = req.query || {};
    if (numDoc == null || !idContrato) {
      return res.status(400).json({ message: 'numDoc e idContrato son obligatorios' });
    }
    const progreso = await progresoCertificacion(numDoc, idContrato);
    res.json(progreso);
  } catch (e) {
    next(e);
  }
};

exports.buscarAlumnoDoc = async (req, res, next) => {
  try {
    const numDoc = parseNumDoc(req.params.numDoc);
    if (numDoc == null) return res.status(400).json({ message: 'numDoc inválido' });
    const al = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();
    if (!al) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json({
      ...al,
      tipoAlumno: normalizarTipoRegularJornada(al.tipoAlumno),
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Alta rápida de alumno tipo «Jornadas de Capacitación» (permiso jornadas.operar).
 * Pensado para la app móvil en carpa: PDF417 / digitación sin exigir alumnos.gestionar.
 */
exports.crearAlumnoJornadaCap = async (req, res, next) => {
  try {
    const body = req.body || {};
    const numDoc = parseNumDoc(body.numDoc);
    if (numDoc == null) {
      return res.status(400).json({ message: 'Documento inválido (6 a 14 dígitos)' });
    }
    const nombre1 = String(body.nombre1 || '')
      .trim()
      .toUpperCase();
    const apellido1 = String(body.apellido1 || '')
      .trim()
      .toUpperCase();
    if (!nombre1 || !apellido1) {
      return res.status(400).json({ message: 'Primer nombre y primer apellido son obligatorios' });
    }

    const existe = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();
    if (existe) {
      return res.status(409).json({
        message: 'Ya existe un alumno con ese documento',
        codigo: 'alumno_duplicado',
        alumno: {
          _id: String(existe._id),
          numDoc: existe.numDoc,
          nombre1: existe.nombre1,
          nombre2: existe.nombre2,
          apellido1: existe.apellido1,
          apellido2: existe.apellido2,
          tipoAlumno: normalizarTipoRegularJornada(existe.tipoAlumno),
        },
      });
    }

    const upper = (v) => {
      const s = String(v || '').trim();
      return s ? s.toUpperCase() : '';
    };
    const now = new Date();
    const userAdd = auditoriaUsuario(req) || 'sistema';
    const dto = {
      tipoAlumno: TIPO_JORNADAS_CAPACITACION,
      tipoDoc: String(body.tipoDoc || '1').trim() || '1',
      numDoc,
      nombre1,
      apellido1,
      nombre2: upper(body.nombre2) || undefined,
      apellido2: upper(body.apellido2) || undefined,
      genero: (() => {
        const g = upper(body.genero);
        return g === 'M' || g === 'F' ? g : undefined;
      })(),
      tipoSangre: (() => {
        const t = upper(body.tipoSangre).replace(/\s+/g, '');
        return /^(AB|A|B|O)[+-]$/.test(t) ? t : undefined;
      })(),
      jornada: String(body.jornada || '').trim() || undefined,
      estadoCivil: String(body.estadoCivil || '').trim() || undefined,
      estrato: String(body.estrato || '').trim() || undefined,
      regimenSalud: String(body.regimenSalud || '').trim() || undefined,
      nivelFormacion: String(body.nivelFormacion || '').trim() || undefined,
      ocupacion: String(body.ocupacion || '').trim() || undefined,
      discapacidad: String(body.discapacidad || '9').trim() || '9',
      multiCulturalidad: String(body.multiCulturalidad || 'NO_APLICA').trim() || 'NO_APLICA',
      observaciones: String(body.observaciones || '').trim() || undefined,
      expedida: String(body.expedida || '').trim() || undefined,
      correo: String(body.correo || '').trim().toLowerCase() || undefined,
      celular: String(body.celular || '').trim() || undefined,
      direccion: String(body.direccion || '').trim() || undefined,
      munOrigen: String(body.munOrigen || body.codMunicipio || '').trim() || undefined,
      codMunicipio: String(body.codMunicipio || body.munOrigen || '').trim() || undefined,
      fechaReg: now,
      fechaAudi: now,
      fechaMod: now,
      userAddReg: userAdd,
    };
    if (body.fechaNac) {
      const fn = new Date(body.fechaNac);
      if (!Number.isNaN(fn.getTime())) dto.fechaNac = fn;
    }

    let a;
    try {
      a = await DatosAlumno.create(dto);
    } catch (err) {
      if (err?.code === 11000) {
        const dup = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();
        if (dup) {
          return res.status(409).json({
            message: 'Ya existe un alumno con ese documento',
            codigo: 'alumno_duplicado',
            alumno: {
              _id: String(dup._id),
              numDoc: dup.numDoc,
              nombre1: dup.nombre1,
              apellido1: dup.apellido1,
              tipoAlumno: normalizarTipoRegularJornada(dup.tipoAlumno),
            },
          });
        }
      }
      throw err;
    }

    const lean = a.toObject ? a.toObject() : a;
    res.status(201).json({
      ...lean,
      _id: String(lean._id),
      tipoAlumno: TIPO_JORNADAS_CAPACITACION,
      nombreCompleto: [lean.nombre1, lean.nombre2, lean.apellido1, lean.apellido2]
        .filter(Boolean)
        .join(' '),
    });
  } catch (e) {
    next(e);
  }
};

/** Búsqueda ligera de alumnos (nombre o cédula) para operadores de jornada. */
exports.buscarAlumnos = async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 30);
    const filter = {};
    if (q) {
      Object.assign(filter, filtroBusquedaAlumno(q));
    }
    const docs = await DatosAlumno.find(filter)
      .sort({ apellido1: 1, nombre1: 1 })
      .limit(limit)
      .lean();
    res.json(
      docs.map((al) => ({
        _id: String(al._id),
        numDoc: al.numDoc,
        tipoDoc: al.tipoDoc,
        nombre1: al.nombre1,
        nombre2: al.nombre2,
        apellido1: al.apellido1,
        apellido2: al.apellido2,
        nombreCompleto: [al.nombre1, al.nombre2, al.apellido1, al.apellido2].filter(Boolean).join(' '),
      })),
    );
  } catch (e) {
    next(e);
  }
};

/** Matrícula al programa de jornada (permiso jornadas.operar). */
exports.matricularAlumnoJornada = async (req, res, next) => {
  try {
    const { numDoc, idPrograma, idProg, idClase, idContrato } = req.body || {};
    const progId = idPrograma || idProg;
    const prog = await buscarPrograma(progId);
    if (!prog) return res.status(404).json({ message: 'Programa no encontrado' });
    if (!(await esProgramaJornadasCap(prog))) {
      return res.status(400).json({ message: 'El programa no es de Jornadas de Capacitación' });
    }
    const nd = parseNumDoc(numDoc);
    if (nd == null) return res.status(400).json({ message: 'numDoc inválido' });
    const alumno = await DatosAlumno.findOne(numDocQuery(nd)).lean();
    if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });
    const userLogin = auditoriaUsuario(req);
    await asegurarTipoAlumnoJornada(nd);
    const idProgramaVal = String(prog.idPrograma ?? prog._id);

    let matriculaResult = null;
    let empresaAsignada = null;
    const ya = await Matricula.findOne({ numDoc: nd, idProg: idProgramaVal, estado: /^activo$/i }).lean();
    if (!ya) {
      matriculaResult = await crearMatriculaDesdeBody({ numDoc: nd, idPrograma: idProgramaVal });
    } else {
      matriculaResult = { matricula: ya, yaExistia: true };
    }

    let inscripcion = null;
    let inscripcionDuplicada = false;
    let metaJornada = null;
    if (idClase) {
      const claseDoc = await ClaseJornadaCap.findById(idClase);
      if (!claseDoc) return res.status(404).json({ message: 'Clase no encontrada' });
      await asegurarInstructorOperandoClase(claseDoc, req);
      await ClaseJornadaCap.updateOne(
        { _id: claseDoc._id },
        {
          $set: {
            idEmpleadoInstructor: claseDoc.idEmpleadoInstructor ?? null,
            idUsuarioInstructor: String(claseDoc.idUsuarioInstructor || '').trim(),
            idinstructor: String(claseDoc.idinstructor || '').trim(),
          },
        },
      );
      const clase =
        (await ClaseJornadaCap.findById(claseDoc._id).lean()) ||
        (claseDoc.toObject ? claseDoc.toObject() : claseDoc);
      let idClaseProg = String(clase.idPrograma || '').trim();
      if (!idClaseProg) {
        // El operador suele elegir el programa en el modal y agregar alumnos sin pulsar «Guardar».
        await ClaseJornadaCap.updateOne(
          { _id: claseDoc._id },
          {
            $set: {
              idPrograma: idProgramaVal,
              ...(Number.isFinite(Number(prog.horas)) && Number(prog.horas) > 0
                ? { horasCertificadas: Number(prog.horas) }
                : {}),
            },
          },
        );
        idClaseProg = idProgramaVal;
      }
      // Comparar por programa resuelto (idPrograma numérico o _id), no solo string crudo.
      const progClase = await buscarPrograma(idClaseProg);
      const idClaseCanon = progClase
        ? String(progClase.idPrograma ?? progClase._id)
        : idClaseProg;
      if (idClaseCanon !== idProgramaVal) {
        return res.status(400).json({
          message:
            'La clase tiene otro programa. Guarde el programa elegido en la clase e intente de nuevo.',
        });
      }
      const jornada = await JornadaCap.findById(clase.idJornada).lean();
      if (!jornada) return res.status(404).json({ message: 'Jornada no encontrada' });
      const bloqueoMat = await bloqueoOperacionJornada(req, jornada);
      if (bloqueoMat) return res.status(400).json({ message: bloqueoMat });
      if (jornada?.idContrato) {
        empresaAsignada = await asignarEmpresaContratoAlumno(
          nd,
          jornada.idContrato,
          userLogin,
        );
      }
      try {
        inscripcion = await InscripcionClase.create({
          idClase: clase._id,
          numDoc: nd,
          userAddReg: auditoriaUsuario(req),
        });
      } catch (e) {
        if (e.code === 11000) {
          inscripcionDuplicada = true;
          inscripcion = await InscripcionClase.findOne({
            idClase: clase._id,
            numDoc: nd,
          }).lean();
        } else {
          throw e;
        }
      }
      metaJornada = await evaluarMetaAlumnosJornada(jornada || clase.idJornada);
    } else if (idContrato) {
      empresaAsignada = await asignarEmpresaContratoAlumno(nd, idContrato, userLogin);
    }

    res.status(201).json({
      ...matriculaResult,
      inscripcion,
      inscripcionDuplicada,
      metaJornada,
      empresaAsignada,
    });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
};

/** Programas tipo Jornadas de Capacitación (sin vínculo a contratación). */
exports.programasJornadaCap = async (_req, res, next) => {
  try {
    const { models: cat } = require('../models/catalogos');
    const rows = await cat.programas.find({}).lean();
    const out = [];
    for (const p of rows) {
      if (await esProgramaJornadasCap(p)) out.push(p);
    }
    res.json(out);
  } catch (e) {
    next(e);
  }
};

/** Informes de alumnos / certificados de jornadas (JSON para pantalla). */
exports.informesJornada = async (req, res, next) => {
  try {
    const { generarInformesJornada } = require('../services/informesJornadaCap');
    const data = await generarInformesJornada(req.query || {});
    res.json(data);
  } catch (e) {
    next(e);
  }
};

/** Exporta informes de jornadas a Excel (una o varias hojas). */
exports.exportarInformesJornada = async (req, res, next) => {
  try {
    const { exportarInformesJornadaExcel } = require('../services/informesJornadaCap');
    const tipo = String(req.query?.tipo || 'completo');
    const { buffer, nombre } = await exportarInformesJornadaExcel(req.query || {}, tipo);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.send(buffer);
  } catch (e) {
    next(e);
  }
};

exports.obtenerConfigOperacionJornadas = async (req, res, next) => {
  try {
    res.json(await obtenerConfigJornadasOperacion());
  } catch (e) {
    next(e);
  }
};

exports.estadoOperacionEspecialJornadas = async (req, res, next) => {
  try {
    res.json(await estadoOperacionEspecialJornadas(req));
  } catch (e) {
    next(e);
  }
};

exports.actualizarConfigOperacionJornadas = async (req, res, next) => {
  try {
    const permisos = req.permisos || (await permisosParaRol(req.user?.rol));
    if (!tieneAlguno(permisos, ['jornadas.gestionar'])) {
      return res.status(403).json({ message: 'Requiere permiso jornadas.gestionar' });
    }
    const antes = await obtenerConfigJornadasOperacion();
    const body = req.body || {};
    if (body.idServCapacitacionContrato !== undefined) {
      await validarServicioCapacitacionContrato(body.idServCapacitacionContrato);
    }
    const cfg = await actualizarConfigJornadasOperacion(body);
    const partes = [];
    if (cfg.operacionFueraDeDiaHabilitada !== antes.operacionFueraDeDiaHabilitada) {
      partes.push(
        `Operación fuera del día ${cfg.operacionFueraDeDiaHabilitada ? 'habilitada' : 'deshabilitada'}`,
      );
    }
    if (cfg.mostrarSwitchHorarioManual !== antes.mostrarSwitchHorarioManual) {
      partes.push(
        `Selector de horario manual ${cfg.mostrarSwitchHorarioManual ? 'visible' : 'oculto'}`,
      );
    }
    if (cfg.idServCapacitacionContrato !== antes.idServCapacitacionContrato) {
      partes.push(`Servicio contrato idServ ${cfg.idServCapacitacionContrato}`);
    }
    registrarAuditoria({
      req,
      accion: 'jornadas_operacion_config',
      entidad: 'jornadas',
      resumen: partes.length ? partes.join('; ') : 'Configuración jornadas actualizada',
      datosAntes: antes,
      datosDespues: cfg,
    }).catch(() => {});
    res.json(cfg);
  } catch (e) {
    next(e);
  }
};

exports.estadoCobroContrato = async (req, res, next) => {
  try {
    res.json(await estadoCobroContrato(req.params.id));
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message, code: e.code });
    next(e);
  }
};

exports.generarCuentaCobroContrato = async (req, res, next) => {
  try {
    const r = await generarCuentaCobroContrato(req.params.id, req);
    res.status(201).json(r);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message, code: e.code });
    next(e);
  }
};

exports.htmlCuentaCobroContrato = async (req, res, next) => {
  try {
    const html = await htmlCuentaCobroContrato(req.params.id, req.idSede);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message, code: e.code });
    next(e);
  }
};

exports.generarComprobanteIngresoContrato = async (req, res, next) => {
  try {
    const r = await generarComprobanteIngresoContrato(req.params.id, req.body || {}, req);
    res.status(201).json(r);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message, code: e.code });
    next(e);
  }
};
