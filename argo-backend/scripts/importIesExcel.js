/**
 * Importa IES (universidades, tecnológicas, técnicas) desde Excel SNIES/MEN
 * (Instituciones.xlsx) al catálogo `colegios`, sin borrar colegios MEN.
 *
 * El Excel trae NOMBRE de departamento/municipio (no códigos DIVIPOLA).
 * Este script resuelve codMunicipio / codDepartamento contra el catálogo `divipola`.
 *
 * Uso:
 *   node scripts/importIesExcel.js "C:\Users\walte\Downloads\Instituciones.xlsx"
 *   node scripts/importIesExcel.js --file=... --solo-activas
 *   node scripts/importIesExcel.js --file=... --solo-principales
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const { models: cat } = require('../src/models/catalogos');

function argVal(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

function cellByIndex(rowArr, i) {
  const v = rowArr[i];
  if (v == null) return '';
  return String(v).trim();
}

function normKey(s) {
  return String(s || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Alias frecuentes SNIES → DIVIPOLA */
function aliasLugar(nombre) {
  const k = normKey(nombre);
  const map = {
    'BOGOTA D C': 'BOGOTA',
    'BOGOTA DC': 'BOGOTA',
    BOGOTA: 'BOGOTA',
    'SANTAFE DE BOGOTA': 'BOGOTA',
    'CARTAGENA DE INDIAS': 'CARTAGENA',
    'SAN ANDRES': 'SAN ANDRES',
    'ARCHIPIELAGO DE SAN ANDRES PROVIDENCIA Y SANTA CATALINA': 'SAN ANDRES',
  };
  return map[k] || k;
}

const { nivelesIesDesdeCaracter, nivelIesPrincipal } = require('../src/constants/nivelesIes');

function upper(s) {
  return String(s || '')
    .trim()
    .toUpperCase();
}

async function cargarIndiceDivipola() {
  const rows = await cat.divipola
    .find({})
    .select('codMunicipio nombreMunicipio codDepto nombreDepto')
    .lean();
  /** @type {Map<string, any[]>} */
  const byMuni = new Map();
  /** @type {Map<string, any[]>} */
  const byDeptoMuni = new Map();
  for (const r of rows) {
    const mun = aliasLugar(r.nombreMunicipio);
    const dep = aliasLugar(r.nombreDepto);
    if (!mun) continue;
    if (!byMuni.has(mun)) byMuni.set(mun, []);
    byMuni.get(mun).push(r);
    const dk = `${dep}|${mun}`;
    if (!byDeptoMuni.has(dk)) byDeptoMuni.set(dk, []);
    byDeptoMuni.get(dk).push(r);
  }
  return { byMuni, byDeptoMuni, total: rows.length };
}

function resolverDivipola(indice, nombreDepto, nombreMuni) {
  const mun = aliasLugar(nombreMuni);
  const dep = aliasLugar(nombreDepto);
  if (!mun) return null;
  const exact = indice.byDeptoMuni.get(`${dep}|${mun}`);
  if (exact?.length) return exact[0];
  const solo = indice.byMuni.get(mun);
  if (solo?.length === 1) return solo[0];
  if (solo?.length > 1 && dep) {
    const hit = solo.find((r) => aliasLugar(r.nombreDepto) === dep);
    if (hit) return hit;
  }
  // Coincidencia parcial (ej. "BOGOTA D.C." vs "BOGOTA")
  if (mun.length >= 4) {
    for (const [k, list] of indice.byMuni) {
      if (k.includes(mun) || mun.includes(k)) {
        if (list.length === 1) return list[0];
        if (dep) {
          const hit = list.find((r) => aliasLugar(r.nombreDepto) === dep);
          if (hit) return hit;
        }
      }
    }
  }
  return null;
}

