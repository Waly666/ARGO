const sharp = require('sharp');
const { createWorker, PSM } = require('tesseract.js');
const { NUM_DOC_MIN_DIGITS, NUM_DOC_MAX_DIGITS, isValidNumDocDigits } = require('../utils/numDoc');

const SPLIT_RATIO = 0.5;
const MIN_RESPALDO_CHARS = 12;
const OCR_TARGET_WIDTH = 1700;
const OCR_MIN_WIDTH = 1400;

const OCR_PARAMS_GENERAL = {
  tessedit_pageseg_mode: String(PSM.AUTO),
  tessedit_char_whitelist: '',
};

const OCR_PARAMS_NUMERO = {
  tessedit_pageseg_mode: String(PSM.SINGLE_LINE),
  tessedit_char_whitelist: '0123456789.',
};

const OCR_PARAMS_NOMBRES = {
  tessedit_pageseg_mode: String(PSM.SINGLE_BLOCK),
  tessedit_char_whitelist: '',
};

/** Encabezado institucional (no confundir con etiquetas de campo en la zona de datos) */
const ENCABEZADO_RE =
  /\b(REPUBLICA|COLOMBIA|IDENTIFICACION PERSONAL|CEDULA DE CIUDADANIA|CEDULA DE CIUDADAN|REGISTRADOR|NACIONAL|MINISTERIO|INDICE|DERECHO|COLOMBIANA)\b/i;

const MESES = {
  ENE: '01', FEB: '02', MAR: '03', ABR: '04', MAY: '05', JUN: '06',
  JUL: '07', AGO: '08', SEP: '09', OCT: '10', NOV: '11', DIC: '12',
};

/** Palabras del encabezado / institucionales — nunca son nombres propios */
const PALABRA_INSTITUCIONAL = new Set([
  'REPUBLICA', 'COLOMBIA', 'IDENTIFICACION', 'PERSONAL', 'CEDULA', 'CIUDADANIA',
  'CIUDADAN', 'NUIP', 'NUMERO', 'REGISTRADOR', 'NACIONAL', 'MINISTERIO', 'DEFENSA',
  'INDICE', 'DERECHO', 'COLOMBIANA', 'REGISTRO', 'CIVIL', 'ESTADO', 'FIRMA',
  'DE', 'LA', 'EL', 'Y', 'DEL', 'LOS', 'LAS',
]);

