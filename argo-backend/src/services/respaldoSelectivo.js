const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const archiver = require('archiver');
const unzipper = require('unzipper');

const {
  BACKUP_DIR,
  crearRespaldo,
  listarRespaldos,
  eliminarRespaldo,
  rutaRespaldo,
  recrearIndices,
  reservarOperacion,
  liberarOperacionRespaldo,
} = require('./respaldos');
const progreso = require('./progresoOperacion');
const {
  claveCifradoConfigurada,
  cifrarArchivo,
  descifrarArchivo,
  esArchivoCifrado,
  EXTENSION_CIFRADA,
} = require('./respaldoCifrado');
const {
  listarGruposSelectivos,
  nombresCatalogoSelectivo,
  normalizarSeleccion,
} = require('../constants/coleccionesRespaldoSelectivo');

const { EJSON } = mongoose.mongo.BSON;

const FORMATO = 'argo-selective-backup';
const VERSION = 1;
const PREFIJO_ARCHIVO = 'argo-respaldo-selectivo-';
const STAGING_SUFFIX = '__argo_restore_staging';
const BATCH_INSERT = 500;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function tsArchivo(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

async function sha256Archivo(ruta) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  await new Promise((resolve, reject) => {
    fs.createReadStream(ruta)
      .on('data', (c) => hash.update(c))
      .on('end', resolve)
      .on('error', reject);
  });
  return hash.digest('hex');
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

function esColeccionSistemaOTemporal(nombre) {
  const n = String(nombre || '');
  return (
    n.startsWith('system.') ||
    n.endsWith(STAGING_SUFFIX) ||
    n.includes('__argo_restore') ||
    n.includes('__staging')
  );
}

async function coleccionesApp() {
  const db = mongoose.connection.db;
  const cols = await db.listCollections().toArray();
  return cols
    .map((c) => c.name)
    .filter((n) => !esColeccionSistemaOTemporal(n))
    .sort();
}

async function contarDocumentos(nombre) {
  try {
    return await mongoose.connection.db.collection(nombre).countDocuments();
  } catch {
    return 0;
  }
}

async function obtenerMetaSelectivo() {
  const catalogo = nombresCatalogoSelectivo();
  const enBd = new Set(await coleccionesApp());
  const grupos = listarGruposSelectivos();
  const otras = [...enBd].filter((n) => !catalogo.has(n)).sort();
  if (otras.length) {
    grupos.push({
      id: 'otras',
      etiqueta: 'Otras tablas en la base de datos',
      descripcion: 'Colecciones presentes en MongoDB que no están en los módulos estándar.',
      advertencias: ['Revise dependencias antes de exportar o restaurar tablas sueltas.'],
      colecciones: otras.map((nombre) => ({ nombre, etiqueta: nombre })),
    });
  }
  for (const grupo of grupos) {
    for (const col of grupo.colecciones) {
      col.total = await contarDocumentos(col.nombre);
      col.existe = enBd.has(col.nombre);
    }
  }
  return { grupos, fraseRestaurar: require('../constants/coleccionesRespaldoSelectivo').FRASE_RESTAURAR };
}

async function exportarColeccionesSeleccionadas(dirSalida, nombres, onColeccion = null) {
  const db = mongoose.connection.db;
  const lista = [...nombres].sort();
  if (onColeccion) onColeccion(0, lista.length, null);
  const resumen = [];
  let i = 0;
  for (const nombre of lista) {
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
    i += 1;
    if (onColeccion) onColeccion(i, lista.length, nombre);
  }
  return resumen;
}

function comprimirSelectivo(dirTrabajo, rutaZip) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(rutaZip);
    const archive = archiver('zip', { zlib: { level: 6 } });
    output.on('close', resolve);
    archive.on('error', reject);
    output.on('error', reject);
    archive.pipe(output);
    archive.directory(path.join(dirTrabajo, 'db'), 'db');
    archive.file(path.join(dirTrabajo, 'manifest.json'), { name: 'manifest.json' });
    archive.finalize();
  });
}

