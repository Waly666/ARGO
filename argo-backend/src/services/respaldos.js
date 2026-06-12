const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const archiver = require('archiver');
const unzipper = require('unzipper');

const Config = require('../models/Config');
const { baseDir: uploadsDir } = require('../middleware/upload');
const {
  claveCifradoConfigurada,
  cifrarArchivo,
  descifrarArchivo,
  esArchivoCifrado,
  EXTENSION_CIFRADA,
} = require('./respaldoCifrado');

const { EJSON } = mongoose.mongo.BSON;

const BACKUP_DIR = path.join(__dirname, '..', '..', process.env.BACKUP_DIR || 'backups');
const CLAVE_CONFIG = 'respaldos';
const FORMATO = 'argo-backup';
const VERSION = 1;
const BATCH_INSERT = 500;

const DEFAULTS_CONFIG = {
  clave: CLAVE_CONFIG,
  autoHabilitado: true,
  horaAuto: '02:30',
  retencionDias: 30,
};

let operacionEnCurso = null;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function nombreSeguro(nombre) {
  const n = path.basename(String(nombre || ''));
  if (!/^[\w.\-]+$/.test(n) || (!n.endsWith('.zip') && !n.endsWith(EXTENSION_CIFRADA))) {
    const err = new Error('Nombre de respaldo inválido');
    err.status = 400;
    throw err;
  }
  return n;
}

function rutaRespaldo(nombre) {
  return path.join(BACKUP_DIR, nombreSeguro(nombre));
}

function marcarOperacion(tipo) {
  if (operacionEnCurso) {
    const err = new Error(
      `Ya hay una operación en curso (${operacionEnCurso}). Espere a que termine.`,
    );
    err.status = 409;
    throw err;
  }
  operacionEnCurso = tipo;
}

function liberarOperacion() {
  operacionEnCurso = null;
}

function tsArchivo(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

async function sha256Archivo(ruta) {
  const hash = crypto.createHash('sha256');
  await new Promise((resolve, reject) => {
    fs.createReadStream(ruta)
      .on('data', (c) => hash.update(c))
      .on('end', resolve)
      .on('error', reject);
  });
  return hash.digest('hex');
}

/** Recrea los índices de todos los modelos (se pierden al eliminar colecciones). */
async function recrearIndices() {
  for (const nombre of mongoose.modelNames()) {
    await mongoose
      .model(nombre)
      .createIndexes()
      .catch((e) => console.warn(`[ARGO respaldos] índices ${nombre}:`, e.message));
  }
}

async function coleccionesApp() {
  const db = mongoose.connection.db;
  const cols = await db.listCollections().toArray();
  return cols
    .map((c) => c.name)
    .filter((n) => !n.startsWith('system.'))
    .sort();
}

/** Exporta cada colección a JSONL (EJSON canónico) en dirSalida. */
async function exportarColecciones(dirSalida) {
  const db = mongoose.connection.db;
  const nombres = await coleccionesApp();
  const resumen = [];
  for (const nombre of nombres) {
    const rutaArchivo = path.join(dirSalida, `${nombre}.jsonl`);
    const ws = fs.createWriteStream(rutaArchivo, { encoding: 'utf8' });
    let docs = 0;
    const cursor = db.collection(nombre).find({});
    for await (const doc of cursor) {
      const linea = EJSON.stringify(doc, { relaxed: false });
      if (!ws.write(`${linea}\n`)) {
        await new Promise((r) => ws.once('drain', r));
      }
      docs += 1;
    }
    await new Promise((resolve, reject) => {
      ws.end(() => resolve());
      ws.on('error', reject);
    });
    resumen.push({ nombre, docs });
  }
  return resumen;
}

function comprimirADestino(dirTrabajo, rutaZip) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(rutaZip);
    const archive = archiver('zip', { zlib: { level: 6 } });
    output.on('close', resolve);
    archive.on('error', reject);
    output.on('error', reject);
    archive.pipe(output);
    archive.directory(path.join(dirTrabajo, 'db'), 'db');
    archive.file(path.join(dirTrabajo, 'manifest.json'), { name: 'manifest.json' });
    if (fs.existsSync(uploadsDir)) {
      archive.directory(uploadsDir, 'uploads');
    }
    archive.finalize();
  });
}

