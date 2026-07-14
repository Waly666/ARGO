const { models: cat } = require('../models/catalogos');
const { obtenerConfigRecibo } = require('./configRecibo');
const { num, roundMoney } = require('../utils/coerceTypes');
const { esc, fmtMoney, fmtFecha } = require('./reciboHtmlShared');

function bloqueEmpresaCuentaCobro(config) {
  const v = (x) => esc(String(x || '').trim());
  const ciudadLine = [config.ciudad, config.departamento].filter((x) => String(x || '').trim()).join(', ');
  const partes = [];
  if (config.nit) partes.push(`NIT: ${v(config.nit)}`);
  if (config.telefono) partes.push(`Tel: ${v(config.telefono)}`);
  if (ciudadLine) partes.push(v(ciudadLine));
  const lineaExtra = partes.join(' · ');

  const lineas = [];
  const logoSrc = config.urlLogoDataUrl || null;
  if (logoSrc) {
    lineas.push(`<div class="center logo"><img src="${esc(logoSrc)}" alt="Logo" /></div>`);
  }
  if (v(config.nombreEmpresa)) {
    lineas.push(`<div class="center empresa">${v(config.nombreEmpresa)}</div>`);
  }
  if (lineaExtra) {
    lineas.push(`<div class="center dato">${lineaExtra}</div>`);
  }
  if (!lineas.length) {
    lineas.push(`<div class="center empresa">ARGO</div>`);
  }
  return lineas.join('\n');
}

async function listarCuentasEmpresa() {
  const rows = await cat.cuentasBancarias.find({}).lean();
  return (rows || [])
    .map((c) => {
      const banco = String(c.banco || '').trim();
      const tipo = String(c.tipo || '').trim();
      const numCuenta = c.numCuenta ?? '';
      const label = [banco, tipo, numCuenta].filter(Boolean).join(' — ');
      return label ? `<li>${esc(label)}</li>` : '';
    })
    .filter(Boolean)
    .join('');
}

async function generarHtmlCuentaCobro({ contrato, cliente, idSede }) {
  const config = await obtenerConfigRecibo(idSede);
  const valor = roundMoney(num(contrato.valorContrato));
  const objeto = String(contrato.objetoContrato || contrato.objeto || '').trim();
  const cod = String(contrato.codContrato || contrato._id || '').trim();
  const nombreCliente = String(
    cliente?.razonSocial || cliente?.nombres || contrato.razoSocial || contrato.nombreComercial || 'Contratante',
  ).trim();
  const nitCliente = String(cliente?.identificacion || contrato.numeroIdentificacion || '').trim();
  const dirCliente = String(cliente?.direccion || contrato.direccion || '').trim();
  const ciudadCliente = [contrato.ciudad, contrato.departamento].filter(Boolean).join(', ');
  const fechaDoc = contrato.cuentaCobroGeneradaAt || new Date();
  const numero = contrato.cuentaCobroNumero || '—';
  const cuentasHtml = await listarCuentasEmpresa();

  const valorLetras = `${fmtMoney(valor)} M/CTE`;
  const { atPageCssPara } = require('./configPaginasInformes');
  const atPage = await atPageCssPara('cuenta_cobro');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Cuenta de cobro ${esc(numero)}</title>
  <style>
    ${atPage}
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #111;
      margin: 0;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 1px solid #1e3a5f;
      padding-bottom: 6px;
    }
    .header .center { text-align: center; }
    .header .logo { margin: 0 0 3px; }
    .header .logo img {
      max-height: 40px;
      max-width: 110px;
      object-fit: contain;
      display: inline-block;
    }
    .header .empresa {
      font-size: 9.5pt;
      font-weight: 700;
      margin-bottom: 1px;
      line-height: 1.2;
    }
    .header .sede-nombre {
      font-size: 8.5pt;
      font-weight: 600;
      margin-bottom: 2px;
      line-height: 1.2;
    }
    .header .dato {
      font-size: 8pt;
      line-height: 1.25;
      margin: 0;
      color: #444;
    }
    .titulo-doc {
      font-size: 12pt;
      font-weight: 700;
      letter-spacing: 0.4px;
      color: #1e3a5f;
      margin: 8px 0 2px;
      text-align: center;
    }
    .num-doc { text-align: center; font-weight: 600; font-size: 10pt; margin-bottom: 10px; }
    .fecha { text-align: right; margin-bottom: 16px; }
    .destino { margin: 16px 0; }
    .destino strong { display: block; margin-bottom: 4px; }
    .cuerpo { margin: 20px 0; text-align: justify; }
    .tabla-valor {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
    }
    .tabla-valor th, .tabla-valor td {
      border: 1px solid #ccc;
      padding: 8px 10px;
      vertical-align: top;
    }
    .tabla-valor th { background: #f3f4f6; text-align: left; width: 28%; }
    .total { font-size: 13pt; font-weight: 700; text-align: right; margin: 12px 0; }
    .cuentas { margin-top: 16px; }
    .cuentas ul { margin: 6px 0 0 18px; padding: 0; }
    .firma { margin-top: 48px; }
    .firma .linea { border-top: 1px solid #000; width: 240px; margin: 40px auto 6px; }
    .firma p { text-align: center; margin: 2px 0; font-size: 10pt; }
    .no-print { margin-top: 24px; text-align: center; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    ${bloqueEmpresaCuentaCobro(config)}
  </div>
  <div class="titulo-doc">CUENTA DE COBRO</div>
  <div class="num-doc">No. ${esc(numero)}</div>
  <div class="fecha">${esc(fmtFecha(fechaDoc))}</div>

  <div class="destino">
    <strong>Señores</strong>
    ${esc(nombreCliente)}<br />
    ${nitCliente ? `NIT/CC: ${esc(nitCliente)}<br />` : ''}
    ${dirCliente ? `${esc(dirCliente)}<br />` : ''}
    ${ciudadCliente ? esc(ciudadCliente) : ''}
  </div>

  <div class="cuerpo">
    <p>Respetados señores:</p>
    <p>
      Por medio de la presente me permito presentar cuenta de cobro por concepto de
      <strong>${esc(objeto)}</strong>, según contrato de capacitación
      <strong>${esc(cod)}</strong>.
    </p>
  </div>

  <table class="tabla-valor">
    <tr>
      <th>Concepto</th>
      <td>${esc(objeto)}</td>
    </tr>
    <tr>
      <th>Contrato</th>
      <td>${esc(cod)}</td>
    </tr>
    <tr>
      <th>Valor</th>
      <td><strong>${esc(valorLetras)}</strong></td>
    </tr>
  </table>

  <div class="total">TOTAL A PAGAR: ${esc(valorLetras)}</div>

  ${
    cuentasHtml
      ? `<div class="cuentas"><strong>Consignar a:</strong><ul>${cuentasHtml}</ul></div>`
      : ''
  }

  <div class="firma">
    <div class="linea"></div>
    <p><strong>${esc(config.nombreEmpresa || 'ARGO')}</strong></p>
    <p>NIT: ${esc(config.nit || '—')}</p>
  </div>

  <div class="no-print">
    <button type="button" onclick="window.print()">Imprimir</button>
  </div>
</body>
</html>`;
}

module.exports = { generarHtmlCuentaCobro };