async function crearRespaldoSelectivo({
  colecciones,
  usuario = 'sistema',
  nota = '',
} = {}) {
  const seleccion = normalizarSeleccion(colecciones);
  reservarOperacion('respaldo selectivo');
  progreso.iniciar('respaldo', 'Exportando tablas seleccionadas…');
  const inicio = Date.now();
  const fecha = new Date();
  const base = `${PREFIJO_ARCHIVO}${tsArchivo(fecha)}-manual`;
  const dirTrabajo = path.join(BACKUP_DIR, `.tmp-${base}`);
  const rutaZip = path.join(BACKUP_DIR, `${base}.zip`);
  try {
    ensureDir(BACKUP_DIR);
    ensureDir(path.join(dirTrabajo, 'db'));
    progreso.fase('Exportando tablas seleccionadas…', { total: seleccion.length });
    const reportar = (hechas, total, nombre) => {
      if (total) progreso.definirTotal(total);
      progreso.avanzar(hechas - progreso.obtener().hecho);
      if (nombre) progreso.fase(`Exportando ${nombre}…`, { total });
    };
    const coleccionesResumen = await exportarColeccionesSeleccionadas(
      path.join(dirTrabajo, 'db'),
      seleccion,
      reportar,
    );
    progreso.fase('Comprimiendo archivo…', { total: 0 });
    const manifest = {
      formato: FORMATO,
      version: VERSION,
      modo: 'selectivo',
      fecha: fecha.toISOString(),
      tipo: 'manual',
      usuario,
      nota: String(nota || ''),
      baseDatos: mongoose.connection.name,
      coleccionesSeleccionadas: seleccion,
      colecciones: coleccionesResumen,
      totalDocs: coleccionesResumen.reduce((s, c) => s + c.docs, 0),
    };
    await fs.promises.writeFile(
      path.join(dirTrabajo, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8',
    );
    await comprimirSelectivo(dirTrabajo, rutaZip);
    let rutaFinal = rutaZip;
    const cifrado = claveCifradoConfigurada();
    if (cifrado) {
      progreso.fase('Cifrando archivo…', { total: 0 });
      rutaFinal = path.join(BACKUP_DIR, `${base}${EXTENSION_CIFRADA}`);
      await cifrarArchivo(rutaZip, rutaFinal);
      await fs.promises.unlink(rutaZip).catch(() => {});
    }
    const stat = await fs.promises.stat(rutaFinal);
    const meta = {
      archivo: path.basename(rutaFinal),
      fecha: fecha.toISOString(),
      tipo: 'selectivo',
      usuario,
      nota: String(nota || ''),
      tamano: stat.size,
      sha256: await sha256Archivo(rutaFinal),
      cifrado,
      selectivo: true,
      coleccionesSeleccionadas: seleccion,
      colecciones: seleccion.length,
      totalDocs: manifest.totalDocs,
      duracionMs: Date.now() - inicio,
    };
    await escribirMeta(rutaFinal, meta);
    progreso.finalizar('ok', `Respaldo selectivo creado: ${meta.archivo}`);
    return meta;
  } catch (err) {
    await fs.promises.unlink(rutaZip).catch(() => {});
    progreso.finalizar('error', err.message || 'Error al crear respaldo selectivo');
    throw err;
  } finally {
    liberarOperacionRespaldo();
    await fs.promises.rm(dirTrabajo, { recursive: true, force: true }).catch(() => {});
  }
}

async function listarRespaldosSelectivos() {
  const todos = await listarRespaldos();
  return todos.filter((r) => String(r.archivo || '').startsWith(PREFIJO_ARCHIVO) || r.selectivo);
}

function dedupeConfigPorClave(docs) {
  const map = new Map();
  for (const doc of docs) {
    const clave = doc?.clave != null ? String(doc.clave).trim() : '';
    if (clave) map.set(clave, doc);
  }
  return [...map.values()];
}

async function insertManyResiliente(collection, lote) {
  if (!lote.length) return 0;
  try {
    const r = await collection.insertMany(lote, { ordered: false });
    return r.insertedCount ?? lote.length;
  } catch (e) {
    if (e.code === 11000 || e.name === 'MongoBulkWriteError') {
      return e.result?.insertedCount ?? 0;
    }
    throw e;
  }
}

async function limpiarColeccionesStaging(db) {
  const cols = await coleccionesApp();
  for (const nombre of cols) {
    if (nombre.endsWith(STAGING_SUFFIX)) {
      await db.collection(nombre).drop().catch(() => {});
    }
  }
}

async function insertarJsonlEnColeccion(entrada, nombreColeccion, db, esConfig = false, onDocs = null) {
  const readline = require('readline');
  await db.createCollection(nombreColeccion).catch(() => {});
  const rl = readline.createInterface({ input: entrada.stream(), crlfDelay: Infinity });
  let lote = [];
  let docs = 0;
  const collection = db.collection(nombreColeccion);
  for await (const linea of rl) {
    const t = linea.trim();
    if (!t) continue;
    lote.push(EJSON.parse(t, { relaxed: false }));
    if (lote.length >= BATCH_INSERT) {
      if (esConfig) lote = dedupeConfigPorClave(lote);
      const ins = await insertManyResiliente(collection, lote);
      docs += ins;
      if (onDocs) onDocs(lote.length);
      lote = [];
    }
  }
  if (lote.length) {
    if (esConfig) lote = dedupeConfigPorClave(lote);
    const ins = await insertManyResiliente(collection, lote);
    docs += ins;
    if (onDocs) onDocs(lote.length);
  }
  return docs;
}

async function restaurarColeccionesSelectivasDesdeZip(zipAbierto, nombresPermitidos, onDocs = null) {
  const db = mongoose.connection.db;
  const permitidas = new Set(nombresPermitidos);
  const entradasDb = zipAbierto.files.filter(
    (f) => f.path.startsWith('db/') && f.path.endsWith('.jsonl') && f.type === 'File',
  );
  await limpiarColeccionesStaging(db);
  const resumen = [];
  const nombresBackup = [];
  try {
    for (const entrada of entradasDb) {
      const nombre = path.basename(entrada.path, '.jsonl');
      if (!permitidas.has(nombre)) continue;
      const staging = `${nombre}${STAGING_SUFFIX}`;
      nombresBackup.push(nombre);
      const docs = await insertarJsonlEnColeccion(entrada, staging, db, nombre === 'config', onDocs);
      resumen.push({ nombre, docs });
    }
    if (!nombresBackup.length) {
      const err = new Error('El archivo no contiene tablas válidas para restaurar');
      err.status = 400;
      throw err;
    }
    for (const nombre of nombresBackup) {
      const staging = `${nombre}${STAGING_SUFFIX}`;
      await db.collection(nombre).drop().catch(() => {});
      await db.collection(staging).rename(nombre);
    }
    return resumen;
  } catch (err) {
    await limpiarColeccionesStaging(db).catch(() => {});
    throw err;
  }
}

async function restaurarRespaldoSelectivo(rutaArchivo, { usuario = 'sistema', crearSeguridad = true } = {}) {
  if (!fs.existsSync(rutaArchivo)) {
    const err = new Error('Archivo de respaldo selectivo no encontrado');
    err.status = 404;
    throw err;
  }
  progreso.iniciar('restauracion', 'Preparando restauración selectiva…');
  let respaldoSeguridad = null;
  if (crearSeguridad) {
    progreso.fase('Creando copia de seguridad completa previa…', { total: 0 });
    respaldoSeguridad = await crearRespaldo({
      tipo: 'pre-restauracion',
      usuario,
      nota: `Antes de restauración selectiva ${path.basename(rutaArchivo)}`,
      _interno: true,
      reportarProgreso: true,
    });
  }
  reservarOperacion('restauración selectiva');
  let rutaZip = rutaArchivo;
  let zipTemporal = null;
  try {
    if (esArchivoCifrado(rutaArchivo)) {
      progreso.fase('Descifrando archivo…', { total: 0 });
      zipTemporal = path.join(BACKUP_DIR, `.restore-sel-${Date.now()}.zip`);
      await descifrarArchivo(rutaArchivo, zipTemporal);
      rutaZip = zipTemporal;
    }
    const zipAbierto = await unzipper.Open.file(rutaZip);
    const entradaManifest = zipAbierto.files.find((f) => f.path === 'manifest.json');
    if (!entradaManifest) {
      const err = new Error('El archivo no es un respaldo selectivo válido (falta manifest.json)');
      err.status = 400;
      throw err;
    }
    const manifest = JSON.parse((await entradaManifest.buffer()).toString('utf8'));
    if (manifest.formato !== FORMATO || manifest.modo !== 'selectivo') {
      const err = new Error('El archivo no es un respaldo selectivo de ARGO');
      err.status = 400;
      throw err;
    }
    const seleccion = normalizarSeleccion(
      manifest.coleccionesSeleccionadas || manifest.colecciones?.map((c) => c.nombre) || [],
    );
    progreso.fase('Cargando tablas seleccionadas…', { total: Number(manifest.totalDocs) || 0 });
    const colecciones = await restaurarColeccionesSelectivasDesdeZip(zipAbierto, seleccion, (n) =>
      progreso.avanzar(n),
    );
    progreso.fase('Reconstruyendo índices y caché…', { total: 0 });
    await recrearIndices();
    const { initRolesSistema, limpiarCache } = require('./rolesPermisos');
    await initRolesSistema();
    limpiarCache();
    const { aplicarParchesReferidorComercial } = require('./migrarReferidorComercial');
    await aplicarParchesReferidorComercial().catch((err) => {
      console.warn('[ARGO respaldo selectivo] parches referidor:', err.message);
    });
    const docsRestaurados = colecciones.reduce((s, c) => s + c.docs, 0);
    progreso.finalizar(
      'ok',
      `Restauración selectiva completada: ${docsRestaurados} documentos en ${colecciones.length} tablas.`,
    );
    return {
      manifest: {
        fecha: manifest.fecha,
        tipo: manifest.tipo,
        usuario: manifest.usuario,
        totalDocs: manifest.totalDocs,
        coleccionesSeleccionadas: seleccion,
      },
      colecciones: colecciones.length,
      docsRestaurados,
      coleccionesRestauradas: colecciones.map((c) => c.nombre),
      respaldoSeguridad: respaldoSeguridad?.archivo || null,
      mensaje:
        'Restauración selectiva completada. Solo se reemplazaron las tablas incluidas en el archivo; ' +
        'el resto de la base de datos no se modificó.',
    };
  } catch (err) {
    progreso.finalizar('error', err.message || 'La restauración selectiva falló');
    throw err;
  } finally {
    liberarOperacionRespaldo();
    if (zipTemporal) await fs.promises.unlink(zipTemporal).catch(() => {});
  }
}

module.exports = {
  PREFIJO_ARCHIVO,
  obtenerMetaSelectivo,
  crearRespaldoSelectivo,
  listarRespaldosSelectivos,
  eliminarRespaldoSelectivo: eliminarRespaldo,
  rutaRespaldoSelectivo: rutaRespaldo,
  restaurarRespaldoSelectivo,
};
