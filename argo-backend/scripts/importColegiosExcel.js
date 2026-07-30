/**
 * Importa colegios desde Excel MEN (colegios_COLOMBIA.xlsx).
 * Uso:
 *   node scripts/importColegiosExcel.js "C:\ruta\colegios_COLOMBIA.xlsx"
 *   node scripts/importColegiosExcel.js --file=... --replace
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

function padCod(v, len) {
  const s = String(v ?? '').replace(/\D/g, '');
  if (!s) return '';
  return s.padStart(len, '0');
}

function cell(row, ...keys) {
  for (const k of keys) {
    if (row[k] != null && String(row[k]).trim() !== '') return row[k];
  }
  return '';
}

async function main() {
  const file =
    argVal('file') ||
    process.argv.find((a) => !a.startsWith('-') && a.toLowerCase().endsWith('.xlsx')) ||
    path.join(process.env.USERPROFILE || '', 'OneDrive', 'Desktop', 'colegios_COLOMBIA.xlsx');
  const replace = process.argv.includes('--replace');

  if (!fs.existsSync(file)) {
    console.error(`No se encontró el Excel: ${file}`);
    process.exit(1);
  }

  await connectDB();
  console.log(`Leyendo ${file}…`);
  const wb = XLSX.readFile(file, { cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`${rows.length} filas en hoja «${wb.SheetNames[0]}»`);

  const docs = [];
  const seen = new Set();
  for (const r of rows) {
    const codigoEstablecimiento = String(
      cell(r, 'codigoestablecimiento', 'codigoEstablecimiento', 'codigo_establecimiento'),
    ).trim();
    if (!codigoEstablecimiento) continue;
    if (seen.has(codigoEstablecimiento)) continue;
    seen.add(codigoEstablecimiento);

    const codDepto = padCod(cell(r, 'codigodepartamento', 'codigoDepartamento', 'codDepartamento'), 2);
    let codMun = padCod(cell(r, 'codigomunicipio', 'codigoMunicipio', 'codMunicipio'), 5);
    // Algunos Excel traen municipio sin depto; si tiene 3 dígitos, anteponer depto.
    if (codMun.length === 3 && codDepto) codMun = `${codDepto}${codMun}`;
    if (codMun.length === 4 && codDepto) codMun = `${codDepto}${codMun.slice(-3)}`;

    docs.push({
      codigoEstablecimiento,
      nombreEstablecimiento: String(
        cell(r, 'nombreestablecimiento', 'nombreEstablecimiento', 'nombre'),
      )
        .trim()
        .toUpperCase(),
      codDepartamento: codDepto,
      nombreDepartamento: String(cell(r, 'nombredepartamento', 'nombreDepartamento'))
        .trim()
        .toUpperCase(),
      codMunicipio: codMun,
      nombreMunicipio: String(cell(r, 'nombremunicipio', 'nombreMunicipio')).trim().toUpperCase(),
      zona: String(cell(r, 'zona')).trim().toUpperCase() || undefined,
      direccion: String(cell(r, 'direccion')).trim().toUpperCase() || undefined,
      telefono: String(cell(r, 'telefono')).trim() || undefined,
      sector: String(cell(r, 'sector')).trim().toUpperCase() || undefined,
      tipoEstablecimiento: String(cell(r, 'tipo_Establecimiento', 'tipoEstablecimiento'))
        .trim()
        .toUpperCase() || undefined,
      activo: true,
    });
  }

  console.log(`${docs.length} colegios únicos`);
  if (!docs.length) {
    await mongoose.disconnect();
    process.exit(1);
  }

  if (replace) {
    const del = await cat.colegios.deleteMany({});
    console.log(`Colección limpia (${del.deletedCount} borrados)`);
  }

  const CHUNK = 1000;
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
