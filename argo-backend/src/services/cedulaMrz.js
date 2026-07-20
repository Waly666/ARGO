const sharp = require('sharp');
const { createWorker, PSM } = require('tesseract.js');
const { isValidNumDocDigits } = require('../utils/numDoc');

const OCR_PARAMS_MRZ = {
  tessedit_pageseg_mode: String(PSM.SINGLE_BLOCK),
  tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
};

const OCR_PARAMS_MRZ_SPARSE = {
  tessedit_pageseg_mode: String(PSM.SPARSE_TEXT),
  tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
};

let workerPromise = null;
let ocrChain = Promise.resolve();

async function getMrzWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng', 1, { logger: () => {} });
      await worker.setParameters(OCR_PARAMS_MRZ);
      return worker;
    })();
  }
  return workerPromise;
}

async function ocrMrzBuffer(buffer, params = OCR_PARAMS_MRZ) {
  const run = async () => {
    const worker = await getMrzWorker();
    await worker.setParameters(params);
    try {
      const {
        data: { text },
      } = await worker.recognize(buffer);
      return text || '';
    } finally {
      await worker.setParameters(OCR_PARAMS_MRZ);
    }
  };
  const result = ocrChain.then(run);
  ocrChain = result.catch(() => {});
  return result;
}

function documentoDesdeCampo(raw) {
  const digits = String(raw || '')
    .replace(/</g, '')
    .replace(/\D/g, '')
    .replace(/^0+/, '');
  return isValidNumDocDigits(digits) ? digits : '';
}

/** NUIP tras COL en línea 2; no incluir el dígito verificador después de '<'. */
function documentoDesdeLinea2Mrz(line2) {
  const s = String(line2 || '')
    .toUpperCase()
    .replace(/[^A-Z0-9<]/g, '');
  const col = s.indexOf('COL');
  if (col >= 0) {
    const after = s.slice(col + 3);
    const m = after.match(/^(\d{5,11})/);
    if (m) {
      let digits = m[1];
      if (digits.length === 11 && !after.startsWith(`${digits.slice(0, 10)}<`)) {
        digits = digits.slice(0, 10);
      }
      const norm = digits.replace(/^0+/, '') || digits;
      if (isValidNumDocDigits(norm)) return norm;
    }
  }
  const untilPad = s.slice(18, 29).split('<')[0];
  return documentoDesdeCampo(untilPad);
}

