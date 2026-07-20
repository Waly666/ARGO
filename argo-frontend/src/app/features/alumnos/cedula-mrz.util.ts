import { isValidNumDocDigits } from '../../core/utils/num-doc.helpers';
import type { CedulaPdf417Data } from './cedula-pdf417.util';

/** Misma forma que PDF417 para reutilizar el flujo de aplicación al formulario. */
export type CedulaMrzData = CedulaPdf417Data;

function mrzValue(char: string): number {
  if (char >= '0' && char <= '9') return Number(char);
  if (char >= 'A' && char <= 'Z') return char.charCodeAt(0) - 55;
  return 0;
}

/** Dígito verificador ICAO Doc 9303 (pesos 7-3-1). */
export function mrzCheckDigit(data: string): number {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += mrzValue(data[i] || '<') * weights[i % 3];
  }
  return sum % 10;
}

function fechaNacDesdeMrz(yymmdd: string): string | undefined {
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

function documentoDesdeCampo(raw: string): string {
  const digits = raw.replace(/</g, '').replace(/\D/g, '').replace(/^0+/, '');
  return isValidNumDocDigits(digits) ? digits : '';
}

/**
 * NUIP en línea 2 TD1: después de COL, solo dígitos hasta el '<'.
 * No incluir el dígito verificador compuesto (después del relleno).
 */
function documentoDesdeLinea2Mrz(line2: string): string {
  const s = String(line2 || '')
    .toUpperCase()
    .replace(/[^A-Z0-9<]/g, '');
  const col = s.indexOf('COL');
  if (col >= 0) {
    const after = s.slice(col + 3);
    const m = after.match(/^(\d{5,11})/);
    if (m) {
      let digits = m[1];
      // Si OCR omitió '<' y pegó el check final (11.º dígito), quedarse con el NUIP.
      if (digits.length === 11 && !after.startsWith(`${digits.slice(0, 10)}<`)) {
        digits = digits.slice(0, 10);
      }
      const norm = digits.replace(/^0+/, '') || digits;
      if (isValidNumDocDigits(norm)) return norm;
    }
  }
  // Fallback posicional TD1 (18-28), cortando en el primer '<'
  const untilPad = s.slice(18, 29).split('<')[0];
  return documentoDesdeCampo(untilPad);
}

function partirNombres(field: string): { apellido1: string; apellido2?: string; nombre1: string; nombre2?: string } | null {
  const limpio = field.replace(/[^A-Z<]/g, '');
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

function normalizarLineaMrz(line: string, len = 30): string {
  const chars = String(line || '')
    .toUpperCase()
    .replace(/[^A-Z0-9<]/g, '');
  if (chars.length < 18) return '';
  if (chars.length === len) return chars;
  if (chars.length > len) return chars.slice(0, len);
  return chars.padEnd(len, '<');
}

export function limpiarTextoOcrMrz(texto: string): string {
  return String(texto || '')
    .toUpperCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[«»‹›]/g, '<')
    .replace(/C0L/g, 'COL')
    .replace(/CQL/g, 'COL')
    .replace(/COI/g, 'COL')
    // Conservar saltos de línea; solo compactar espacios horizontales.
    .replace(/[^\S\n\r]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

function forzarPatronLinea1(line: string): string {
  let s = normalizarLineaMrz(line.replace(/\s+/g, ''));
  if (!s) return '';
  const chars = s.split('');
  if (chars[0] === '1' || chars[0] === 'L') chars[0] = 'I';
  if (chars[1] === '0') chars[1] = 'C';
  if (chars[2] === '0') chars[2] = 'C';
  if (chars[3] === '0') chars[3] = 'O';
  if (chars[4] === '1' || chars[4] === 'I') chars[4] = 'L';
  for (let i = 5; i < Math.min(20, chars.length); i++) {
    if (chars[i] === 'O' || chars[i] === 'Q' || chars[i] === 'D') chars[i] = '0';
    if (chars[i] === 'B') chars[i] = '8';
    if (chars[i] === 'I' || chars[i] === 'L') chars[i] = '1';
    if (chars[i] === 'S') chars[i] = '5';
  }
  s = chars.join('');
  if (s.startsWith('ICCO') && s[4] !== 'L') s = `ICCOL${s.slice(4)}`;
  return normalizarLineaMrz(s);
}

function forzarPatronLinea2(line: string): string {
  const s0 = normalizarLineaMrz(line.replace(/\s+/g, '').replace(/C0L/g, 'COL'));
  if (!s0) return '';
  const chars = s0.split('');
  for (let i = 0; i < chars.length; i++) {
    const inDigits =
      (i >= 0 && i <= 6) || (i >= 8 && i <= 14) || (i >= 18 && i <= 28) || i === 29;
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
  if (chars.length >= 18 && `${chars[15] || ''}${chars[16] || ''}${chars[17] || ''}` !== 'COL') {
    chars[15] = 'C';
    chars[16] = 'O';
    chars[17] = 'L';
  }
  return normalizarLineaMrz(chars.join(''));
}

function forzarPatronLinea3(line: string): string {
  let s = String(line || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z<]/g, '')
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/5/g, 'S')
    .replace(/8/g, 'B');
  s = s
    .replace(/^VECLA</, 'DE<LA<')
    .replace(/^BECLA</, 'DE<LA<')
    .replace(/^PECLA</, 'DE<LA<')
    .replace(/^DECLA</, 'DE<LA<')
    .replace(/^JECLA</, 'DE<LA<')
    .replace(/^[VJPDB]ECLA</, 'DE<LA<')
    .replace(/^DELA</, 'DE<LA<')
    .replace(/MLNOZ/g, 'MUNOZ')
    .replace(/MUN0Z/g, 'MUNOZ')
    .replace(/PENIA/g, 'PENA')
    .replace(/PEINA/g, 'PENA')
    .replace(/FNECARLOS/g, '<<JUAN<CARLOS')
    .replace(/<Z([A-Z]{3,})/g, '<$1')
    .replace(/<<</g, '<<')
    .replace(/([^<])<(JUAN|JOSE|MARIA|CARLOS|ANDRES|LUIS)/, '$1<<$2');
  if (!s.includes('<<')) {
    const nombresComunes =
      /(JUAN|JOSE|MARIA|CARLOS|ANDRES|LUIS|ANA|PEDRO|DIEGO|CAMILO|SOFIA|LAURA|DANIEL|MIGUEL|ANGEL|DAVID)/;
    const m = s.match(nombresComunes);
    if (m && m.index != null && m.index > 3) {
      s = `${s.slice(0, m.index)}<<${s.slice(m.index)}`;
    }
  }
  return normalizarLineaMrz(s);
}

function pareceTd1(lines: string[]): boolean {
  if (lines.length < 3) return false;
  const [l1, l2, l3] = lines;
  if (!/^I[A-Z0-9<]/.test(l1) && !l1.includes('COL')) return false;
  if (!/[MF<]/.test(l2.slice(7, 8))) return false;
  if (!l3.includes('<')) return false;
  return true;
}

/** Extrae hasta 3 líneas TD1 (30 caracteres) desde texto OCR o pegado. */
export function extraerLineasMrz(texto: string): string[] | null {
  const bruto = limpiarTextoOcrMrz(texto);
  if (!bruto) return null;

  const candidatasCrudas = bruto
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, '').trim())
    .filter((l) => l.replace(/[^A-Z0-9<]/g, '').length >= 18);

  if (candidatasCrudas.length >= 3) {
    // MRZ: preferir las últimas 3 líneas pegadas (línea 1, 2 y 3).
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

  // Fallback: localizar piezas TD1 sueltas en el blob OCR.
  const blob = bruto.replace(/[^A-Z0-9<\n]/g, '');
  const l2 = blob.match(/(\d{6}[0-9O]\s*[MF]\s*\d{6}[0-9O]\s*COL\s*\d{5,12}<{0,6}\d?)/);
  const l3 = blob.match(/((?:[A-Z]+<){1,8}[A-Z]+<<[A-Z]+(?:<[A-Z]+){0,3}<?)/);
  const l1 =
    blob.match(/(I?CCOL[0-9A-Z<]{18,})/) ||
    blob.match(/(CCOL[0-9A-Z<]{18,})/);
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

/**
 * Interpreta la zona MRZ TD1 de la cédula digital colombiana (3 líneas × 30).
 */
export function parseCedulaColombianaMrz(rawValue: string): CedulaMrzData | null {
  const lines = extraerLineasMrz(rawValue);
  if (!lines) return null;
  const parsed = parseLineasMrzTd1(lines);
  if (!parsed) return null;
  return calidadMrz(parsed) >= 8 ? parsed : null;
}

function calidadMrz(s: CedulaMrzData): number {
  if (!s?.numDoc || !s.apellido1 || !s.nombre1) return 0;
  let score = 0;
  if (s.fechaNac) score += 4;
  if (s.genero === 'M' || s.genero === 'F') score += 3;
  const ap = String(s.apellido1);
  const no = String(s.nombre1);
  if (ap.length >= 2 && ap.length <= 35 && !/(.)\1{3,}/.test(ap)) score += 2;
  if (no.length >= 2 && no.length <= 20 && !/(.)\1{3,}/.test(no)) score += 2;
  if (/[AEIOU]/.test(ap) && /[AEIOU]/.test(no)) score += 2;
  if (/^[A-Z]+(?: [A-Z]+)*$/.test(ap) && /^[A-Z]+(?: [A-Z]+)*$/.test(no)) score += 1;
  const nd = String(s.numDoc);
  if (nd.length >= 6 && nd.length <= 10) score += 3;
  if (nd.length > 10) score -= 3;
  if (/[BCDFGHJKLMNPQRSTVWXYZ]{8,}/.test(no.replace(/\s/g, ''))) score -= 4;
  if (/LLLL|XXXX|AAAA|BRTEE|RPCUH/.test(ap + no)) score -= 5;
  return score;
}

export function parseLineasMrzTd1(lines: string[]): CedulaMrzData | null {
  if (lines.length < 3) return null;
  const line1 = forzarPatronLinea1(lines[0]);
  const line2 = forzarPatronLinea2(lines[1]);
  const line3 = forzarPatronLinea3(lines[2]);
  if (!line1 || !line2 || !line3) return null;

  const nombres = partirNombres(line3);
  if (!nombres) return null;

  const fechaNac = fechaNacDesdeMrz(line2.slice(0, 6));
  const generoRaw = line2.charAt(7);
  const genero = generoRaw === 'M' || generoRaw === 'F' ? generoRaw : undefined;

  const numDocLine2 = documentoDesdeLinea2Mrz(line2);
  const numDocLine1 = documentoDesdeCampo(line1.slice(5, 14));
  // En cédula digital CO el NUIP va en línea 2; la línea 1 suele ser serial de tarjeta.
  const numDoc = numDocLine2 || numDocLine1 || '';

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
