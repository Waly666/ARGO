const QRCode = require('qrcode');
const Ingreso = require('../models/Ingreso');
const Liquidacion = require('../models/Liquidacion');
const DatosAlumno = require('../models/DatosAlumno');
const { models: cat } = require('../models/catalogos');
const { obtenerConfigRecibo } = require('../services/configRecibo');

function num(v) {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
  return Number(v) || 0;
}

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

function fmtFecha(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function nombreAlumno(a) {
  if (!a) return '';
  return [a.nombre1, a.nombre2, a.apellido1, a.apellido2].filter(Boolean).join(' ').trim();
}

async function enriquecerIngreso(p) {
  const tipo = await cat.catTipoPago
    .findOne({ $or: [{ idTipoPago: p.idTipoPago }, { codigo: p.idTipoPago }] })
    .lean();
  const banco = p.idBanco
    ? await cat.bancos
        .findOne({
          $or: [
            { idBanco: p.idBanco },
            { idbanco: p.idBanco },
            { idbanco: Number(p.idBanco) },
            { codigo: p.idBanco },
          ],
        })
        .lean()
    : null;
  return {
    ...p,
    valor: num(p.valor),
    tipoPagoDescr: tipo?.descripcion || tipo?.nombre || p.idTipoPago,
    bancoDescr: banco?.descripcion || banco?.nombre || banco?.banco || null,
  };
}

async function armarRecibo(id) {
  const ing = await Ingreso.findById(id).lean();
  if (!ing) return null;

  const [config, alumno, liq, ingreso] = await Promise.all([
    obtenerConfigRecibo(),
    DatosAlumno.findOne({ numDoc: ing.numDoc }).lean(),
    Liquidacion.findById(ing.idLiquidacion).lean(),
    enriquecerIngreso(ing),
  ]);

  const prefIng = (config.prefijoComprobanteIngreso || 'CI').trim();
  const numeroRecibo = ing.numRecibo || `${prefIng}-${String(ing._id).slice(-8).toUpperCase()}`;
  const qrTexto = JSON.stringify({
    recibo: numeroRecibo,
    ingresoId: String(ing._id),
    numDoc: ing.numDoc,
    valor: ingreso.valor,
    fecha: ing.fecha || ing.createdAt,
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

  return {
    config,
    ingreso,
    alumno: alumno
      ? {
          numDoc: alumno.numDoc,
          tipoDoc: alumno.tipoDoc,
          nombreCompleto: nombreAlumno(alumno),
          celular: alumno.celular,
          correo: alumno.correo,
        }
      : { numDoc: ing.numDoc, nombreCompleto: ing.numDoc },
    liquidacion: liq
      ? {
          descripcion: liq.descripcion,
          valor: num(liq.valor),
          abonado: num(liq.abonado),
          saldo: num(liq.saldo),
          estado: liq.estado,
        }
      : null,
    numeroRecibo,
    qrDataUrl,
    qrTexto,
  };
}

exports.datos = async (req, res, next) => {
  try {
    const data = await armarRecibo(req.params.id);
    if (!data) return res.status(404).json({ message: 'Ingreso no encontrado' });
    res.json(data);
  } catch (e) {
    next(e);
  }
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function lineaHtml(ancho = 32) {
  return `<div class="line">${'─'.repeat(ancho)}</div>`;
}

/** Encabezado empresa: nombre, NIT, teléfono, dirección, ciudad, email */
function bloqueEmpresaHtml(config) {
  const v = (x) => esc((x || '').toString().trim() || '—');
  return `
  <div class="center empresa">${v(config.nombreEmpresa)}</div>
  <div class="center dato">NIT: ${v(config.nit)}</div>
  <div class="center dato">Tel: ${v(config.telefono)}</div>
  <div class="center dato">Dir: ${v(config.direccion)}</div>
  <div class="center dato">Ciudad: ${v(config.ciudad)}</div>
  <div class="center dato">Email: ${v(config.email)}</div>`;
}

function bloqueTituloHtml(config) {
  const titulo = esc((config.mensajeEncabezado || 'COMPROBANTE DE INGRESO').trim());
  const slogan = (config.slogan1 || '').toString().trim();
  return `
  <div class="center titulo">${titulo}</div>
  ${slogan ? `<div class="center slogan">${esc(slogan)}</div>` : ''}`;
}

exports.html = async (req, res, next) => {
  try {
    const data = await armarRecibo(req.params.id);
    if (!data) return res.status(404).send('Ingreso no encontrado');

    const { config, ingreso, alumno, liquidacion, numeroRecibo, qrDataUrl } = data;
    const mm = config.anchoReciboMm || 80;
    const w = Math.round(mm * 3.78);

    const filas = [
      ['Comprobante N°', numeroRecibo],
      ['Fecha', fmtFecha(ingreso.fecha || ingreso.createdAt)],
      ['Documento', alumno.numDoc],
      ['Alumno', alumno.nombreCompleto],
      ['Concepto', liquidacion?.descripcion || 'Pago'],
      ...(ingreso.tipoAbonoDescr || ingreso.tipoAbono
        ? [['Pago', ingreso.tipoAbonoDescr || (ingreso.tipoAbono === 'total' ? 'Total' : 'Abono')]]
        : []),
      ['Forma pago', ingreso.tipoPagoDescr],
      ...(ingreso.bancoDescr ? [['Banco', ingreso.bancoDescr]] : []),
      ...(ingreso.numComprobante ? [['Ref / Comprob.', ingreso.numComprobante]] : []),
      ['Valor pagado', fmtMoney(ingreso.valor)],
      ...(liquidacion
        ? [
            ['Total ítem', fmtMoney(liquidacion.valor)],
            ['Abonado', fmtMoney(liquidacion.abonado)],
            ['Saldo', fmtMoney(liquidacion.saldo)],
          ]
        : []),
      ...(ingreso.observaciones ? [['Obs.', ingreso.observaciones]] : []),
    ];

    const bodyRows = filas
      .map(
        ([k, v]) =>
          `<tr><td class="k">${esc(k)}</td><td class="v">${esc(v)}</td></tr>`,
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Recibo ${esc(numeroRecibo)}</title>
  <style>
    @page { size: ${mm}mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Courier New", Consolas, monospace;
      font-size: 11px;
      line-height: 1.35;
      margin: 0;
      padding: 8px;
      width: ${w}px;
      max-width: ${w}px;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .empresa { font-weight: bold; font-size: 12px; margin-bottom: 2px; }
    .dato { font-size: 10px; line-height: 1.3; }
    .titulo { font-weight: bold; margin: 6px 0 2px; letter-spacing: 0.5px; font-size: 11px; }
    .slogan { font-size: 10px; margin-bottom: 4px; font-style: italic; }
    .line { text-align: center; color: #333; margin: 4px 0; overflow: hidden; white-space: nowrap; }
    table { width: 100%; border-collapse: collapse; }
    td { vertical-align: top; padding: 2px 0; }
    td.k { width: 42%; font-weight: bold; }
    td.v { width: 58%; text-align: right; word-break: break-word; }
    .total { font-size: 13px; font-weight: bold; margin-top: 6px; text-align: center; }
    .pie { font-size: 9px; text-align: center; margin-top: 8px; color: #333; }
    .qr { text-align: center; margin: 8px 0; }
    .qr img { width: 100px; height: 100px; }
    .no-print { margin-top: 12px; text-align: center; }
    @media print {
      .no-print { display: none !important; }
      body { width: ${w}px; }
    }
  </style>
</head>
<body>
  ${bloqueEmpresaHtml(config)}
  ${lineaHtml(32)}
  ${bloqueTituloHtml(config)}
  ${lineaHtml(32)}
  <table>${bodyRows}</table>
  ${lineaHtml(32)}
  <div class="total">RECIBIDO: ${esc(fmtMoney(ingreso.valor))}</div>
  ${qrDataUrl ? `<div class="qr"><img src="${qrDataUrl}" alt="QR"/></div>` : ''}
  <div class="pie">${esc(config.mensajePie)}</div>
  <div class="no-print">
    <button onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>
  <script>/* auto-print opcional: window.onload = () => setTimeout(() => window.print(), 300); */</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    next(e);
  }
};