async function main() {
  const file =
    argVal('file') ||
    process.argv.find((a) => !a.startsWith('-') && /\.xlsx?$/i.test(a)) ||
    path.join(process.env.USERPROFILE || '', 'Downloads', 'Instituciones.xlsx');
  const soloActivas =
    process.argv.includes('--solo-activas') || !process.argv.includes('--incluir-inactivas');
  const soloPrincipales = process.argv.includes('--solo-principales');

  if (!fs.existsSync(file)) {
    console.error(`No se encontró el Excel: ${file}`);
    process.exit(1);
  }

  await connectDB();
  console.log(`Leyendo ${file}…`);
  const indice = await cargarIndiceDivipola();
  console.log(`DIVIPOLA cargada: ${indice.total} municipios`);

  const wb = XLSX.readFile(file, { cellDates: false, codepage: 65001 });
  const sheetName = wb.SheetNames.find((n) => /instituc/i.test(n)) || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!matrix.length) {
    console.error('Hoja vacía');
    process.exit(1);
  }
  const dataRows = matrix.slice(1);
  console.log(`${dataRows.length} filas en «${sheetName}»`);

  const docs = [];
  const seen = new Set();
  let conCodigo = 0;
  let sinCodigo = 0;
  for (const r of dataRows) {
    if (!Array.isArray(r)) continue;
    const codigoRaw = cellByIndex(r, 1);
    const nombre = upper(cellByIndex(r, 2));
    const estado = cellByIndex(r, 3);
    const nit = cellByIndex(r, 4);
    const principal = cellByIndex(r, 5);
    const sector = upper(cellByIndex(r, 7));
    const caracter = cellByIndex(r, 8);
    const depto = upper(cellByIndex(r, 9));
    const muni = upper(cellByIndex(r, 10));
    const direccion = upper(cellByIndex(r, 11));
    const telefono = cellByIndex(r, 12);

    if (!codigoRaw || !nombre) continue;
    if (soloActivas && !/^activ/i.test(estado)) continue;
    if (soloPrincipales && !/principal/i.test(principal)) continue;

    const codigoEstablecimiento = `IES-${codigoRaw}`;
    if (seen.has(codigoEstablecimiento)) continue;
    seen.add(codigoEstablecimiento);

    const nivelesEducativos = nivelesIesDesdeCaracter(caracter);
    const nivelEducativo = nivelIesPrincipal(caracter);
    const seccional = /seccional/i.test(principal) ? 'SECCIONAL' : 'PRINCIPAL';
    const div = resolverDivipola(indice, depto, muni);
    if (div?.codMunicipio) conCodigo += 1;
    else sinCodigo += 1;

    docs.push({
      codigoEstablecimiento,
      nombreEstablecimiento: nombre,
      codDepartamento: div?.codDepto ? String(div.codDepto).padStart(2, '0') : '',
      nombreDepartamento: depto || String(div?.nombreDepto || '').toUpperCase(),
      codMunicipio: div?.codMunicipio ? String(div.codMunicipio).padStart(5, '0') : '',
      nombreMunicipio: muni || String(div?.nombreMunicipio || '').toUpperCase(),
      zona: undefined,
      direccion: direccion || undefined,
      telefono: telefono || undefined,
      sector: sector || undefined,
      tipoEstablecimiento: upper(caracter) || 'IES',
      nivelEducativo,
      nivelesEducativos,
      nit: nit || undefined,
      iesPadre: cellByIndex(r, 0) || undefined,
      seccional,
      activo: true,
      fuente: 'snies_ies',
    });
  }

  console.log(`${docs.length} IES a upsert (activas=${soloActivas}, soloPrincipales=${soloPrincipales})`);
  console.log(`DIVIPOLA resuelto: ${conCodigo} · sin código: ${sinCodigo}`);
  const byNivel = docs.reduce((acc, d) => {
    acc[d.nivelEducativo] = (acc[d.nivelEducativo] || 0) + 1;
    return acc;
  }, {});
  console.log('Por nivel:', byNivel);

  if (!docs.length) {
    await mongoose.disconnect();
    process.exit(1);
  }

  const CHUNK = 200;
  let upserts = 0;
  for (let i = 0; i < docs.length; i += CHUNK) {
    const slice = docs.slice(i, i + CHUNK);
    const ops = slice.map((d) => ({
      updateOne: {
        filter: { codigoEstablecimiento: d.codigoEstablecimiento },
        update: { $set: d },
        upsert: true,
      },
    }));
    const r = await cat.colegios.bulkWrite(ops, { ordered: false });
    upserts += (r.upsertedCount || 0) + (r.modifiedCount || 0);
    console.log(`… ${Math.min(i + CHUNK, docs.length)} / ${docs.length}`);
  }

  console.log(`Listo. Escrituras ~${upserts}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