function limpiarLineas(texto) {
  return String(texto || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function normalizarTexto(t) {
  return String(t || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s./+-:]/g, ' ');
}

function soloDigitos(s) {
  return String(s || '').replace(/\D/g, '');
}

/** Confusiones O/I solo dentro de un token ya numérico (nunca S→5: corrompe «NUMERO»). */
function corregirConfusionOcrDigitos(s) {
  return String(s || '')
    .replace(/[Oo]/g, '0')
    .replace(/[Il|]/g, '1');
}

/** Deja solo dígitos, puntos y espacios (quita letras sin convertirlas en dígitos). */
function soloCaracteresNumericos(s) {
  return String(s || '').replace(/[^\d.\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function digitosDesdeTokenNumerico(s, { corregirOcr = false } = {}) {
  let t = String(s || '');
  if (corregirOcr) t = corregirConfusionOcrDigitos(t);
  return soloDigitos(t);
}

function capitalizar(s) {
  if (!s) return '';
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Nombres y apellidos en mayúsculas (como en la cédula) */
function aMayusculas(s) {
  return String(s || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

async function dividirVertical(buffer) {
  const img = sharp(buffer);
  const meta = await img.metadata();
  const h = meta.height || 0;
  const w = meta.width || 0;
  if (h < 80 || w < 80) {
    const err = new Error('La imagen es demasiado pequeña. Use una foto más grande.');
    err.status = 400;
    throw err;
  }
  const corte = Math.round(h * SPLIT_RATIO);
  const frente = await img.clone().extract({ left: 0, top: 0, width: w, height: corte }).png().toBuffer();
  const respaldo =
    corte < h
      ? await img.clone().extract({ left: 0, top: corte, width: w, height: h - corte }).png().toBuffer()
      : null;
  return { frente, respaldo, altoTotal: h, corte, modo: 'vertical' };
}

async function dividirHorizontal(buffer) {
  const img = sharp(buffer);
  const meta = await img.metadata();
  const h = meta.height || 0;
  const w = meta.width || 0;
  if (h < 80 || w < 80) {
    const err = new Error('La imagen es demasiado pequeña. Use una foto más grande.');
    err.status = 400;
    throw err;
  }
  const corte = Math.round(w * SPLIT_RATIO);
  const frente = await img.clone().extract({ left: 0, top: 0, width: corte, height: h }).png().toBuffer();
  const respaldo =
    corte < w
      ? await img.clone().extract({ left: corte, top: 0, width: w - corte, height: h }).png().toBuffer()
      : null;
  return { frente, respaldo, anchoTotal: w, corte, modo: 'horizontal' };
}

/** vertical | horizontal | auto (por proporción de la imagen). */
async function dividirImagen(buffer, disposicion = 'auto') {
  const meta = await sharp(buffer).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  if (disposicion === 'vertical') return dividirVertical(buffer);
  if (disposicion === 'horizontal') return dividirHorizontal(buffer);
  if (w > h * 1.08) return dividirHorizontal(buffer);
  return dividirVertical(buffer);
}

function puntajeParseFrente(datos, texto) {
  let score = 0;
  if (datos.numDoc) score += 40;
  if (datos.apellido1) score += 25;
  if (datos.nombre1) score += 25;
  if (datos.fechaNac) score += 10;
  const t = String(texto || '');
  if (/APELLIDOS?/i.test(t)) score += 5;
  if (/NOMBRES?/i.test(t)) score += 5;
  if (/\d{1,3}(?:\.\d{3}){2,3}/.test(t)) score += 8;
  return score;
}

async function elegirMejorVariante(variantes) {
  let mejor = variantes[0];
  let mejorScore = -1;
  let mejorTexto = '';

  for (const variante of variantes) {
    const texto = await ocrBuffer(variante.buffer, OCR_PARAMS_GENERAL);
    const datos = parseFrente(texto, '');
    const score = puntajeParseFrente(datos, texto);
    if (score > mejorScore) {
      mejorScore = score;
      mejor = variante;
      mejorTexto = texto;
    }
  }

  return { variante: mejor, textoFrente: mejorTexto, score: mejorScore };
}

async function ocrSoloFrente(frenteBuffer) {
  const variantes = await generarVariantesOcr(frenteBuffer);
  const { variante: mejorVariante, textoFrente: textoFrenteBase } = await elegirMejorVariante(variantes);
  const frentePrep = mejorVariante.buffer;

  const zonaNumero = await recortarZonaNumero(frentePrep);
  const zonaNombres = await recortarZonaNombres(frentePrep);

  const textoNumero = await ocrBuffer(zonaNumero, OCR_PARAMS_NUMERO);
  const textoZonaNombres = await ocrBuffer(zonaNombres, OCR_PARAMS_NOMBRES);

  const textoFrente = textoNumero
    ? `${textoFrenteBase}\nNUMERO ${textoNumero}`
    : textoFrenteBase;

  const datosFrente = parseFrente(textoFrente, textoZonaNombres, textoNumero);
  return { datosFrente, textoFrente, textoZonaNombres, textoNumero };
}

async function validarImagenFrente(buffer) {
  const meta = await sharp(buffer).metadata();
  const h = meta.height || 0;
  const w = meta.width || 0;
  if (h < 80 || w < 80) {
    const err = new Error('La imagen es demasiado pequeña. Fotografíe solo el frente de la cédula.');
    err.status = 400;
    throw err;
  }
}

async function redimensionarParaOcr(buffer) {
  const meta = await sharp(buffer).metadata();
  const w = meta.width || 0;
  if (w <= 0) return buffer;
  if (w >= OCR_MIN_WIDTH && w <= OCR_TARGET_WIDTH) return buffer;
  return sharp(buffer)
    .resize(OCR_TARGET_WIDTH, null, { withoutEnlargement: false, kernel: 'lanczos3' })
    .png()
    .toBuffer();
}

/**
 * Tres variantes ligeras: base, alto contraste y binarizado suave.
 * Se elige la que mejor parsea antes del OCR por zonas.
 */
async function generarVariantesOcr(buffer) {
  const resized = await redimensionarParaOcr(buffer);
  const base = sharp(resized);

  const [vBase, vContraste, vBinarizado] = await Promise.all([
    base
      .clone()
      .grayscale()
      .normalize()
      .linear(1.18, -(128 * 0.14))
      .sharpen({ sigma: 1.1 })
      .png()
      .toBuffer(),
    base
      .clone()
      .grayscale()
      .normalize()
      .linear(1.45, -(128 * 0.22))
      .sharpen({ sigma: 1.35 })
      .png()
      .toBuffer(),
    base
      .clone()
      .grayscale()
      .normalize()
      .linear(1.55, -(128 * 0.28))
      .threshold(142)
      .png()
      .toBuffer(),
  ]);

  return [
    { id: 'base', buffer: vBase },
    { id: 'contraste', buffer: vContraste },
    { id: 'binarizado', buffer: vBinarizado },
  ];
}

/** Compatibilidad: primera variante (base) del pipeline multi-variante. */
async function prepararParaOcr(buffer) {
  const variantes = await generarVariantesOcr(buffer);
  return variantes[0].buffer;
}

/**
 * Banda izquierda-centro del NUMERO (foto a la derecha).
 * Más ancha y alta para no cortar el primer dígito (1.xxx.xxx.xxx).
 */
async function recortarZonaNumero(frenteBuffer) {
  const meta = await sharp(frenteBuffer).metadata();
  const h = meta.height || 0;
  const w = meta.width || 0;
  if (h < 120 || w < 80) return frenteBuffer;

  const left = Math.round(w * 0.02);
  const top = Math.round(h * 0.06);
  const width = Math.round(w * 0.68);
  const height = Math.round(h * 0.34);
  if (width < 40 || height < 30) return frenteBuffer;

  return sharp(frenteBuffer)
    .extract({ left, top, width, height })
    .grayscale()
    .normalize()
    .linear(1.25, -(128 * 0.15))
    .sharpen({ sigma: 1.35 })
    .png()
    .toBuffer();
}

/** Desde debajo del encabezado: apellidos + nombres (valor arriba, etiqueta abajo). */
async function recortarZonaNombres(frenteBuffer) {
  const meta = await sharp(frenteBuffer).metadata();
  const h = meta.height || 0;
  const w = meta.width || 0;
  if (h < 120 || w < 80) return frenteBuffer;
  const top = Math.round(h * 0.22);
  const height = Math.round(h * 0.58);
  const width = Math.round(w * 0.72);
  if (height < 60 || width < 60) return frenteBuffer;
  return sharp(frenteBuffer)
    .extract({ left: 0, top, width, height })
    .grayscale()
    .normalize()
    .linear(1.12, -(128 * 0.1))
    .sharpen({ sigma: 1.05 })
    .png()
    .toBuffer();
}

let workerPromise = null;
let ocrChain = Promise.resolve();

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('spa', 1, { logger: () => {} });
      await worker.setParameters(OCR_PARAMS_GENERAL);
      return worker;
    })();
  }
  return workerPromise;
}

async function ocrBuffer(buffer, params = null) {
  const run = async () => {
    const worker = await getWorker();
    if (params) {
      await worker.setParameters({ ...OCR_PARAMS_GENERAL, ...params });
    }
    try {
      const {
        data: { text },
      } = await worker.recognize(buffer);
      return text || '';
    } finally {
      if (params) {
        await worker.setParameters(OCR_PARAMS_GENERAL);
      }
    }
  };

  const result = ocrChain.then(run);
  ocrChain = result.catch(() => {});
  return result;
}

/** Artículos/conjunciones frecuentes en nombres compuestos (no invalidan la línea). */
const CONECTOR_NOMBRE = new Set(['DE', 'LA', 'EL', 'Y', 'DEL', 'LOS', 'LAS', 'SAN', 'SANTA']);

function contieneTextoInstitucional(linea) {
  const u = normalizarTexto(linea);
  if (!u) return true;
  if (ENCABEZADO_RE.test(u)) return true;
  if (/^IDENTIFICACION\s*PERSONAL$/.test(u)) return true;
  if (/^CEDULA\s*(DE\s*)?CIUDADAN/.test(u)) return true;
  if (/\b(CEDULA|CIUDADANIA|CIUDADAN|REPUBLICA|COLOMBIA|IDENTIFICACION|PERSONAL|NUMERO|NUIP)\b/.test(u)) {
    return true;
  }
  const tokens = u.split(/\s+/).filter(Boolean);
  const fuertes = tokens.filter((t) => PALABRA_INSTITUCIONAL.has(t) && !CONECTOR_NOMBRE.has(t));
  if (fuertes.length && fuertes.length >= Math.ceil(tokens.length * 0.5)) return true;
  return false;
}

function esLineaEncabezado(linea) {
  const u = normalizarTexto(linea);
  if (!u || u.length < 3) return true;
  if (/\d{1,3}(\.\d{3}){2,3}/.test(linea)) return false;
  return contieneTextoInstitucional(linea);
}

/** Distancia de edición pequeña para etiquetas OCR (NOMBFE, HOMBRES, APELLID0S…). */
function distanciaLevenshtein(a, b) {
  const s = String(a || '');
  const t = String(b || '');
  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const row = Array.from({ length: t.length + 1 }, (_, i) => i);
  for (let i = 1; i <= s.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= t.length; j++) {
      const tmp = row[j];
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[t.length];
}

function esEtiquetaCercana(palabra, objetivo, maxDist = 2) {
  const u = normalizarTexto(palabra).replace(/[^A-Z]/g, '');
  const o = normalizarTexto(objetivo).replace(/[^A-Z]/g, '');
  if (!u || !o) return false;
  if (u === o) return true;
  if (Math.abs(u.length - o.length) > maxDist) return false;
  return distanciaLevenshtein(u, o) <= maxDist;
}

function esEtiquetaApellidos(linea) {
  const u = normalizarTexto(linea).trim().replace(/\s+/g, ' ');
  if (!u || u.length > 36 || /NOMBR/.test(u)) return false;
  if (/^APELLIDOS?$/.test(u)) return true;
  // OCR deja basura: "APELLIDOS =— e"
  const letras = u.replace(/[^A-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const primera = letras.split(/\s+/)[0] || '';
  if (esEtiquetaCercana(primera, 'APELLIDOS', 2) || esEtiquetaCercana(primera, 'APELLIDO', 2)) return true;
  return /APELLIDOS?/.test(letras) && letras.length <= 24;
}

function esEtiquetaNombres(linea) {
  const u = normalizarTexto(linea).trim().replace(/\s+/g, ' ');
  if (!u || u.length > 32 || /APELLID/.test(u)) return false;
  if (/^NOMBRES?$/.test(u)) return true;
  const letras = u.replace(/[^A-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const primera = letras.split(/\s+/)[0] || '';
  // OCR frecuente: HOMBRES, NOMBFE, N0MBRES, "NOMBRES ."
  if (esEtiquetaCercana(primera, 'NOMBRES', 2) || esEtiquetaCercana(primera, 'NOMBRE', 2)) return true;
  return /^NOMBRES?\b/.test(letras) && letras.length <= 20;
}

function esLineaNombre(linea, numDoc) {
  if (!linea) return false;
  const t = linea.trim();
  if (t.length < 3) return false;
  if (esEtiquetaApellidos(t) || esEtiquetaNombres(t)) return false;
  if (ENCABEZADO_RE.test(normalizarTexto(t))) return false;
  if (/\b(CEDULA|CIUDADANIA|REPUBLICA|COLOMBIA|IDENTIFICACION|NUMERO|NUIP|FIRMA)\b/i.test(t)) return false;
  const digits = soloDigitos(t);
  if (numDoc && digits === numDoc) return false;
  if (digits.length >= 5) return false;
  const palabras = t.split(/\s+/).filter(Boolean);
  if (!palabras.length || palabras.length > 6) return false;
  const validas = palabras.filter((p) => {
    const w = normalizarTexto(p).replace(/[^A-Z]/g, '');
    if (w.length < 2) return false;
    if (CONECTOR_NOMBRE.has(w)) return true;
    if (PALABRA_INSTITUCIONAL.has(w)) return false;
    return true;
  });
  if (!validas.length) return false;
  if (validas.length / palabras.length < 0.5) return false;
  const letras = (t.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/g) || []).length;
  return letras >= 3 && letras / t.replace(/\s/g, '').length >= 0.65;
}

/** Etiqueta pequeña impresa debajo del valor (cédula colombiana) */
function esEtiquetaSola(linea, patron) {
  const u = normalizarTexto(linea).trim();
  return new RegExp(`^${patron}$`, 'i').test(u);
}

function valorDespuesEtiqueta(linea, etiquetaRegex) {
  const m = linea.match(new RegExp(`${etiquetaRegex}\\s*[:.]?\\s*(.+)$`, 'i'));
  return m ? m[1].trim() : '';
}

function indiceLineaNumDoc(lineas, numDoc) {
  if (!numDoc) return -1;
  for (let i = 0; i < lineas.length; i++) {
    const digits = soloDigitos(lineas[i]);
    if (digits === numDoc) return i;
    if (lineas[i].replace(/\D/g, '').includes(numDoc)) return i;
  }
  return -1;
}

/** Preferir NUIP CO de 8–10 dígitos; castigar basura de 12+ (letras convertidas). */
function puntajeCandidatoNumDoc(digits) {
  if (!isValidNumDocDigits(digits)) return -1;
  let score = digits.length * 10;
  if (digits.length === 10) score += 50;
  else if (digits.length === 8 || digits.length === 9) score += 20;
  else if (digits.length === 11) score += 5;
  if (digits.length >= 12) score -= 80;
  if (digits.startsWith('1') && digits.length === 10) score += 35;
  if (digits.startsWith('0')) score -= 40;
  if (digits.length === 7) score -= 25;
  return score;
}

/**
 * Recupera el 1 inicial perdido (4040044473 / 040044473 → 1040044473)
 * y NUIPs de 10 dígitos embebidos en basura más larga.
 */
function expandirCandidatosNumDoc(candidatos) {
  const out = [];
  for (const n of candidatos) {
    if (!n) continue;
    out.push(n);
    const embebido = String(n).match(/1\d{9}/g);
    if (embebido) out.push(...embebido);
    if (n.length === 9 && n.startsWith('0')) out.push(`1${n}`);
    // El «1.» inicial se confunde con 4/5: 4040044473 / 5040044473 → 1040044473
    if (n.length === 10 && /^[45]0/.test(n)) out.push(`1${n.slice(1)}`);
    // 5… basura típica de S→5 / ruido delante de un 1\d{9}
    if (n.length >= 11 && n.length <= 14) {
      const idx = n.indexOf('1');
      if (idx > 0 && idx <= 3 && n.length - idx >= 10) out.push(n.slice(idx, idx + 10));
    }
  }
  return out;
}

function elegirMejorNumDoc(candidatos) {
  const unicos = [...new Set(expandirCandidatosNumDoc(candidatos).filter((n) => isValidNumDocDigits(n)))];
  if (!unicos.length) return '';

  const buenos = unicos.filter((n) => n.length >= 8 && n.length <= 11);
  const pool = buenos.length ? buenos : unicos;

  const deDiezConUno = pool.filter((n) => n.length === 10 && n.startsWith('1'));
  if (deDiezConUno.length) {
    deDiezConUno.sort((a, b) => puntajeCandidatoNumDoc(b) - puntajeCandidatoNumDoc(a));
    return deDiezConUno[0];
  }

  const deDiez = pool.filter((n) => n.length === 10);
  if (deDiez.length === 1) return deDiez[0];
  if (deDiez.length > 1) {
    deDiez.sort((a, b) => puntajeCandidatoNumDoc(b) - puntajeCandidatoNumDoc(a));
    return deDiez[0];
  }

  pool.sort((a, b) => puntajeCandidatoNumDoc(b) - puntajeCandidatoNumDoc(a) || b.length - a.length);
  return pool[0];
}

/**
 * Extrae NUIP/cédula con puntos de miles (1.040.044.473).
 * No convierte letras sueltas (S/O de «NUMERO») en dígitos pegados al número.
 */
function extraerNumDocDigitos(texto, lineas, { corregirOcr = false } = {}) {
  const raw = String(texto || '');
  const limpio = soloCaracteresNumericos(corregirOcr ? corregirConfusionOcrDigitos(soloCaracteresNumericos(raw)) : raw);
  const candidatos = [];

  const pushDigits = (digits) => {
    if (digits && isValidNumDocDigits(digits)) candidatos.push(digits);
  };
  const pushToken = (s) => pushDigits(digitosDesdeTokenNumerico(s, { corregirOcr }));

  // Formato CO: 1.040.044.473 o 1 040.044.473 (grupos de 3)
  const patronEstricto = /(\d{1,3}(?:[.\s]\d{3}){2,3})/g;
  for (const fuente of [limpio, soloCaracteresNumericos(raw)]) {
    let m;
    const re = new RegExp(patronEstricto.source, 'g');
    while ((m = re.exec(fuente)) !== null) pushToken(m[1]);
  }

  const fuentesLinea = [...(lineas || []), ...limpiarLineas(raw)];
  for (const l of fuentesLinea) {
    const numLinea = soloCaracteresNumericos(l);
    if (!numLinea) continue;
    let m;
    const re = new RegExp(patronEstricto.source, 'g');
    while ((m = re.exec(numLinea)) !== null) pushToken(m[1]);
    const letras = (String(l).match(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/g) || []).length;
    const digs = soloDigitos(numLinea);
    if (letras <= 2 && digs.length >= 8 && digs.length <= 11) pushDigits(digs);
  }

  // Planos 8–11 y posibles 10 dígitos dentro de basura larga
  const planos = limpio.match(/\d{8,14}/g) || [];
  for (const n of planos) pushDigits(n);

  return elegirMejorNumDoc(candidatos);
}

function asignarNombrePartes(destino, texto) {
  const palabras = String(texto || '')
    .trim()
    .split(/\s+/)
    .filter((p) => {
      const w = normalizarTexto(p).replace(/[^A-Z]/g, '');
      if (w.length < 2 && !CONECTOR_NOMBRE.has(w)) return false;
      if (CONECTOR_NOMBRE.has(w)) return true;
      return !PALABRA_INSTITUCIONAL.has(w);
    });
  if (!palabras.length) return;
  destino.parte1 = palabras[0];
  destino.parte2 = palabras.slice(1).join(' ');
}

function indiceEtiqueta(lineas, tipo) {
  for (let i = 0; i < lineas.length; i++) {
    if (tipo === 'apellidos' && esEtiquetaApellidos(lineas[i])) return i;
    if (tipo === 'nombres' && esEtiquetaNombres(lineas[i])) return i;
  }
  return -1;
}

/**
 * Layout cédula colombiana (lectura de arriba hacia abajo):
 *   [dato apellidos]  ← valor (a veces OCR parte en 2 líneas: BEDOYA / CARDONA)
 *   APELLIDOS         ← etiqueta pequeña DEBAJO del dato
 *   [dato nombres]    ← valor (YESSICA / YULIANA en líneas distintas)
 *   NOMBRES           ← etiqueta pequeña DEBAJO del dato
 * Une líneas de nombre consecutivas encima de la etiqueta.
 */
function valorEncimaEtiqueta(lineas, idxEtiqueta, numDoc, excluirLinea = '', idxMin = 0) {
  if (idxEtiqueta < 0) return '';

  const lineaEtiqueta = lineas[idxEtiqueta] || '';
  const enMismaLinea = lineaEtiqueta.match(/^(.+?)\s+(APELLIDOS?|NOMBRES?|HOMBRES?)\s*$/i);
  if (enMismaLinea) {
    const val = enMismaLinea[1].trim();
    if (normalizarTexto(val) !== normalizarTexto(excluirLinea) && esLineaNombre(val, numDoc)) {
      return val;
    }
  }

  const fragmentos = [];
  let modo = null; // single = palabras sueltas (YESSICA / YULIANA); multi = una sola línea
  for (let j = idxEtiqueta - 1; j >= idxMin; j--) {
    const l = lineas[j];
    if (esEtiquetaApellidos(l) || esEtiquetaNombres(l)) break;
    if (excluirLinea && normalizarTexto(l) === normalizarTexto(excluirLinea)) continue;
    if (!esLineaNombre(l, numDoc)) {
      if (fragmentos.length) break;
      continue;
    }
    const nPalabras = l.trim().split(/\s+/).length;
    if (!fragmentos.length) {
      fragmentos.unshift(l);
      modo = nPalabras === 1 ? 'single' : 'multi';
      // Una línea con 2+ palabras ya es el valor completo del campo
      if (modo === 'multi') break;
      continue;
    }
    // Solo unir otra línea si ambas son de una sola palabra (OCR partió el nombre)
    if (modo === 'single' && nPalabras === 1 && fragmentos.length < 2) {
      fragmentos.unshift(l);
      break;
    }
    // No absorber el bloque de arriba (apellidos) dentro de nombres
    break;
  }
  return fragmentos.join(' ').trim();
}

/**
 * Apellidos (arriba) y nombres (abajo) en cédula CO.
 * Orden fijo tras el número: bloque1=apellidos, bloque2=nombres.
 */
function parseNombres(lineasZona, numDoc, lineasCompletas) {
  let apellido1 = '';
  let apellido2 = '';
  let nombre1 = '';
  let nombre2 = '';

  const idxDoc = indiceLineaNumDoc(lineasCompletas, numDoc);
  const zonaDesdeDoc = idxDoc >= 0 ? lineasCompletas.slice(idxDoc + 1) : [];
  const lineasZonaFiltradas = lineasZona.filter(
    (l) => !contieneTextoInstitucional(l) || esEtiquetaApellidos(l) || esEtiquetaNombres(l)
  );

  const opciones = [lineasZonaFiltradas, lineasZona, zonaDesdeDoc, lineasCompletas].filter((l) => l.length > 0);
  let lineasTrabajo = opciones[0] || [];
  let mejorScore = -1;
  for (const opt of opciones) {
    let score = 0;
    if (indiceEtiqueta(opt, 'apellidos') >= 0) score += 2;
    if (indiceEtiqueta(opt, 'nombres') >= 0) score += 2;
    const nomLines = opt.filter((l) => esLineaNombre(l, numDoc)).length;
    score += Math.min(nomLines, 4);
    if (score > mejorScore) {
      mejorScore = score;
      lineasTrabajo = opt;
    }
  }

  const tomarValor = (val) => {
    if (!val || !esLineaNombre(val, numDoc)) return null;
    const p = { parte1: '', parte2: '' };
    asignarNombrePartes(p, val);
    if (!p.parte1) return null;
    const p1n = normalizarTexto(p.parte1);
    if (PALABRA_INSTITUCIONAL.has(p1n) && !CONECTOR_NOMBRE.has(p1n)) return null;
    if (p.parte2) {
      const toks = normalizarTexto(p.parte2).split(/\s+/);
      if (toks.every((t) => PALABRA_INSTITUCIONAL.has(t) && !CONECTOR_NOMBRE.has(t))) p.parte2 = '';
    }
    return p;
  };

  const aplicarAp = (p) => {
    if (!p) return;
    apellido1 = p.parte1;
    apellido2 = p.parte2;
  };
  const aplicarNom = (p) => {
    if (!p) return;
    nombre1 = p.parte1;
    nombre2 = p.parte2;
  };

  let idxAp = indiceEtiqueta(lineasTrabajo, 'apellidos');
  let idxNom = indiceEtiqueta(lineasTrabajo, 'nombres');

  if (idxNom >= 0 && idxAp >= 0 && idxNom < idxAp) {
    for (let i = idxAp + 1; i < lineasTrabajo.length; i++) {
      if (esEtiquetaNombres(lineasTrabajo[i])) {
        idxNom = i;
        break;
      }
    }
  }

  if (idxAp >= 0) {
    aplicarAp(tomarValor(valorEncimaEtiqueta(lineasTrabajo, idxAp, numDoc, '', 0)));
  }

  if (idxNom >= 0 && (idxAp < 0 || idxNom > idxAp)) {
    const excl = `${apellido1} ${apellido2}`.trim();
    const min = idxAp >= 0 ? idxAp + 1 : 0;
    aplicarNom(tomarValor(valorEncimaEtiqueta(lineasTrabajo, idxNom, numDoc, excl, min)));
  }

  // Etiqueta APELLIDOS no vista, pero sí NOMBRES: apellidos = líneas de nombre encima del valor de nombres
  if (!apellido1 && idxNom >= 0) {
    const exclNom = normalizarTexto(`${nombre1} ${nombre2}`.trim());
    const arriba = [];
    const desde = idxNom - 1;
    for (let i = desde; i >= 0 && arriba.length < 4; i--) {
      const l = lineasTrabajo[i];
      if (esEtiquetaApellidos(l) || esEtiquetaNombres(l)) {
        if (esEtiquetaApellidos(l)) {
          const v = valorEncimaEtiqueta(lineasTrabajo, i, numDoc, exclNom, 0);
          if (v) aplicarAp(tomarValor(v));
        }
        break;
      }
      if (!esLineaNombre(l, numDoc)) continue;
      if (exclNom && normalizarTexto(l) === exclNom) continue;
      if (nombre1 && normalizarTexto(l).includes(normalizarTexto(nombre1))) continue;
      arriba.unshift(l);
    }
    if (!apellido1 && arriba.length) aplicarAp(tomarValor(arriba.join(' ')));
  }

  // Etiqueta NOMBRES no vista: líneas después de APELLIDOS
  if (!nombre1 && idxAp >= 0) {
    const despues = [];
    for (let i = idxAp + 1; i < lineasTrabajo.length && despues.length < 3; i++) {
      const l = lineasTrabajo[i];
      if (esEtiquetaNombres(l) || esEtiquetaApellidos(l)) continue;
      if (esLineaNombre(l, numDoc)) despues.push(l);
    }
    const exclAp = normalizarTexto(`${apellido1} ${apellido2}`);
    const utiles = despues.filter((l) => normalizarTexto(l) !== exclAp);
    if (utiles.length) aplicarNom(tomarValor(utiles.join(' ')));
  }

  // Sin etiquetas: primeros dos bloques de nombre tras el documento
  if (!apellido1 || !nombre1) {
    const candidatos = lineasTrabajo.filter((l) => esLineaNombre(l, numDoc));
    // Agrupar líneas sueltas consecutivas ya viene en candidatos línea a línea;
    // si hay 2+ líneas de una sola palabra, juntar de a 2
    const bloques = [];
    let i = 0;
    while (i < candidatos.length && bloques.length < 2) {
      const palabras = candidatos[i].trim().split(/\s+/);
      if (palabras.length === 1 && i + 1 < candidatos.length && candidatos[i + 1].trim().split(/\s+/).length === 1) {
        bloques.push(`${candidatos[i]} ${candidatos[i + 1]}`);
        i += 2;
      } else {
        bloques.push(candidatos[i]);
        i += 1;
      }
    }
    if (!apellido1 && bloques[0]) aplicarAp(tomarValor(bloques[0]));
    if (!nombre1 && bloques[1]) {
      const p = tomarValor(bloques[1]);
      if (p && normalizarTexto(p.parte1) !== normalizarTexto(apellido1)) aplicarNom(p);
    }
  }

  // Si solo hay nombres y el “nombre” parece el bloque de arriba mal asignado, no tocar.
  // Si hay nombres pero no apellidos y hay otro bloque distinto, usarlo.
  if (nombre1 && !apellido1) {
    const candidatos = lineasTrabajo.filter((l) => {
      if (!esLineaNombre(l, numDoc)) return false;
      const n = normalizarTexto(l);
      return n !== normalizarTexto(nombre1) && n !== normalizarTexto(`${nombre1} ${nombre2}`.trim());
    });
    if (candidatos.length) aplicarAp(tomarValor(candidatos.length >= 2 ? `${candidatos[0]} ${candidatos[1]}` : candidatos[0]));
  }

  if (apellido1 && !nombre1) {
    const candidatos = lineasTrabajo.filter((l) => {
      if (!esLineaNombre(l, numDoc)) return false;
      const n = normalizarTexto(l);
      return n !== normalizarTexto(apellido1) && n !== normalizarTexto(`${apellido1} ${apellido2}`.trim());
    });
    if (candidatos.length) aplicarNom(tomarValor(candidatos.length >= 2 ? `${candidatos[0]} ${candidatos[1]}` : candidatos[0]));
  }

  return {
    apellido1: aMayusculas(apellido1),
    apellido2: aMayusculas(apellido2),
    nombre1: aMayusculas(nombre1),
    nombre2: aMayusculas(nombre2),
  };
}

function parseFechaIso(lineas, texto) {
  const re = /(\d{1,2})[/. -](\d{1,2})[/. -](\d{2,4})/g;
  let m;
  const t = `${lineas.join(' ')} ${texto}`;
  while ((m = re.exec(t)) !== null) {
    let y = parseInt(m[3], 10);
    if (y < 100) y += 2000;
    const mm = parseInt(m[2], 10);
    const dd = parseInt(m[1], 10);
    if (y > 1900 && y < 2100 && mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      return `${y}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }
  }
  return '';
}

function parseFrente(textoCompleto, textoZonaNombres, textoZonaNumero = '') {
  const lineasCompletas = limpiarLineas(textoCompleto);
  const lineasZona = limpiarLineas(textoZonaNombres);
  const lineasNumero = limpiarLineas(textoZonaNumero);

  const candidatosNum = [];
  if (textoZonaNumero) {
    const n = extraerNumDocDigitos(textoZonaNumero, lineasNumero, { corregirOcr: true });
    if (n) candidatosNum.push(n);
  }
  {
    const n = extraerNumDocDigitos(textoCompleto, lineasCompletas, { corregirOcr: true });
    if (n) candidatosNum.push(n);
  }
  const numDocStr = elegirMejorNumDoc(candidatosNum);
  const nombres = parseNombres(lineasZona, numDocStr, lineasCompletas);
  const fechaNac = parseFechaIso(lineasCompletas, textoCompleto);

  let expedida = '';
  const norm = normalizarTexto(textoCompleto);
  const expMatch = norm.match(/EXPEDIC[A-Z]*\s+EN\s+([A-Z\s]{3,40})/);
  if (expMatch) expedida = expMatch[1].trim().slice(0, 80);

  const { parseNumDoc: toNumDoc } = require('../utils/numDoc');
  const numDoc = toNumDoc(numDocStr) ?? undefined;
  return {
    tipoDoc: '1',
    numDoc,
    expedida,
    ...nombres,
    fechaNac,
  };
}

function esEtiquetaGsRh(linea) {
  const u = normalizarTexto(linea).trim();
  return /G\.?\s*S\.?\s*RH/.test(u) && u.length <= 24;
}

function esEtiquetaSexo(linea) {
  const u = normalizarTexto(linea).trim();
  return u === 'SEXO' || /^SEXO\s*\.?$/.test(u);
}

function esEtiquetaExpedicion(linea) {
  const u = normalizarTexto(linea);
  return /FECHA\s+Y\s+LUGAR\s+DE\s+EXPEDIC/.test(u);
}

function indiceLineaPorEtiqueta(lineas, testEtiqueta) {
  for (let i = 0; i < lineas.length; i++) {
    if (testEtiqueta(lineas[i])) return i;
  }
  return -1;
}

/** Dato en la línea inmediatamente ENCIMA de la etiqueta (layout respaldo cédula CO) */
function datoEncimaEtiqueta(lineas, idxEtiqueta) {
  if (idxEtiqueta <= 0) return '';

  const lineaEtiqueta = lineas[idxEtiqueta] || '';

  if (esEtiquetaGsRh(lineaEtiqueta)) {
    const enLinea = lineaEtiqueta.match(/^(.+?)\s+G\.?\s*S\.?\s*RH/i);
    if (enLinea) return enLinea[1].trim();
  }
  if (esEtiquetaSexo(lineaEtiqueta)) {
    const enLinea = lineaEtiqueta.match(/^(.+?)\s+SEXO\s*$/i);
    if (enLinea) return enLinea[1].trim();
  }
  if (esEtiquetaExpedicion(lineaEtiqueta)) {
    const enLinea = lineaEtiqueta.match(/^(.+?)\s+FECHA\s+Y\s+LUGAR/i);
    if (enLinea) return enLinea[1].trim();
  }

  return lineas[idxEtiqueta - 1] || '';
}

function parseGeneroDesdeLinea(linea) {
  if (!linea) return '';
  const t = normalizarTexto(linea).trim();
  if (t === 'M' || t === 'F') return t;
  if (t.startsWith('MASC')) return 'M';
  if (t.startsWith('FEM')) return 'F';
  const m = t.match(/\b(M|F)\b/);
  return m ? m[1] : '';
}

function parseTipoSangreDesdeLinea(linea) {
  if (!linea) return '';
  const compact = String(linea).match(/\b(AB|A|B|O)\s*([+-])/i);
  if (compact) return `${compact[1].toUpperCase()}${compact[2]}`;
  const t = normalizarTexto(linea);
  if (/\bPOSITIVO\b/.test(t) && /\b(AB|A|B|O)\b/.test(t)) {
    const tipo = t.match(/\b(AB|A|B|O)\b/);
    return tipo ? `${tipo[1]}+` : '';
  }
  if (/\bNEGATIVO\b/.test(t) && /\b(AB|A|B|O)\b/.test(t)) {
    const tipo = t.match(/\b(AB|A|B|O)\b/);
    return tipo ? `${tipo[1]}-` : '';
  }
  return '';
}

const MESES_TEXTO = /\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC|ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/gi;

function quitarFechasDeLinea(linea) {
  return String(linea || '')
    .replace(/\d{1,2}[-\s/][A-ZÁÉÍÓÚÑ]{3,}[-\s/]\d{2,4}/gi, ' ')
    .replace(/\d{1,2}[/. -]\d{1,2}[/. -]\d{2,4}/g, ' ')
    .replace(/\b\d{1,2}\s*(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\w*\s*\d{2,4}\b/gi, ' ')
    .replace(MESES_TEXTO, ' ')
    .replace(/\b\d{1,4}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extraerCiudadExpedicion(linea) {
  if (!linea) return '';
  const sinFecha = quitarFechasDeLinea(linea);
  if (!sinFecha) return '';

  const palabras = sinFecha.split(/\s+/).filter((p) => {
    const w = normalizarTexto(p);
    if (w.length < 3) return false;
    if (PALABRA_INSTITUCIONAL.has(w)) return false;
    if (MESES[w.slice(0, 3)]) return false;
    return /^[A-Za-zÁÉÍÓÚÑ]/.test(p);
  });

  if (!palabras.length) return '';

  const ciudad = palabras.filter((p) => {
    const u = normalizarTexto(p);
    return u.length >= 4 && !/^(DE|LA|EL|Y|EN)$/.test(u);
  });

  const usar = ciudad.length ? ciudad : palabras;
  return capitalizar(usar.join(' ').slice(0, 80));
}

/**
 * Respaldo cédula CO — dato ARRIBA, etiqueta ABAJO:
 *   O+  →  G.S. RH
 *   M   →  SEXO
 *   fecha + ciudad  →  FECHA Y LUGAR DE EXPEDICION (solo ciudad, sin fecha)
 */
function parseGenero(texto, lineas) {
  const lineasLimpias = lineas || limpiarLineas(texto);
  const idx = indiceLineaPorEtiqueta(lineasLimpias, esEtiquetaSexo);
  if (idx >= 0) {
    const g = parseGeneroDesdeLinea(datoEncimaEtiqueta(lineasLimpias, idx));
    if (g) return g;
  }
  return '';
}

function parseTipoSangre(texto, lineas) {
  const lineasLimpias = lineas || limpiarLineas(texto);
  const idx = indiceLineaPorEtiqueta(lineasLimpias, esEtiquetaGsRh);
  if (idx >= 0) {
    const ts = parseTipoSangreDesdeLinea(datoEncimaEtiqueta(lineasLimpias, idx));
    if (ts) return ts;
  }
  return '';
}

function parseExpedicion(texto, lineas) {
  const lineasLimpias = lineas || limpiarLineas(texto);
  const idx = indiceLineaPorEtiqueta(lineasLimpias, esEtiquetaExpedicion);
  if (idx >= 0) {
    for (let j = idx - 1; j >= 0 && j >= idx - 3; j--) {
      const ciudad = extraerCiudadExpedicion(lineasLimpias[j]);
      if (ciudad) return ciudad;
    }
    const encima = datoEncimaEtiqueta(lineasLimpias, idx);
    const ciudad = extraerCiudadExpedicion(encima);
    if (ciudad) return ciudad;
  }
  return '';
}

function parseRespaldo(texto) {
  if (!texto || normalizarTexto(texto).replace(/\s/g, '').length < MIN_RESPALDO_CHARS) {
    return { genero: '', tipoSangre: '', expedida: '', detectado: false };
  }
  const lineas = limpiarLineas(texto);
  return {
    genero: parseGenero(texto, lineas),
    tipoSangre: parseTipoSangre(texto, lineas),
    expedida: parseExpedicion(texto, lineas),
    detectado: true,
  };
}

/** Solo frente: documento, nombres, apellidos y fecha de nacimiento. */
async function procesarCedulaImagen(buffer) {
  await validarImagenFrente(buffer);
  const { datosFrente, textoFrente, textoZonaNombres, textoNumero } = await ocrSoloFrente(buffer);

  const advertencias = [];
  if (!datosFrente.numDoc) advertencias.push('No se detectó el número de documento (campo NUMERO).');
  if (!datosFrente.apellido1) advertencias.push('No se detectaron apellidos (línea sobre la etiqueta APELLIDOS).');
  if (!datosFrente.nombre1) advertencias.push('No se detectaron nombres (línea sobre la etiqueta NOMBRES).');
  advertencias.push('Revise el número completo (con todos los dígitos) y los dos nombres; el OCR a veces omite uno.');
  advertencias.push('Género, tipo de sangre, expedición y demás datos debe digitirlos manualmente.');

  return {
    sugerido: {
      tipoDoc: datosFrente.tipoDoc,
      numDoc: datosFrente.numDoc,
      apellido1: datosFrente.apellido1,
      apellido2: datosFrente.apellido2,
      nombre1: datosFrente.nombre1,
      nombre2: datosFrente.nombre2,
      fechaNac: datosFrente.fechaNac,
    },
    meta: {
      soloFrente: true,
      advertencias,
    },
    debug: {
      textoFrente: textoFrente.slice(0, 2000),
      textoZonaNombres: textoZonaNombres.slice(0, 1500),
      textoNumero: (textoNumero || '').slice(0, 400),
    },
  };
}

module.exports = {
  procesarCedulaImagen,
  dividirVertical,
  dividirHorizontal,
  parseFrente,
  parseRespaldo,
};