async function escribirMeta(rutaFinal, meta) {
  await fs.promises.writeFile(`${rutaFinal}.meta.json`, JSON.stringify(meta, null, 2), 'utf8');
}

async function leerMeta(rutaFinal) {
  try {
    return JSON.parse(await fs.promises.readFile(`${rutaFinal}.meta.json`, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Crea un respaldo completo (BD + archivos subidos).
 * tipo: manual | auto | pre-reset | pre-restauracion
 */
async function crearRespaldo({ tipo = 'manual', usuario = 'sistema', nota = '' } = {}) {
  marcarOperacion(`respaldo ${tipo}`);
  const inicio = Date.now();
  const fecha = new Date();
  const base = `argo-respaldo-${tsArchivo(fecha)}-${tipo}`;
  const dirTrabajo = path.join(BACKUP_DIR, `.tmp-${base}`);
  const rutaZip = path.join(BACKUP_DIR, `${base}.zip`);
  try {
    ensureDir(BACKUP_DIR);
    ensureDir(path.join(dirTrabajo, 'db'));

    const colecciones = await exportarColecciones(path.join(dirTrabajo, 'db'));
    const manifest = {
      formato: FORMATO,
      version: VERSION,
      fecha: fecha.toISOString(),
      tipo,
      usuario,
      nota: String(nota || ''),
      baseDatos: mongoose.connection.name,
      colecciones,
      totalDocs: colecciones.reduce((s, c) => s + c.docs, 0),
    };
    await fs.promises.writeFile(
      path.join(dirTrabajo, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8',
    );

    await comprimirADestino(dirTrabajo, rutaZip);

    let rutaFinal = rutaZip;
    const cifrado = claveCifradoConfigurada();
    if (cifrado) {
      rutaFinal = path.join(BACKUP_DIR, `${base}${EXTENSION_CIFRADA}`);
      await cifrarArchivo(rutaZip, rutaFinal);
    }

    const stat = await fs.promises.stat(rutaFinal);
    const meta = {
      archivo: path.basename(rutaFinal),
      fecha: fecha.toISOString(),
      tipo,
      usuario,
      nota: String(nota || ''),
      tamano: stat.size,
      sha256: await sha256Archivo(rutaFinal),
      cifrado,
      colecciones: colecciones.length,
      totalDocs: manifest.totalDocs,
      duracionMs: Date.now() - inicio,
    };
    await escribirMeta(rutaFinal, meta);
    return meta;
  } catch (err) {
    await fs.promises.unlink(rutaZip).catch(() => {});
    throw err;
  } finally {
    liberarOperacion();
    await fs.promises.rm(dirTrabajo, { recursive: true, force: true }).catch(() => {});
  }
}

async function listarRespaldos() {
  ensureDir(BACKUP_DIR);
  const archivos = await fs.promises.readdir(BACKUP_DIR);
  const out = [];
  for (const a of archivos) {
    if (!a.endsWith('.zip') && !a.endsWith(EXTENSION_CIFRADA)) continue;
    const ruta = path.join(BACKUP_DIR, a);
    const stat = await fs.promises.stat(ruta).catch(() => null);
    if (!stat || !stat.isFile()) continue;
    const meta = await leerMeta(ruta);
    out.push(
      meta || {
        archivo: a,
        fecha: stat.mtime.toISOString(),
        tipo: a.includes('-auto') ? 'auto' : 'manual',
        usuario: null,
        tamano: stat.size,
        cifrado: a.endsWith(EXTENSION_CIFRADA),
      },
    );
  }
  out.sort((x, y) => String(y.fecha).localeCompare(String(x.fecha)));
  return out;
}

async function eliminarRespaldo(nombre) {
  const ruta = rutaRespaldo(nombre);
  if (!fs.existsSync(ruta)) {
    const err = new Error('Respaldo no encontrado');
    err.status = 404;
    throw err;
  }
  await fs.promises.unlink(ruta);
  await fs.promises.unlink(`${ruta}.meta.json`).catch(() => {});
}

/** Elimina respaldos automáticos con más días que la retención configurada. */
async function aplicarRetencion(retencionDias) {
  const dias = Math.max(1, Number(retencionDias) || DEFAULTS_CONFIG.retencionDias);
  const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
  const lista = await listarRespaldos();
  let eliminados = 0;
  for (const r of lista) {
    if (r.tipo !== 'auto') continue;
    if (new Date(r.fecha).getTime() < limite) {
      await eliminarRespaldo(r.archivo).catch(() => {});
      eliminados += 1;
    }
  }
  return eliminados;
}

async function vaciarDirectorio(dir) {
  if (!fs.existsSync(dir)) return;
  const entradas = await fs.promises.readdir(dir);
  for (const e of entradas) {
    await fs.promises.rm(path.join(dir, e), { recursive: true, force: true });
  }
}

async function restaurarColeccionesDesdeZip(zipAbierto) {
  const db = mongoose.connection.db;
  const entradasDb = zipAbierto.files.filter(
    (f) => f.path.startsWith('db/') && f.path.endsWith('.jsonl') && f.type === 'File',
  );

  // Reemplazo total: se eliminan las colecciones actuales antes de insertar.
  const actuales = await coleccionesApp();
  for (const nombre of actuales) {
    await db.collection(nombre).drop().catch(() => {});
  }

  const readline = require('readline');
  const resumen = [];
  for (const entrada of entradasDb) {
    const nombre = path.basename(entrada.path, '.jsonl');
    const rl = readline.createInterface({ input: entrada.stream(), crlfDelay: Infinity });
    let lote = [];
    let docs = 0;
    for await (const linea of rl) {
      const t = linea.trim();
      if (!t) continue;
      lote.push(EJSON.parse(t, { relaxed: false }));
      if (lote.length >= BATCH_INSERT) {
        await db.collection(nombre).insertMany(lote, { ordered: false });
        docs += lote.length;
        lote = [];
      }
    }
    if (lote.length) {
      await db.collection(nombre).insertMany(lote, { ordered: false });
      docs += lote.length;
    }
    resumen.push({ nombre, docs });
  }
  return resumen;
}

async function restaurarUploadsDesdeZip(zipAbierto) {
  await vaciarDirectorio(uploadsDir);
  ensureDir(uploadsDir);
  const entradas = zipAbierto.files.filter(
    (f) => f.path.startsWith('uploads/') && f.type === 'File',
  );
  let archivos = 0;
  for (const entrada of entradas) {
    const relativo = entrada.path.slice('uploads/'.length);
    if (!relativo) continue;
    const destino = path.join(uploadsDir, relativo);
    // Protección path traversal
    if (!destino.startsWith(path.resolve(uploadsDir))) continue;
    ensureDir(path.dirname(destino));
    await new Promise((resolve, reject) => {
      entrada
        .stream()
        .pipe(fs.createWriteStream(destino))
        .on('finish', resolve)
        .on('error', reject);
    });
    archivos += 1;
  }
  return archivos;
}

/**
 * Restaura un respaldo completo (reemplaza BD y archivos subidos).
 * rutaArchivo: ruta absoluta del .zip o .argobk a restaurar.
 */
async function restaurarRespaldo(rutaArchivo, { usuario = 'sistema', crearSeguridad = true } = {}) {
  if (!fs.existsSync(rutaArchivo)) {
    const err = new Error('Archivo de respaldo no encontrado');
    err.status = 404;
    throw err;
  }

  // Respaldo de seguridad del estado actual antes de pisarlo.
  let respaldoSeguridad = null;
  if (crearSeguridad) {
    respaldoSeguridad = await crearRespaldo({
      tipo: 'pre-restauracion',
      usuario,
      nota: `Antes de restaurar ${path.basename(rutaArchivo)}`,
    });
  }

  marcarOperacion('restauración');
  let rutaZip = rutaArchivo;
  let zipTemporal = null;
  try {
    if (esArchivoCifrado(rutaArchivo)) {
      zipTemporal = path.join(BACKUP_DIR, `.restore-${Date.now()}.zip`);
      await descifrarArchivo(rutaArchivo, zipTemporal);
      rutaZip = zipTemporal;
    }

    const zipAbierto = await unzipper.Open.file(rutaZip);
    const entradaManifest = zipAbierto.files.find((f) => f.path === 'manifest.json');
    if (!entradaManifest) {
      const err = new Error('El archivo no es un respaldo válido de ARGO (falta manifest.json)');
      err.status = 400;
      throw err;
    }
    const manifest = JSON.parse((await entradaManifest.buffer()).toString('utf8'));
    if (manifest.formato !== FORMATO) {
      const err = new Error('Formato de respaldo no reconocido');
      err.status = 400;
      throw err;
    }

    const colecciones = await restaurarColeccionesDesdeZip(zipAbierto);
    const archivosRestaurados = await restaurarUploadsDesdeZip(zipAbierto);

    // Reinicializa índices, estructuras mínimas y cachés tras el reemplazo.
    await recrearIndices();
    const { initRolesSistema, limpiarCache } = require('./rolesPermisos');
    await initRolesSistema();
    limpiarCache();

    return {
      manifest: {
        fecha: manifest.fecha,
        tipo: manifest.tipo,
        usuario: manifest.usuario,
        totalDocs: manifest.totalDocs,
      },
      colecciones: colecciones.length,
      docsRestaurados: colecciones.reduce((s, c) => s + c.docs, 0),
      archivosRestaurados,
      respaldoSeguridad: respaldoSeguridad?.archivo || null,
    };
  } finally {
    liberarOperacion();
    if (zipTemporal) await fs.promises.unlink(zipTemporal).catch(() => {});
  }
}

function normalizarHora(h) {
  const m = String(h || '').trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : DEFAULTS_CONFIG.horaAuto;
}

async function obtenerConfigRespaldos() {
  let doc = await Config.findOne({ clave: CLAVE_CONFIG }).lean();
  if (!doc) doc = (await Config.create({ ...DEFAULTS_CONFIG })).toObject();
  return {
    autoHabilitado: doc.autoHabilitado !== false,
    horaAuto: normalizarHora(doc.horaAuto),
    retencionDias: Math.max(1, Math.min(365, Number(doc.retencionDias) || DEFAULTS_CONFIG.retencionDias)),
    cifradoActivo: claveCifradoConfigurada(),
  };
}

async function actualizarConfigRespaldos(payload = {}) {
  const set = {};
  if (payload.autoHabilitado !== undefined) set.autoHabilitado = payload.autoHabilitado === true;
  if (payload.horaAuto !== undefined) set.horaAuto = normalizarHora(payload.horaAuto);
  if (payload.retencionDias !== undefined) {
    set.retencionDias = Math.max(1, Math.min(365, Number(payload.retencionDias) || DEFAULTS_CONFIG.retencionDias));
  }
  await Config.findOneAndUpdate(
    { clave: CLAVE_CONFIG },
    { $set: set, $setOnInsert: { clave: CLAVE_CONFIG } },
    { upsert: true },
  );
  return obtenerConfigRespaldos();
}

module.exports = {
  BACKUP_DIR,
  recrearIndices,
  crearRespaldo,
  listarRespaldos,
  eliminarRespaldo,
  rutaRespaldo,
  restaurarRespaldo,
  aplicarRetencion,
  obtenerConfigRespaldos,
  actualizarConfigRespaldos,
};
