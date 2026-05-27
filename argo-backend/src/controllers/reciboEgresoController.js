const QRCode = require('qrcode');
const Egreso = require('../models/Egreso');
const Empleado = require('../models/Empleado');
const Vehiculo = require('../models/Vehiculo');
const { obtenerConfigRecibo, siguienteNumComprobanteEgreso } = require('../services/configRecibo');
const { numeroDocumentoQuery, nombreCompletoEmpleado } = require('../utils/empleadoDoc');
const { normalizarPlaca } = require('../constants/vehiculo');
const { models: cat } = require('../models/catalogos');
const {
  esc,
  fmtMoney,
  fmtFecha,
  lineaHtml,
  bloqueEmpresaHtml,
  estilosRecibo,
} = require('../services/reciboHtmlShared');

function num(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
  return Number(v) || 0;
}

async function resolverTipoEgreso(tipoEgreso) {
  if (!tipoEgreso) return null;
  const n = Number(tipoEgreso);
  return cat.tipoEgreso
    .findOne({
      $or: [
        { idTipoEgreso: tipoEgreso },
        ...(Number.isFinite(n) ? [{ idTipoEgreso: n }] : []),
        { tipo: new RegExp(String(tipoEgreso).trim(), 'i') },
      ],
    })
    .lean();
}

async function resolverCuentaOrigen(cuentaOrigen) {
  if (!cuentaOrigen) return null;
  const n = Number(cuentaOrigen);
  return cat.cuentasBancarias
    .findOne({
      $or: [
        { idCuentaBancaria: cuentaOrigen },
        ...(Number.isFinite(n) ? [{ idCuentaBancaria: n }] : []),
      ],
    })
    .lean();
}

async function resolverBancoDestino(bancoDestino) {
  if (!bancoDestino) return null;
  const n = Number(bancoDestino);
  return cat.bancos
    .findOne({
      $or: [
        { idBanco: bancoDestino },
        { idbanco: bancoDestino },
        ...(Number.isFinite(n) ? [{ idBanco: n }, { idbanco: n }] : []),
      ],
    })
    .lean();
}

async function enriquecerEgreso(raw) {
  const e = raw;
  const tipo = await resolverTipoEgreso(e.tipoEgreso);
  const cuenta = await resolverCuentaOrigen(e.cuentaOrigen);
  const banco = await resolverBancoDestino(e.bancoDestino);
  let emp = null;
  if (e.numeroDocumento) {
    const q = numeroDocumentoQuery(e.numeroDocumento);
    emp = q ? await Empleado.findOne(q).lean() : null;
  }
  const veh = e.placa ? await Vehiculo.findOne({ placa: normalizarPlaca(e.placa) }).lean() : null;
  return {
    idEgreso: String(e._id),
    numRecibo: e.numRecibo || null,
    fechaEgreso: e.fechaEgreso,
    valorEgreso: num(e.valorEgreso),
    pagueA: e.pagueA || nombreCompletoEmpleado(emp) || null,
    numeroDocumento: e.numeroDocumento ?? null,
    empleadoNombre: nombreCompletoEmpleado(emp),
    empleadoCargo: emp?.cargoNombre || null,
    concepto: e.concepto,
    tipoEgresoDescr: tipo?.tipo || null,
    placa: e.placa || null,
    vehiculoMarca: veh?.nombreMarca || null,
    vehiculoLinea: veh?.nombreLinea || null,
    vehiculoClase: veh?.claseVehiculo || null,
    formaPago: e.formaPago || null,
    numTransferencia: e.numTransferencia || null,
    fechaTransferencia: e.fechaTransferencia || null,
    cuentaOrigenDescr: cuenta ? `${cuenta.banco || ''} ${cuenta.numCuenta || ''}`.trim() : null,
    cuentaDestino: e.cuentaDestino || null,
    bancoDestinoDescr: banco?.banco || banco?.descripcion || banco?.nombre || null,
    urlSoporte: e.urlSoporte || null,
    anticipoNomina: e.anticipoNomina || null,
    idPeriodo: e.idPeriodo ?? null,
    userAddReg: e.userAddReg,
    autorizadoPor: e.autorizadoPor || null,
    nombreAutoriza: e.nombreAutoriza || null,
    autorizadoEn: e.autorizadoEn || null,
  };
}

async function ensureNumRecibo(egresoDoc) {
  if (egresoDoc.numRecibo) return egresoDoc.numRecibo;
  const num = await siguienteNumComprobanteEgreso();
  await Egreso.updateOne({ _id: egresoDoc._id }, { $set: { numRecibo: num } });
  return num;
}

async function armarReciboEgreso(id) {
  const eg = await Egreso.findById(id).lean();
  if (!eg) return null;

  const config = await obtenerConfigRecibo();
  const egreso = await enriquecerEgreso(eg);
  const numeroRecibo = await ensureNumRecibo(eg);
  egreso.numRecibo = numeroRecibo;

  const prefEg = (config.prefijoComprobanteEgreso || 'CE').trim();
  const numeroComprobante = numeroRecibo || `${prefEg}-${String(eg._id).slice(-8).toUpperCase()}`;

  const qrTexto = JSON.stringify({
    comprobante: numeroComprobante,
    egresoId: String(eg._id),
    beneficiario: egreso.pagueA,
    documento: egreso.numeroDocumento,
    valor: egreso.valorEgreso,
    fecha: egreso.fechaEgreso || eg.fechaAudi,
    nit: config.nit || '',
  });

  let qrDataUrl = null;
  if (config.mostrarQr !== false) {
    try {
      qrDataUrl = await QRCode.toDataURL(qrTexto, { width: 140, margin: 1, errorCorrectionLevel: 'M' });
    } catch {
      qrDataUrl = null;
    }
  }

  const tituloEgreso =
    (config.mensajeEncabezadoEgreso || 'COMPROBANTE DE EGRESO').trim() || 'COMPROBANTE DE EGRESO';
  const pieEgreso =
    config.mensajePieEgreso ||
    config.mensajePie ||
    'Constancia de pago. El beneficiario debe firmar o adjuntar factura/voucher como soporte.';

  return {
    config: { ...config, mensajeEncabezadoEgreso: tituloEgreso, mensajePieEgreso: pieEgreso },
    egreso,
    numeroRecibo: numeroComprobante,
    qrDataUrl,
    qrTexto,
  };
}

