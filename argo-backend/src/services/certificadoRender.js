const QRCode = require('qrcode');

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtFecha(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function nombreCompleto(a) {
  if (!a) return '';
  return [a.nombre1, a.nombre2, a.apellido1, a.apellido2].filter(Boolean).join(' ').trim();
}

function encabezadoCurso(prog, certificado) {
  const guardado = (certificado?.encabezado || '').trim();
  if (guardado) return guardado;
  return (prog?.nomCert || prog?.descripcion || prog?.nombreProg || '').trim();
}

function uploadsBase() {
  const base = (process.env.PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/uploads`;
}

function urlUpload(rel) {
  if (!rel) return '';
  const p = String(rel).replace(/^\//, '');
  return `${uploadsBase()}/${p}`;
}

const QR_POSICIONES = {
  inferior_izquierda: { bottom: '2.5%', left: '2.5%' },
  inferior_derecha: { bottom: '2.5%', right: '2.5%' },
  superior_derecha: { top: '2%', right: '2.5%' },
  superior_izquierda: { top: '2%', left: '2.5%' },
};

function estiloQr(config) {
  const key = config?.qrPosicion || 'inferior_izquierda';
  const pos = QR_POSICIONES[key] || QR_POSICIONES.inferior_izquierda;
  const px = Math.min(120, Math.max(48, parseInt(config?.qrTamanoPx, 10) || 72));
  const parts = ['position:absolute', 'z-index:4', 'background:#fff', 'padding:3px', 'border-radius:4px'];
  if (pos.top) parts.push(`top:${pos.top}`);
  if (pos.bottom) parts.push(`bottom:${pos.bottom}`);
  if (pos.left) parts.push(`left:${pos.left}`);
  if (pos.right) parts.push(`right:${pos.right}`);
  return { css: parts.join(';'), size: px };
}

/** Solo valores; posiciones calibradas para plantilla vertical tipo COTRANSVIAL */
const LAYOUT = {
  horizontal: {
    pageW: '297mm',
    pageH: '210mm',
    color: '#4a3a6a',
    nombre: { top: '28%', fs: '28pt', fw: '700' },
    doc: { top: '35.5%', left: '62%', w: '34%', align: 'left', fs: '12.5pt' },
    curso: { top: '42%', fs: '32pt', fw: '700' },
    ciudad: { top: '54%', fs: '10pt' },
    horas: { top: '60.8%', left: '61.5%', w: '10%', align: 'left', fs: '15pt' },
    fecha: { top: '59%', left: '36%', w: '22%', align: 'center', fs: '11.5pt' },
    vence: { top: '59%', left: '60%', w: '26%', align: 'center', fs: '9.5pt' },
    acta: { top: '70%', left: '12%', w: '22%', align: 'center', fs: '9pt' },
    folio: { top: '70%', left: '38%', w: '22%', align: 'center', fs: '9pt' },
    runt: { top: '70%', left: '64%', w: '22%', align: 'center', fs: '9pt' },
    obs: { top: '74%', fs: '8.5pt' },
    certId: { bottom: '10%', left: '4%', fs: '7pt' },
  },
  vertical: {
    pageW: '210mm',
    pageH: '297mm',
    color: '#4a3a6a',
    /* Debajo de "CERTIFICA QUE:" */
    nombre: { top: '31%', fs: '26pt', fw: '700', ls: '0.03em' },
    /* Misma línea, después de "identificado con Cédula de Ciudadanía" */
    doc: { top: '39%', left: '62%', w: '34%', align: 'left', fs: '12.5pt' },
    /* "PARTICIPÓ EN LA CAPACITACIÓN DE:" */
    curso: { top: '47%', fs: '32pt', fw: '700' },
    /* Ciudad (constancia) */
    ciudad: { top: '57%', fs: '10pt' },
    /* Hueco "intensidad horaria de ___ horas" */
    horas: { top: '64.5%', left: '60.5%', w: '12%', align: 'left', fs: '15pt' },
    /* "Aprobó el día" / "Válido hasta" */
    fecha: { top: '62%', left: '34%', w: '24%', align: 'center', fs: '11.5pt' },
    vence: { top: '62%', left: '58%', w: '28%', align: 'center', fs: '9.5pt' },
    acta: { top: '72%', left: '10%', w: '25%', align: 'center', fs: '9pt' },
    folio: { top: '72%', left: '38%', w: '25%', align: 'center', fs: '9pt' },
    runt: { top: '72%', left: '66%', w: '25%', align: 'center', fs: '9pt' },
    obs: { top: '76%', fs: '8.5pt' },
    certId: { bottom: '11%', left: '5%', fs: '7pt' },
  },
};

function blockStyle(pos, color) {
  const centered = !pos.left && !pos.right && pos.align !== 'left' && pos.align !== 'right';
  const parts = [
    'position:absolute',
    'z-index:2',
    `color:${color}`,
    `top:${pos.top}`,
  ];

  if (pos.bottom) {
    parts.push(`bottom:${pos.bottom}`, 'top:auto');
  }

  if (centered) {
    parts.push('left:50%', 'transform:translateX(-50%)', 'width:82%', 'text-align:center');
  } else if (pos.align === 'left') {
    parts.push(`left:${pos.left}`, 'transform:none', `width:${pos.w || '40%'}`, 'text-align:left');
  } else if (pos.align === 'right') {
    parts.push(`right:${pos.right || '8%'}`, 'left:auto', 'transform:none', `width:${pos.w || '40%'}`, 'text-align:right');
  } else {
    parts.push(`left:${pos.left}`, 'transform:none', `width:${pos.w || '40%'}`, `text-align:${pos.align || 'center'}`);
  }

  if (pos.fs) parts.push(`font-size:${pos.fs}`);
  if (pos.fw) parts.push(`font-weight:${pos.fw}`);
  if (pos.ls) parts.push(`letter-spacing:${pos.ls}`);

  return parts.join(';');
}

function datoHtml(pos, value, className, color) {
  const v = String(value ?? '').trim();
  if (!v) return '';
  return `<div class="${className}" style="${blockStyle(pos, color)}">${esc(v)}</div>`;
}

async function generarHtmlCertificado(data) {
  const { config, plantilla, certificado, alumno, programa } = data;
  const horizontal = plantilla?.orientacion === 'horizontal';
  const L = horizontal ? LAYOUT.horizontal : LAYOUT.vertical;
  const fondo = urlUpload(plantilla?.urlFondo);
  const color = L.color;

  const nombre = nombreCompleto(alumno);
  const numDoc = (alumno?.numDoc || '').trim();
  const curso = encabezadoCurso(programa, certificado);
  const horas = programa?.horas != null ? Number(programa.horas) : null;
  const horasTxt = horas != null && !isNaN(horas) ? String(horas) : '';
  const fechaEm = fmtFecha(certificado.fechaEmision || certificado.createdAt);
  const fechaVe = fmtFecha(certificado.fechaVencimiento);
  const numActa = (certificado.numActa || '').trim();
  const numFolio = (certificado.numFolio || '').trim();
  const numRunt = (certificado.numRunt || '').trim();
  const observaciones = (certificado.observaciones || '').trim();
  const codigo = (certificado.codigoCert || String(certificado._id)).trim();

  const qrPayload = JSON.stringify({
    certificado: codigo,
    id: String(certificado._id),
    numDoc,
    idProg: certificado.idProg,
    fecha: certificado.fechaEmision,
  });
  const mostrarQr = config?.mostrarQr !== false;
  const qrEstilo = estiloQr(config);
  let qrDataUrl = '';
  if (mostrarQr) {
    try {
      qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: qrEstilo.size,
        margin: 0,
        errorCorrectionLevel: 'M',
      });
    } catch {
      qrDataUrl = '';
    }
  }

  const fondoImg = fondo ? `<img class="bg-fondo" src="${esc(fondo)}" alt="" />` : '';

  const datosHtml = [
    datoHtml(L.nombre, nombre, 'dato nombre', color),
    datoHtml(L.doc, numDoc, 'dato doc', color),
    datoHtml(L.curso, curso, 'dato curso', color),
    datoHtml(L.horas, horasTxt, 'dato horas', color),
    datoHtml(L.fecha, fechaEm, 'dato fecha', color),
    datoHtml(L.vence, fechaVe, 'dato vence', color),
    datoHtml(L.acta, numActa, 'dato acta', color),
    datoHtml(L.folio, numFolio, 'dato folio', color),
    datoHtml(L.runt, numRunt, 'dato runt', color),
    datoHtml(L.obs, observaciones, 'dato obs', color),
  ].join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Certificado ${esc(codigo)}</title>
  <style>
    @page { size: ${L.pageW} ${L.pageH}; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: ${L.pageW};
      height: ${L.pageH};
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      position: relative;
      width: ${L.pageW};
      height: ${L.pageH};
      overflow: hidden;
      background: #fff;
    }
    .bg-fondo {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: fill;
      object-position: center;
      z-index: 1;
      pointer-events: none;
    }
    .content {
      position: absolute;
      inset: 0;
      z-index: 2;
      font-family: Arial, Helvetica, sans-serif;
    }
    .dato {
      font-weight: 600;
      line-height: 1.25;
      text-transform: uppercase;
    }
    .dato.nombre {
      text-transform: uppercase;
    }
    .dato.curso {
      text-transform: uppercase;
    }
    .dato.doc, .dato.fecha, .dato.vence, .dato.ciudad, .dato.obs {
      text-transform: none;
    }
    .cert-id {
      position: absolute;
      bottom: ${L.certId.bottom};
      left: ${L.certId.left};
      z-index: 3;
      font-size: ${L.certId.fs};
      font-family: Consolas, monospace;
      color: ${color};
      line-height: 1.2;
    }
    .qr-wrap img { display: block; }
    .no-print {
      position: fixed;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99;
    }
    @media print {
      .no-print { display: none !important; }
      .sheet { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    ${fondoImg}
    <div class="content">
      ${datosHtml}
      ${codigo ? `<div class="cert-id">${esc(codigo)}</div>` : ''}
      ${
        qrDataUrl
          ? `<div class="qr-wrap" style="${qrEstilo.css}"><img src="${qrDataUrl}" width="${qrEstilo.size}" height="${qrEstilo.size}" alt="QR verificación"/></div>`
          : ''
      }
    </div>
  </div>
  <div class="no-print">
    <button type="button" onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>
</body>
</html>`;
}

module.exports = { generarHtmlCertificado, uploadsBase };
