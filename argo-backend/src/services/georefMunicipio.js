const { models } = require('../models/catalogos');
const { regexSinTildes } = require('../utils/regexSinTildes');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'ARGO-JornadasCap/1.0 (capacitacion georef)';

function limpiarNombre(v) {
  return String(v || '')
    .replace(/\s*(Distrito|Metropolitan|Metropolitana|Department|Departamento|de Colombia)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nombresMunicipioCandidatos(address) {
  const keys = ['city', 'town', 'municipality', 'village', 'county', 'suburb'];
  const out = [];
  for (const k of keys) {
    const n = limpiarNombre(address[k]);
    if (n && !out.some((x) => x.toLowerCase() === n.toLowerCase())) out.push(n);
  }
  return out;
}

async function fetchNominatim(lat, lng) {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'es');
  url.searchParams.set('zoom', '14');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('Tiempo agotado consultando mapa (Nominatim)');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function buscarEnDivipola(nombreMuni, nombreDepto) {
  const reMuni = regexSinTildes(limpiarNombre(nombreMuni));
  const rows = await models.divipola.find({ nombreMunicipio: reMuni }).lean();
  if (!rows.length) return null;
  if (rows.length === 1) return rows[0];

  const depto = limpiarNombre(nombreDepto);
  if (depto) {
    const reDepto = regexSinTildes(depto);
    const filtered = rows.filter((r) => reDepto.test(r.nombreDepto));
    if (filtered.length === 1) return filtered[0];
    if (filtered.length > 1) return filtered[0];
  }
  return rows[0];
}

/**
 * Resuelve municipio y departamento (Divipola) a partir de lat/lng vía OpenStreetMap.
 */
async function municipioPorCoords(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) {
    const err = new Error('Coordenadas inválidas');
    err.status = 400;
    throw err;
  }
  if (la < -90 || la > 90 || ln < -180 || ln > 180) {
    const err = new Error('Coordenadas fuera de rango');
    err.status = 400;
    throw err;
  }

  const data = await fetchNominatim(la, ln);
  const address = data?.address || {};
  const deptoNominatim = limpiarNombre(address.state || address.region || '');
  const candidatos = nombresMunicipioCandidatos(address);

  for (const nombre of candidatos) {
    const row = await buscarEnDivipola(nombre, deptoNominatim);
    if (row) {
      return {
        municipio: row.nombreMunicipio,
        depto: row.nombreDepto,
        codMunicipio: row.codMunicipio,
        fuente: 'divipola',
      };
    }
  }

  return {
    municipio: candidatos[0] || '',
    depto: deptoNominatim,
    codMunicipio: null,
    fuente: candidatos.length ? 'nominatim' : 'desconocido',
  };
}

module.exports = { municipioPorCoords };