exports.datos = async (req, res, next) => {
  try {
    const data = await armarReciboEgreso(req.params.id);
    if (!data) return res.status(404).json({ message: 'Egreso no encontrado' });
    res.json(data);
  } catch (e) {
    next(e);
  }
};

exports.html = async (req, res, next) => {
  try {
    const data = await armarReciboEgreso(req.params.id);
    if (!data) return res.status(404).send('Egreso no encontrado');

    const { config, egreso, numeroRecibo, qrDataUrl } = data;
    const mm = config.anchoReciboMm || 80;
    const w = Math.round(mm * 3.78);
    const titulo = esc(config.mensajeEncabezadoEgreso || 'COMPROBANTE DE EGRESO');
    const slogan = (config.slogan1 || '').toString().trim();

    const filas = [
      ['Comprobante N°', numeroRecibo],
      ['Fecha pago', fmtFecha(egreso.fechaEgreso)],
      ['Pagado a', egreso.pagueA || '—'],
      ...(egreso.numeroDocumento ? [['Documento', egreso.numeroDocumento]] : []),
      ...(egreso.empleadoCargo ? [['Cargo', egreso.empleadoCargo]] : []),
      ...(egreso.tipoEgresoDescr ? [['Tipo egreso', egreso.tipoEgresoDescr]] : []),
      ...(egreso.placa ? [['Placa vehículo', egreso.placa]] : []),
      ...(egreso.vehiculoMarca || egreso.vehiculoLinea
        ? [['Vehículo', `${egreso.vehiculoMarca || ''} ${egreso.vehiculoLinea || ''}`.trim()]]
        : []),
      ['Concepto', egreso.concepto],
      ...(egreso.formaPago ? [['Forma pago', egreso.formaPago]] : []),
      ...(egreso.cuentaOrigenDescr ? [['Cuenta origen', egreso.cuentaOrigenDescr]] : []),
      ...(egreso.numTransferencia ? [['Ref / Voucher', egreso.numTransferencia]] : []),
      ...(egreso.fechaTransferencia ? [['Fecha transfer.', egreso.fechaTransferencia]] : []),
      ...(egreso.cuentaDestino ? [['Cuenta destino', egreso.cuentaDestino]] : []),
      ...(egreso.bancoDestinoDescr ? [['Banco destino', egreso.bancoDestinoDescr]] : []),
      ...(egreso.urlSoporte ? [['Soporte digital', 'Adjunto en sistema']] : []),
      ...(egreso.anticipoNomina
        ? [['Nómina', `Deducción (${egreso.anticipoNomina}) período ${egreso.idPeriodo || '—'}`]]
        : []),
      ...(egreso.nombreAutoriza || egreso.autorizadoPor
        ? [
            [
              'Autorizó',
              egreso.nombreAutoriza
                ? `${egreso.nombreAutoriza} (${egreso.autorizadoPor})`
                : egreso.autorizadoPor,
            ],
          ]
        : []),
      ...(egreso.autorizadoEn ? [['Fecha autorización', fmtFecha(egreso.autorizadoEn)]] : []),
      ...(egreso.userAddReg ? [['Registró', egreso.userAddReg]] : []),
    ];

    const bodyRows = filas
      .map(([k, v]) => `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`)
      .join('');

    const beneficiario = esc(egreso.pagueA || 'Beneficiario');
    const docBenef = esc(egreso.numeroDocumento || '________________');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Egreso ${esc(numeroRecibo)}</title>
  <style>${estilosRecibo(mm, w)}</style>
</head>
<body>
  ${bloqueEmpresaHtml(config)}
  ${lineaHtml(32)}
  <div class="center titulo">${titulo}</div>
  ${slogan ? `<div class="center slogan">${esc(slogan)}</div>` : ''}
  ${lineaHtml(32)}
  <table>${bodyRows}</table>
  ${lineaHtml(32)}
  <div class="total">VALOR PAGADO: ${esc(fmtMoney(egreso.valorEgreso))}</div>
  <div class="nota-legal">
    Prueba de pago: factura, voucher bancario o firma del beneficiario en este recibo.
  </div>
  <div class="firma">
    <div class="linea-firma"></div>
    <p><strong>Recibí conforme el valor indicado</strong></p>
    <p>${beneficiario}</p>
    <p>CC / NIT: ${docBenef}</p>
    <p>Fecha: _________________________</p>
  </div>
  ${qrDataUrl ? `<div class="qr"><img src="${qrDataUrl}" alt="QR"/></div>` : ''}
  <div class="pie">${esc(config.mensajePieEgreso)}</div>
  <div class="no-print">
    <button onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    next(e);
  }
};
