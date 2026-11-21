const fs = require('fs');
const path = require('path');
const { launchBrowser, htmlToPdfBuffer } = require('../htmlToPdf');

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const TIPO_CORTO = {
  'Cédula de ciudadanía': 'CC',
  'Cédula de extranjería': 'CE',
  Pasaporte: 'Pasaporte',
};

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function limpio(v) {
  return String(v ?? '').trim();
}

function ponerSiVacio(datos, key, valor) {
  if (!limpio(datos[key]) && limpio(valor)) datos[key] = valor;
}

function partesFecha(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(limpio(iso));
  if (!m) return null;
  const y = Number(m[1]);
  const mes = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mes < 1 || mes > 12 || !d) return null;
  return { y, mes, d };
}

function fechaLarga(iso) {
  const p = partesFecha(iso);
  if (!p) return limpio(iso);
  return `${p.d} de ${MESES[p.mes - 1]} de ${p.y}`;
}

function fechaDado(iso) {
  const p = partesFecha(iso);
  if (!p) return limpio(iso);
  return `a los ${p.d} días del mes de ${MESES[p.mes - 1]} de ${p.y}`;
}

function empresa(datos) {
  return limpio(datos.razonSocial) || 'la empresa';
}

function completarDatosCertificacion(itemNo, datos, nivelLabel) {
  const out = { ...(datos || {}) };
  const no = Number(itemNo);
  ponerSiVacio(out, 'tipoDocumento', 'Cédula de ciudadanía');
  ponerSiVacio(out, 'cargoFirma', 'Representante Legal');
  ponerSiVacio(out, 'lugarEncabezado', out.ciudad);
  const razon = empresa(out);
  const nombre = limpio(out.representanteLegal);
  const tipo = limpio(out.tipoDocumento) || 'Cédula de ciudadanía';
  const numero = limpio(out.numeroDocumento);
  const doc = numero ? `${tipo} No. ${numero}` : tipo;

  if (no === 1) {
    ponerSiVacio(out, 'lugarCierre', out.lugarEncabezado || out.ciudad);
    ponerSiVacio(out, 'destinatario', 'Señores\nSUPERINTENDENCIA DE TRANSPORTE');
    ponerSiVacio(out, 'tituloCertificado', 'CERTIFICADO DE CUMPLIMIENTO DE NORMATIVIDAD');
    ponerSiVacio(
      out,
      'parrafoConstitucion',
      `Que la empresa ${razon}, en el momento de su constitución y conforme a la normatividad vigente, cumplió con los requisitos establecidos en la Resolución 1565 de 2014 del Ministerio de Transporte, la cual regula el Sistema de Gestión de Seguridad Vial (PESV) para las empresas de transporte terrestre automotor, implementando un Plan de Seguridad Vial en cumplimiento con las disposiciones de dicha norma.`,
    );
    ponerSiVacio(
      out,
      'parrafoNormaNueva',
      'Que, conforme a la Resolución 40595 de 2022, que derogó la Resolución 1565 de 2014, la empresa se encuentra en cumplimiento con la nueva regulación establecida por el Ministerio de Transporte.',
    );
    ponerSiVacio(
      out,
      'parrafoImplementacion',
      `Que ${razon} ha implementado, de acuerdo con la nueva normativa, el Plan de Seguridad Vial conforme a lo establecido en la Resolución 40595 de 2022, y continúa cumpliendo con todos los requisitos relacionados con la seguridad vial en sus operaciones.`,
    );
    ponerSiVacio(
      out,
      'parrafoCierre',
      'En virtud de lo anterior, ratifico que la empresa ha cumplido con todas las disposiciones legales aplicables en materia de seguridad vial y continúa trabajando en su desarrollo y mejoramiento continuo de acuerdo con la normativa vigente.',
    );
  }

  if (no === 2) {
    ponerSiVacio(
      out,
      'asunto',
      'Asunto: Certificación de diseño e implementación del Plan Estratégico de Seguridad Vial, de acuerdo con la Resolución 40595 de 2022.',
    );
    ponerSiVacio(out, 'estadoPesv', 'diseño e implementación');
    ponerSiVacio(out, 'grupoNivel', nivelLabel);
    const estado = limpio(out.estadoPesv) || 'diseño e implementación';
    const nivel = limpio(out.grupoNivel) || nivelLabel || '';
    const pct = limpio(out.porcentajeAvance);
    ponerSiVacio(
      out,
      'parrafoPrincipal',
      `Mediante el presente, el representante legal de ${razon}${nombre ? `, ${nombre}` : ''}, identificado con ${doc}, certifica que la organización que representa cuenta a la fecha con un Plan Estratégico de Seguridad Vial, en estado de ${estado} según lo estipulado en la Resolución 40595 de 2022.`,
    );
    if (pct) {
      ponerSiVacio(out, 'parrafoAvance', `Actualmente presenta un estado de avance del ${pct}.`);
    }
    if (nivel) {
      ponerSiVacio(
        out,
        'parrafoNivel',
        `La empresa ${razon} se encuentra clasificada en el grupo ${nivel} definido en el capítulo I, metodología para el diseño e implementación del Plan Estratégico de Seguridad Vial.`,
      );
    }
  }

  return out;
}

function faltantes(datos, keys) {
  return keys.filter((k) => !limpio(datos[k]));
}

function parrafos(datos, keys) {
  return keys.map((k) => limpio(datos[k])).filter(Boolean);
}

