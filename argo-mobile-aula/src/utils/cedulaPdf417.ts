import { isValidNumDocDigits } from './numDoc';

export type CedulaPdf417Data = {
  tipoDoc: string;
  numDoc: string;
  apellido1: string;
  apellido2?: string;
  nombre1: string;
  nombre2?: string;
  genero?: string;
  fechaNac?: string;
  tipoSangre?: string;
};

/** Quita bytes nulos / basura típica del lector PDF417. */
function limpiarBytes(value: string): string {
  return value.replace(/\u0000|\uFFFD|NUL/gi, ' ');
}

/** Corrige lecturas como "P E R E Z" → "PEREZ" (bug de regex o lector). */
function colapsarLetrasEspaciadas(value: string): string {
  const parts = value.trim().split(/\s+/);
  if (parts.length >= 2 && parts.every((p) => p.length === 1)) {
    return parts.join('');
  }
  return value;
}

function limpiarTexto(value: string): string {
  return colapsarLetrasEspaciadas(
    limpiarBytes(value)
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase(),
  );
}

function fechaValida(raw: string): string | undefined {
  if (!/^\d{8}$/.test(raw)) return undefined;
  const y = Number(raw.slice(0, 4));
  const m = Number(raw.slice(4, 6));
  const d = Number(raw.slice(6, 8));
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    y < 1900 ||
    y > new Date().getUTCFullYear() ||
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return undefined;
  }
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function documentoValido(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  return isValidNumDocDigits(digits) ? digits : '';
}

function parsePorPosiciones(raw: string, markerIndex: number): CedulaPdf417Data | null {
  const prev24 = raw.slice(Math.max(0, markerIndex - 24), markerIndex);
  const nullCount = (prev24.match(/\u0000/g) || []).length;
  const frameStart = Math.max(0, markerIndex - (nullCount > 4 ? 24 : 13));
  const frame = raw.slice(frameStart);
  if (frame.length < 168) return null;

  const numDoc = documentoValido(frame.slice(48, 58));
  const apellido1 = limpiarTexto(frame.slice(58, 81));
  const apellido2 = limpiarTexto(frame.slice(81, 104));
  const nombre1 = limpiarTexto(frame.slice(104, 127));
  const nombre2 = limpiarTexto(frame.slice(127, 150));
  if (!numDoc || !apellido1 || !nombre1) return null;

  const genero = limpiarTexto(frame.slice(151, 152));
  const tipoSangre = limpiarTexto(frame.slice(166, 168));
  return {
    tipoDoc: '1',
    numDoc,
    apellido1,
    apellido2: apellido2 || undefined,
    nombre1,
    nombre2: nombre2 || undefined,
    genero: genero === 'M' || genero === 'F' ? genero : undefined,
    fechaNac: fechaValida(frame.slice(152, 160)),
    tipoSangre: /^(AB|A|B|O)[+-]$/.test(tipoSangre) ? tipoSangre : undefined,
  };
}

function parseTextoCompactado(raw: string, markerIndex: number): CedulaPdf417Data | null {
  const desdeMarca = raw.slice(Math.max(0, markerIndex - 20)).replace(/PubDSK_\d?/i, '0');
  const limpio = limpiarBytes(desdeMarca)
    .replace(/\s+/g, ' ')
    .trim();
  const primerNombre = limpio.search(/[A-Za-zÁÉÍÓÚÑ]/);
  if (primerNombre < 5) return null;
  const util = limpio.slice(Math.max(0, primerNombre - 10));
  const bloodMatch = util.match(/(AB|A|B|O)[+-]/i);
  const hasta = bloodMatch?.index != null ? bloodMatch.index + bloodMatch[0].length : util.length;
  const partes = util.slice(0, hasta).trim().split(/\s+/);
  if (partes.length < 3) return null;

  const primero = partes[0];
  const alpha = primero.search(/[A-Za-zÁÉÍÓÚÑ]/);
  const numDoc = documentoValido(primero.slice(0, alpha));
  const apellido1 = limpiarTexto(primero.slice(alpha));
  const apellido2 = partes.length > 3 ? limpiarTexto(partes[1]) : '';
  const nombre1 = limpiarTexto(partes.length > 3 ? partes[2] : partes[1]);
  const nombre2 = partes.length > 4 ? limpiarTexto(partes[3]) : '';
  const extra = partes[partes.length - 1];
  const genderIndex = extra.search(/[MF]/i);
  if (!numDoc || !apellido1 || !nombre1) return null;

  const genero = genderIndex >= 0 ? extra.charAt(genderIndex).toUpperCase() : '';
  const fechaRaw = genderIndex >= 0 ? extra.slice(genderIndex + 1, genderIndex + 9) : '';
  const tipoSangre = limpiarTexto(bloodMatch?.[0] || '');
  return {
    tipoDoc: '1',
    numDoc,
    apellido1,
    apellido2: apellido2 || undefined,
    nombre1,
    nombre2: nombre2 || undefined,
    genero: genero === 'M' || genero === 'F' ? genero : undefined,
    fechaNac: fechaValida(fechaRaw),
    tipoSangre: /^(AB|A|B|O)[+-]$/.test(tipoSangre) ? tipoSangre : undefined,
  };
}

function normalizarPayload(rawValue: string): string {
  return String(rawValue || '').replace(/\\0/g, '\u0000');
}

/** Interpreta el PDF417 de la cédula amarilla colombiana (marcador PubDSK_). */
export function parseCedulaColombianaPdf417(rawValue: string): CedulaPdf417Data | null {
  const raw = normalizarPayload(rawValue);
  const markerIndex = raw.search(/PubDSK_/i);
  if (markerIndex < 0) return null;
  return parsePorPosiciones(raw, markerIndex) || parseTextoCompactado(raw, markerIndex);
}

/** Indica si el payload parece cédula colombiana pero aún no parsea (lectura parcial). */
export function pareceCedulaPdf417Incompleta(rawValue: string): boolean {
  const raw = normalizarPayload(rawValue);
  return /PubDSK_/i.test(raw) && !parseCedulaColombianaPdf417(raw);
}