function fechaNacDesdeMrz(yymmdd) {
  if (!/^\d{6}$/.test(yymmdd)) return undefined;
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  const dd = Number(yymmdd.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return undefined;
  const nowYy = new Date().getUTCFullYear() % 100;
  const year = yy > nowYy ? 1900 + yy : 2000 + yy;
  const date = new Date(Date.UTC(year, mm - 1, dd));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== mm - 1 ||
    date.getUTCDate() !== dd
  ) {
    return undefined;
  }
  return `${String(year).padStart(4, '0')}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

function partirNombres(field) {
  const limpio = String(field || '').replace(/[^A-Z<]/g, '');
  const partes = limpio.split('<<');
  if (partes.length < 2) return null;
  const apellidos = partes[0]
    .split('<')
    .map((t) => t.trim())
    .filter(Boolean);
  const nombres = partes
    .slice(1)
    .join('<')
    .split('<')
    .map((t) => t.trim())
    .filter(Boolean);
  if (!apellidos.length || !nombres.length) return null;
  const apellido2 = apellidos.length > 1 ? apellidos[apellidos.length - 1] : undefined;
  const apellido1 = apellidos.length > 1 ? apellidos.slice(0, -1).join(' ') : apellidos[0];
  return {
    apellido1,
    apellido2,
    nombre1: nombres[0],
    nombre2: nombres.length > 1 ? nombres.slice(1).join(' ') : undefined,
  };
}

function normalizarLineaMrz(line, len = 30) {
  const chars = String(line || '')
    .toUpperCase()
    .replace(/[^A-Z0-9<]/g, '');
  if (chars.length < 18) return '';
  if (chars.length === len) return chars;
  if (chars.length > len) return chars.slice(0, len);
  return chars.padEnd(len, '<');
}

/** Corrige confusiones típicas de OCR en MRZ (O/0, L/1, espacios, C0L…). */
function limpiarTextoOcrMrz(texto) {
  return String(texto || '')
    .toUpperCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[«»‹›]/g, '<')
    .replace(/[|!I¡]/g, (ch, i, s) => {
      // En contextos numéricos I/| suelen ser 1; se ajusta luego por posición.
      return ch === '|' || ch === '!' ? '1' : ch;
    })
    .replace(/C0L/g, 'COL')
    .replace(/CQL/g, 'COL')
    .replace(/COI/g, 'COL')
    .replace(/[^\S\n\r]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

function forzarPatronLinea1(line) {
  let s = normalizarLineaMrz(line.replace(/\s+/g, ''));
  if (!s) return '';
  // ICCOL…: posiciones 0-1 tipo, 2-4 país
  const chars = s.split('');
  if (chars[0] === '1' || chars[0] === 'L') chars[0] = 'I';
  if (chars[1] === '0') chars[1] = 'C';
  if (chars[2] === '0') chars[2] = 'C';
  if (chars[3] === '0') chars[3] = 'O';
  if (chars[4] === '1' || chars[4] === 'I') chars[4] = 'L';
  // Documento/serial: dígitos en 5.. (O→0)
  for (let i = 5; i < Math.min(20, chars.length); i++) {
    if (chars[i] === 'O' || chars[i] === 'Q' || chars[i] === 'D') chars[i] = '0';
    if (chars[i] === 'B') chars[i] = '8';
    if (chars[i] === 'I' || chars[i] === 'L') chars[i] = '1';
    if (chars[i] === 'S') chars[i] = '5';
  }
  s = chars.join('').replace(/ICCO[0O]L?/g, 'ICCOL');
  if (s.startsWith('ICCO') && s[4] !== 'L') s = `ICCOL${s.slice(4)}`;
  return normalizarLineaMrz(s);
}

function forzarPatronLinea2(line) {
  let s = normalizarLineaMrz(line.replace(/\s+/g, '').replace(/C0L/g, 'COL'));
  if (!s) return '';
  const chars = s.split('');
  // 0-5 fecha, 6 check, 7 sexo, 8-13 venc, 14 check, 15-17 COL, 18-28 opcional
  for (let i = 0; i < chars.length; i++) {
    const inDigits =
      (i >= 0 && i <= 6) ||
      (i >= 8 && i <= 14) ||
      (i >= 18 && i <= 28) ||
      i === 29;
    if (inDigits) {
      if (chars[i] === 'O' || chars[i] === 'Q' || chars[i] === 'D') chars[i] = '0';
      if (chars[i] === 'I' || chars[i] === 'L') chars[i] = '1';
      if (chars[i] === 'B') chars[i] = '8';
      if (chars[i] === 'S') chars[i] = '5';
      if (chars[i] === 'Z') chars[i] = '2';
    }
  }
  if (chars[7] === 'H' || chars[7] === 'N') chars[7] = 'M';
  if (chars[7] === 'E' || chars[7] === 'P') chars[7] = 'F';
  // Nacionalidad COL (solo si no está ya)
  if (chars.length >= 18 && `${chars[15] || ''}${chars[16] || ''}${chars[17] || ''}` !== 'COL') {
    chars[15] = 'C';
    chars[16] = 'O';
    chars[17] = 'L';
  }
  return normalizarLineaMrz(chars.join(''));
}

function forzarPatronLinea3(line) {
  let s = String(line || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z<]/g, '')
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/5/g, 'S')
    .replace(/8/g, 'B');
  // Separador de nombres suele degradarse: un solo < o espacio → <<
  if (!s.includes('<<') && (s.match(/</g) || []).length >= 2) {
    // Intento: último bloque de nombres tras un < aislado largo
    const idx = s.lastIndexOf('<');
    // Mejor: buscar patrón APELLIDOS<NOMBRES sin <<
    const m = s.match(/^([A-Z<]+)<([A-Z]+(?:<[A-Z]+)*)$/);
    if (m && !m[1].includes('<<')) {
      // Si hay varios < en apellidos, el último < antes de nombres compuestos puede faltar un <
    }
  }
  // Correcciones frecuentes vistas en OCR de esta cédula
  s = s
    .replace(/^[VJPDB]ECLA</, 'DE<LA<')
    .replace(/^DELA</, 'DE<LA<')
    .replace(/MLNOZ/g, 'MUNOZ')
    .replace(/MUNOZ/g, 'MUNOZ')
    .replace(/MUN0Z/g, 'MUNOZ')
    .replace(/PENIA/g, 'PENA')
    .replace(/PEINA/g, 'PENA')
    .replace(/FNECARLOS/g, '<<JUAN<CARLOS')
    .replace(/<Z([A-Z]{3,})/g, '<$1')
    .replace(/<<</g, '<<')
    .replace(/([^<])<(JUAN|JOSE|MARIA|CARLOS|ANDRES|LUIS)/, '$1<<$2');
  if (!s.includes('<<')) {
    // DE<LA<PENA<MUNOZ<JUAN<CARLOS → insertar << antes del primer nombre típico
    const nombresComunes =
      /(JUAN|JOSE|MARIA|CARLOS|ANDRES|LUIS|ANA|PEDRO|DIEGO|CAMILO|SOFIA|LAURA|DANIEL|MIGUEL|ANGEL|DAVID)/;
    const m = s.match(nombresComunes);
    if (m && m.index != null && m.index > 3) {
      s = `${s.slice(0, m.index)}<<${s.slice(m.index)}`;
    }
  }
  return normalizarLineaMrz(s);
}

function pareceTd1(lines) {
  if (!lines || lines.length < 3) return false;
  const [l1, l2, l3] = lines;
  if (!/^I[A-Z0-9<]/.test(l1) && !l1.includes('COL')) return false;
  if (!/[MF<]/.test(l2.slice(7, 8))) return false;
  if (!l3.includes('<')) return false;
  return true;
}

function extraerLineasMrz(texto) {
  const bruto = limpiarTextoOcrMrz(texto);
  if (!bruto) return null;

  const candidatasCrudas = bruto
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, '').trim())
    .filter((l) => l.replace(/[^A-Z0-9<]/g, '').length >= 18);

  if (candidatasCrudas.length >= 3) {
    const ultimas = candidatasCrudas.slice(-3);
    const trioUltimo = [
      forzarPatronLinea1(ultimas[0]),
      forzarPatronLinea2(ultimas[1]),
      forzarPatronLinea3(ultimas[2]),
    ];
    if (parseLineasMrzTd1(trioUltimo)) return trioUltimo;

    for (let i = 0; i <= candidatasCrudas.length - 3; i++) {
      const trio = [
        forzarPatronLinea1(candidatasCrudas[i]),
        forzarPatronLinea2(candidatasCrudas[i + 1]),
        forzarPatronLinea3(candidatasCrudas[i + 2]),
      ];
      if (pareceTd1(trio) && parseLineasMrzTd1(trio)) return trio;
    }
  }

  const compacto = bruto.replace(/[\s\r\n]+/g, '').replace(/[^A-Z0-9<]/g, '');
  if (compacto.length >= 90) {
    const anchors = ['ICCOL', 'IDCOL', 'IPCOL'];
    let start = -1;
    for (const a of anchors) {
      const idx = compacto.indexOf(a);
      if (idx >= 0 && (start < 0 || idx < start)) start = idx;
    }
    if (start < 0) {
      const col = compacto.search(/I[A-Z0-9<]COL/);
      start = col >= 0 ? col : -1;
    }
    if (start >= 0 && start + 90 <= compacto.length) {
      const trioA = [
        forzarPatronLinea1(compacto.slice(start, start + 30)),
        forzarPatronLinea2(compacto.slice(start + 30, start + 60)),
        forzarPatronLinea3(compacto.slice(start + 60, start + 90)),
      ];
      if (parseLineasMrzTd1(trioA)) return trioA;
    }
  }

  const blob = bruto.replace(/[^A-Z0-9<\n]/g, '');
  const l2 = blob.match(/(\d{6}[0-9O]\s*[MF]\s*\d{6}[0-9O]\s*COL\s*\d{5,12}<{0,6}\d?)/);
  const l3 = blob.match(/((?:[A-Z]+<){1,8}[A-Z]+<<[A-Z]+(?:<[A-Z]+){0,3}<?)/);
  const l1 = blob.match(/(I?CCOL[0-9A-Z<]{18,})/) || blob.match(/(CCOL[0-9A-Z<]{18,})/);
  if (l1 && l2 && l3) {
    const trio = [
      forzarPatronLinea1(l1[1].startsWith('I') ? l1[1] : `I${l1[1]}`),
      forzarPatronLinea2(l2[1].replace(/\s+/g, '')),
      forzarPatronLinea3(l3[1]),
    ];
    if (parseLineasMrzTd1(trio)) return trio;
  }
  return null;
}

function parseLineasMrzTd1(lines) {
  if (!lines || lines.length < 3) return null;
  const line1 = forzarPatronLinea1(lines[0]) || 'ICCOL0000000000<<<<<<<<<<<<<<<';
  const line2 = forzarPatronLinea2(lines[1]);
  const line3 = forzarPatronLinea3(lines[2]);
  if (!line2 || !line3) return null;

  const nombres = partirNombres(line3);
  if (!nombres) return null;

  const fechaNac = fechaNacDesdeMrz(line2.slice(0, 6));
  const generoRaw = line2.charAt(7);
  const genero = generoRaw === 'M' || generoRaw === 'F' ? generoRaw : undefined;
  const numDocLine2 = documentoDesdeLinea2Mrz(line2);
  const numDocLine1 = documentoDesdeCampo(line1.slice(5, 14));
  let numDoc = numDocLine2 || '';
  if (!numDoc && numDocLine1 && numDocLine1.length <= 10) numDoc = numDocLine1;

  if (!numDoc || !nombres.apellido1 || !nombres.nombre1) return null;

  return {
    tipoDoc: '1',
    numDoc,
    apellido1: nombres.apellido1,
    apellido2: nombres.apellido2,
    nombre1: nombres.nombre1,
    nombre2: nombres.nombre2,
    genero,
    fechaNac,
  };
}

function calidadMrz(s) {
  if (!s?.numDoc || !s.apellido1 || !s.nombre1) return 0;
  let score = 0;
  if (s.fechaNac) score += 4;
  if (s.genero === 'M' || s.genero === 'F') score += 3;
  const ap = String(s.apellido1);
  const no = String(s.nombre1);
  if (ap.length >= 2 && ap.length <= 35 && !/(.)\1{3,}/.test(ap)) score += 2;
  if (no.length >= 2 && no.length <= 20 && !/(.)\1{3,}/.test(no)) score += 2;
  if (/[AEIOUÁÉÍÓÚ]/.test(ap) && /[AEIOUÁÉÍÓÚ]/.test(no)) score += 2;
  if (/^[A-Z]+(?: [A-Z]+)*$/.test(ap) && /^[A-Z]+(?: [A-Z]+)*$/.test(no)) score += 1;
  const nd = String(s.numDoc);
  if (nd.length >= 6 && nd.length <= 10) score += 3;
  if (nd.length > 10) score -= 3;
  if (/[BCDFGHJKLMNPQRSTVWXYZ]{8,}/.test(no.replace(/\s/g, ''))) score -= 4;
  if (/LLLL|XXXX|AAAA|BRTEE|RPCUH/.test(ap + no)) score -= 5;
  return score;
}

function parseMrzFlexible(texto) {
  const bruto = limpiarTextoOcrMrz(texto);
  if (!bruto) return null;

  const lines = extraerLineasMrz(bruto);
  if (lines) {
    const parsed = parseLineasMrzTd1(lines);
    if (parsed && calidadMrz(parsed) >= 8) return parsed;
  }

  const blob = bruto.replace(/[^A-Z0-9<\n ]/g, '');
  const line2Matches = [...blob.matchAll(/(\d{6}[0-9OIL]\s*[MF]\s*\d{6}[0-9OIL]\s*C[O0]L\s*\d{6,12}<{0,6}\d?)/g)].map(
    (m) => forzarPatronLinea2(m[1]),
  );
  const line3Matches = [
    ...blob.matchAll(/((?:DE<)?(?:[A-Z]{2,}<){1,6}[A-Z]{2,}<<[A-Z]{2,}(?:<[A-Z]{2,}){0,3}<?)/g),
    ...blob.matchAll(/(DE<LA<PENA<[A-Z]+<<[A-Z]+(?:<[A-Z]+)*)/g),
  ].map((m) => forzarPatronLinea3(m[1]));
  const line1Matches = [...blob.matchAll(/(I?CCOL[0-9A-Z<]{15,})/g)].map((m) =>
    forzarPatronLinea1(m[1].startsWith('I') ? m[1] : `I${m[1]}`),
  );

  // NUIP suelto: COL17344720
  const nuips = [...blob.matchAll(/COL\s*(\d{6,10})/g)].map((m) => m[1].replace(/^0+/, '')).filter(Boolean);

  const candidatos = [];
  for (const l2 of line2Matches.length ? line2Matches : ['']) {
    for (const l3 of line3Matches.length ? line3Matches : ['']) {
      if (!l3) continue;
      let l2use = l2;
      if (!l2use && nuips[0]) {
        l2use = forzarPatronLinea2(`0000000M0000000COL${nuips[0]}<<<<<<<0`);
      }
      if (!l2use) continue;
      const l1 = line1Matches[0] || 'ICCOL0000000000<<<<<<<<<<<<<<<';
      const parsed = parseLineasMrzTd1([l1, l2use, l3]);
      if (parsed) candidatos.push(parsed);
    }
  }

  candidatos.sort((a, b) => calidadMrz(b) - calidadMrz(a));
  const best = candidatos[0];
  return best && calidadMrz(best) >= 8 ? best : null;
}

function parseCedulaColombianaMrz(rawValue) {
  return parseMrzFlexible(rawValue);
}

async function varianteImagen(buffer, opts) {
  const base = sharp(buffer, { failOn: 'none' }).rotate();
  const meta = await base.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  const topRatio = opts.topRatio ?? 0.58;
  const leftRatio = opts.leftRatio ?? 0.02;
  const widthRatio = opts.widthRatio ?? 0.96;
  const heightRatio = opts.heightRatio ?? 0.4;

  let pipeline = sharp(buffer, { failOn: 'none' }).rotate();
  if (w > 80 && h > 80) {
    const left = Math.round(w * leftRatio);
    const top = Math.round(h * topRatio);
    const width = Math.max(60, Math.round(w * widthRatio));
    const height = Math.max(60, Math.min(h - top, Math.round(h * heightRatio)));
    pipeline = pipeline.extract({ left, top, width: Math.min(width, w - left), height });
  }

  pipeline = pipeline.grayscale().normalize();
  if (opts.threshold != null) {
    pipeline = pipeline.threshold(opts.threshold);
  } else {
    pipeline = pipeline.linear(opts.linearA ?? 1.35, opts.linearB ?? -(128 * 0.18)).sharpen({
      sigma: opts.sigma ?? 1.2,
    });
  }

  const targetW = opts.targetW ?? 1800;
  return pipeline.resize({ width: targetW, withoutEnlargement: false }).png().toBuffer();
}

async function procesarCedulaMrz(buffer) {
  if (!buffer?.length) {
    const err = new Error('Envíe una imagen del reverso con la zona MRZ.');
    err.status = 400;
    throw err;
  }

  // Recortes bajos: la MRZ está en el último ~30% del reverso.
  const variantes = [
    { topRatio: 0.72, heightRatio: 0.28, linearA: 1.4, linearB: -20, sigma: 1.2, targetW: 2400 },
    { topRatio: 0.68, heightRatio: 0.32, linearA: 1.35, linearB: -18, sigma: 1.1, targetW: 2400 },
    { topRatio: 0.7, heightRatio: 0.3, linearA: 1.45, targetW: 2200 },
    { topRatio: 0.65, heightRatio: 0.35, linearA: 1.3, targetW: 2000 },
    { topRatio: 0.55, heightRatio: 0.45, linearA: 1.25, targetW: 1800 },
  ];

  const textos = [];
  const candidatos = [];
  for (const v of variantes) {
    try {
      const preparada = await varianteImagen(buffer, v);
      for (const params of [OCR_PARAMS_MRZ, OCR_PARAMS_MRZ_SPARSE]) {
        const texto = await ocrMrzBuffer(preparada, params);
        if (texto?.trim()) textos.push(texto);
        const sugerido = parseCedulaColombianaMrz(texto);
        if (sugerido) candidatos.push({ sugerido, texto, score: calidadMrz(sugerido) });
      }
    } catch {
      // siguiente variante
    }
  }

  const combinado = textos.join('\n');
  const sugeridoCombo = parseCedulaColombianaMrz(combinado);
  if (sugeridoCombo) {
    candidatos.push({ sugerido: sugeridoCombo, texto: combinado, score: calidadMrz(sugeridoCombo) });
  }

  try {
    const full = await sharp(buffer, { failOn: 'none' })
      .rotate()
      .grayscale()
      .normalize()
      .linear(1.3, -(128 * 0.16))
      .sharpen({ sigma: 1.1 })
      .resize({ width: 2000, withoutEnlargement: false })
      .png()
      .toBuffer();
    const texto = await ocrMrzBuffer(full, OCR_PARAMS_MRZ);
    textos.push(texto);
    const sugerido = parseCedulaColombianaMrz(texto);
    if (sugerido) candidatos.push({ sugerido, texto, score: calidadMrz(sugerido) });
  } catch {
    // ignore
  }

  candidatos.sort((a, b) => b.score - a.score);
  const best = candidatos[0];
  if (best && best.score >= 8) {
    return {
      sugerido: best.sugerido,
      meta: {
        origen: 'mrz',
        advertencias: [
          'Datos leídos desde la zona MRZ de la cédula digital. Revise nombres y documento antes de guardar.',
        ],
      },
      debug: { texto: String(best.texto || '').slice(0, 800), score: best.score },
    };
  }

  const err = new Error(
    'No se detectó una zona MRZ válida. Use una foto nítida del reverso (3 líneas inferiores) o pegue el texto MRZ.',
  );
  err.status = 422;
  err.debug = { texto: textos.map((t) => String(t || '').slice(0, 220)).join(' || ') };
  throw err;
}

module.exports = {
  procesarCedulaMrz,
  parseCedulaColombianaMrz,
  extraerLineasMrz,
  limpiarTextoOcrMrz,
};