function htmlCertificacion(itemNo, datos) {
  const no = Number(itemNo);
  const fecha = fechaLarga(datos.fechaExpedicion);
  const lugar = limpio(datos.lugarEncabezado);
  const encabezado = [lugar, fecha].filter(Boolean).join(', ');
  const nombre = limpio(datos.representanteLegal);
  const tipo = limpio(datos.tipoDocumento);
  const corto = TIPO_CORTO[tipo] || tipo;
  const numero = limpio(datos.numeroDocumento);
  const lugarDoc = limpio(datos.lugarExpedicionDocumento);
  const cargo = limpio(datos.cargoFirma);
  const razon = limpio(datos.razonSocial);
  const nit = limpio(datos.nit);

  let bloques = [];
  let firmaExtra = '';

  if (no === 1) {
    const intro = `Yo, ${nombre}, identificado con ${tipo.toLowerCase()} No. ${numero}${lugarDoc ? ` de ${lugarDoc}` : ''}, en mi calidad de representante legal de la empresa ${razon}, identificada con NIT ${nit}, declaro bajo la gravedad de juramento lo siguiente:`;
    bloques = [
      `<p class="dest">${esc(datos.destinatario)}</p>`,
      `<h1>${esc(datos.tituloCertificado)}</h1>`,
      `<p>${esc(intro)}</p>`,
      ...parrafos(datos, [
        'parrafoConstitucion',
        'parrafoNormaNueva',
        'parrafoHabilitacion',
        'parrafoImplementacion',
        'parrafoCierre',
      ]).map((t) => `<p>${esc(t)}</p>`),
      `<p>Dado en ${esc(limpio(datos.lugarCierre) || lugar)}, ${esc(fechaDado(datos.fechaExpedicion))}.</p>`,
    ];
    const docLinea = [corto, numero].filter(Boolean).join(' ');
    firmaExtra = [docLinea && lugarDoc ? `${docLinea} de ${lugarDoc}` : docLinea, cargo].filter(Boolean).join(' · ');
  } else {
    bloques = [
      `<p class="asunto">${esc(datos.asunto)}</p>`,
      ...parrafos(datos, ['parrafoPrincipal', 'parrafoAvance', 'parrafoNivel']).map((t) => `<p>${esc(t)}</p>`),
    ];
    firmaExtra = [cargo, razon].filter(Boolean).join(' · ');
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: letter; margin: 22mm 22mm 20mm 22mm; }
    body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.45; color: #111; }
    .fecha { text-align: right; margin: 0 0 1.6em; }
    .dest, .asunto { white-space: pre-line; margin: 0 0 1.4em; }
    h1 { font-size: 13pt; text-align: center; margin: 1.2em 0; letter-spacing: 0.03em; }
    p { margin: 0 0 0.85em; text-align: justify; }
    .cierre { margin-top: 1.2em; }
    .firma { margin-top: 2.2em; }
    .nombre { margin-top: 3.4em; font-weight: bold; }
    .cargo { margin: 0.15em 0 0; }
  </style>
</head>
<body>
  <p class="fecha">${esc(encabezado)}</p>
  ${bloques.join('\n  ')}
  <p class="cierre">Atentamente,</p>
  <div class="firma">
    <p class="nombre">${esc(nombre)}</p>
    <p class="cargo">${esc(firmaExtra)}</p>
  </div>
</body>
</html>`;
}

const REQUERIDOS = {
  1: [
    ['razonSocial', 'razón social'],
    ['nit', 'NIT'],
    ['representanteLegal', 'representante legal'],
    ['tipoDocumento', 'tipo de documento'],
    ['numeroDocumento', 'número de documento'],
    ['lugarExpedicionDocumento', 'lugar de expedición del documento'],
    ['cargoFirma', 'cargo'],
    ['lugarEncabezado', 'ciudad del encabezado'],
    ['fechaExpedicion', 'fecha'],
    ['lugarCierre', 'ciudad del cierre'],
  ],
  2: [
    ['razonSocial', 'razón social'],
    ['nit', 'NIT'],
    ['representanteLegal', 'representante legal'],
    ['tipoDocumento', 'tipo de documento'],
    ['numeroDocumento', 'número de documento'],
    ['cargoFirma', 'cargo'],
    ['lugarEncabezado', 'ciudad del encabezado'],
    ['fechaExpedicion', 'fecha'],
    ['estadoPesv', 'estado del PESV'],
    ['porcentajeAvance', 'porcentaje de avance'],
    ['grupoNivel', 'nivel'],
  ],
};

async function generarPdfCertificacion({ itemNo, datos, dir, nombreArchivo }) {
  const no = Number(itemNo);
  const lista = REQUERIDOS[no] || [];
  const missing = faltantes(datos, lista.map(([k]) => k));
  if (missing.length) {
    const labels = missing.map((k) => lista.find(([key]) => key === k)?.[1] || k);
    const err = new Error(`Faltan datos para la certificación: ${labels.join(', ')}.`);
    err.status = 400;
    throw err;
  }
  fs.mkdirSync(dir, { recursive: true });
  const destino = path.join(dir, nombreArchivo);
  const browser = await launchBrowser();
  try {
    const pdf = await htmlToPdfBuffer(browser, htmlCertificacion(no, datos));
    fs.writeFileSync(destino, pdf);
  } finally {
    await browser.close().catch(() => {});
  }
  return destino;
}

module.exports = {
  completarDatosCertificacion,
  generarPdfCertificacion,
};
