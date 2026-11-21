const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const PesvCaptura = require('../../models/PesvCaptura');
const { esAdmin } = require('../../utils/roles');
const { tieneAccionModulo } = require('../permisoAccion');
const { obtenerDatosEmpresaInstitucional } = require('../empresaInstitucional');

const RAIZ_REPO = path.resolve(__dirname, '../../../..');
const DIR_PLANTILLAS = path.join(RAIZ_REPO, 'plantillas-pesv');
const DIR_DOCUMENTOS = path.join(RAIZ_REPO, 'documentos-pesv');

const SENSIBLES = new Set(['09', '11', '17', '18', '27']);

function puedeVerSensibles(user, permisos) {
  if (esAdmin(user?.rol)) return true;
  if (permisos?.includes('*')) return true;
  return tieneAccionModulo(permisos || [], 'pesvSensibles', 'ver');
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function codigoDe(base) {
  if (/^00_/i.test(base)) {
    if (/mapa/i.test(base)) return '00-mapa';
    if (/empieza/i.test(base)) return '00-empieza';
  }
  const num = base.match(/^(\d{2})_/);
  if (num) return num[1];
  const bono = base.match(/^(BONO_\d{2})/i);
  if (bono) return bono[1].toUpperCase();
  if (/^Matriz_Requisitos/i.test(base)) return 'matriz-requisitos';
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function esReferencia(nombre) {
  const ext = path.extname(nombre).toLowerCase();
  return ext === '.pdf' || /^00_/i.test(nombre) || /^BONO_/i.test(nombre);
}

function ayudaDe(item) {
  if (item.tipo === 'referencia') {
    return 'Guía de consulta. No se genera un documento por organización.';
  }
  if (item.codigo === '05') {
    return 'ARGO escribe la misionalidad y los vehículos. Al abrirlo, la plantilla muestra el nivel.';
  }
  if (item.sensible) {
    return 'Datos reservados: licencias, fatiga, víctimas, investigación o alcohol. Los ve el administrador y quien tenga el permiso PESV datos sensibles.';
  }
  return 'ARGO escribe la razón social, el NIT, la ciudad y el nivel. El líder y el representante entran si ya están en Empresa y en el formulario del ítem 3.';
}

function dentroDe(raiz, destino) {
  const base = path.resolve(raiz);
  const full = path.resolve(destino);
  return full === base || full.startsWith(base + path.sep);
}

function leerPlantillas() {
  if (!fs.existsSync(DIR_PLANTILLAS)) {
    const err = new Error('No está la carpeta plantillas-pesv en el servidor.');
    err.status = 500;
    throw err;
  }
  const grupos = [];
  const porCodigo = new Map();
  const carpetas = fs
    .readdirSync(DIR_PLANTILLAS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, 'es'));

  for (const carpeta of carpetas) {
    const dir = path.join(DIR_PLANTILLAS, carpeta);
    const archivos = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isFile())
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b, 'es'));
    const items = [];
    for (const nombre of archivos) {
      const ext = path.extname(nombre).toLowerCase();
      if (!['.xlsx', '.docx', '.pdf'].includes(ext)) continue;
      const base = path.basename(nombre, ext);
      const codigo = codigoDe(base);
      const item = {
        codigo,
        nombre,
        base,
        ext,
        grupo: carpeta,
        tipo: esReferencia(nombre) ? 'referencia' : 'generar',
        sensible: SENSIBLES.has(codigo),
        origen: path.join(dir, nombre),
      };
      item.ayuda = ayudaDe(item);
      if (porCodigo.has(codigo)) {
        const err = new Error(`Hay dos plantillas con el código ${codigo}.`);
        err.status = 500;
        throw err;
      }
      porCodigo.set(codigo, item);
      items.push(item);
    }
    if (items.length) grupos.push({ carpeta, items });
  }
  return { grupos, porCodigo };
}

function versionesGeneradas(item, vigencia) {
  const dir = path.join(DIR_DOCUMENTOS, String(vigencia), item.grupo);
  if (!fs.existsSync(dir)) return [];
  const re = new RegExp(`^${item.base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_v(\\d+)\\${item.ext}$`, 'i');
  return fs
    .readdirSync(dir)
    .map((nombre) => {
      const m = nombre.match(re);
      if (!m) return null;
      const version = Number(m[1]);
      let meta = {};
      const metaPath = path.join(dir, `${nombre}.meta.json`);
      if (fs.existsSync(metaPath)) {
        try {
          meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        } catch {
          meta = {};
        }
      }
      return {
        version,
        nombreArchivo: nombre,
        generadoEn: meta.generadoEn || null,
        generadoPor: meta.generadoPor || '',
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.version - a.version);
}

function listar({ vigencia, clasificacion, confirmado, permisos, user }) {
  const verSensibles = puedeVerSensibles(user, permisos);
  const { grupos } = leerPlantillas();
  return {
    vigencia,
    clasificacion,
    confirmado: !!confirmado,
    documentosDir: 'documentos-pesv',
    grupos: grupos.map((g) => ({
      carpeta: g.carpeta,
      items: g.items.map((item) => {
        const bloqueado = item.sensible && !verSensibles;
        return {
          codigo: item.codigo,
          nombre: item.nombre,
          grupo: item.grupo,
          tipo: item.tipo,
          sensible: item.sensible,
          bloqueado,
          ayuda: item.ayuda,
          versiones: bloqueado ? [] : versionesGeneradas(item, vigencia),
        };
      }),
    })),
  };
}

function notaGeneracion({ config, clasificacion, vigencia, escritos }) {
  const razon = config?.razonSocial || 'esta organización';
  const puestos = escritos?.length ? ` Quedó escrito: ${escritos.join(', ')}.` : '';
  return `Generado por ARGO para ${razon}. Vigencia ${vigencia}. ${clasificacion?.resumen || ''}${puestos}`;
}

async function datosDocumento({ vigencia, config, clasificacion }) {
  const empresa = await obtenerDatosEmpresaInstitucional().catch(() => ({}));
  const liderDoc = await PesvCaptura.findOne({ vigencia: Number(vigencia), itemNo: 3 }).lean().catch(() => null);
  const lider = liderDoc?.datos || {};
  return {
    razon: String(empresa.razonSocial || config?.razonSocial || '').trim(),
    nit: String(empresa.nit || config?.nit || '').trim(),
    ciudad: String(empresa.ciudad || '').trim(),
    representante: String(empresa.representanteLegal || '').trim(),
    liderNombre: String(lider.nombreLider || '').trim(),
    liderCargo: String(lider.cargoLider || '').trim(),
    nivel: clasificacion?.nivelLabel || '',
  };
}

function marcadores(datos) {
  const pares = [];
  const add = (token, valor, etiqueta) => {
    const texto = String(valor || '').trim();
    if (!texto) return;
    pares.push({ token, valor: xmlEscape(texto), etiqueta });
  };
  add('MasterDxcs', datos.razon, 'razón social');
  add('[Razón social]', datos.razon, 'razón social');
  add('[NIT]', datos.nit, 'NIT');
  add('[ciudad]', datos.ciudad, 'ciudad');
  add('[1/2]', '2', 'misionalidad');
  add('[Básico/Estándar/Avanzado]', datos.nivel, 'nivel');
  if (datos.liderNombre && datos.liderCargo) {
    add(
      'Responsable del programa — [Nombre / cargo]',
      `Responsable del programa — ${datos.liderNombre} / ${datos.liderCargo}`,
      'responsable del programa',
    );
  }
  if (datos.liderNombre) {
    add('Líder del PESV — [Nombre]', `Líder del PESV — ${datos.liderNombre}`, 'líder del PESV');
  }
  if (datos.representante) {
    add(
      'Representante Legal — [Nombre]',
      `Representante Legal — ${datos.representante}`,
      'representante legal',
    );
  }
  return pares;
}

function aplicarEnXml(xml, pares) {
  const usados = [];
  let out = xml;
  for (const p of pares) {
    if (!out.includes(p.token)) continue;
    out = out.split(p.token).join(p.valor);
    if (!usados.includes(p.etiqueta)) usados.push(p.etiqueta);
  }
  return { xml: out, usados };
}

function parchearDocxDatos(archivo, datos) {
  const zip = new AdmZip(archivo);
  const pares = marcadores(datos);
  const usados = [];
  let quedanEjemplos = false;
  for (const entry of zip.getEntries()) {
    if (!/^word\/(document|header\d*|footer\d*)\.xml$/i.test(entry.entryName)) continue;
    const original = zip.readAsText(entry.entryName);
    const aplicado = aplicarEnXml(original, pares);
    for (const etiqueta of aplicado.usados) {
      if (!usados.includes(etiqueta)) usados.push(etiqueta);
    }
    if (/\[(Razón social|NIT|Nombre|DD\/MM\/AAAA|ciudad)\]/.test(aplicado.xml) || aplicado.xml.includes('MasterDxcs')) {
      quedanEjemplos = true;
    }
    if (aplicado.xml !== original) {
      zip.updateFile(entry.entryName, Buffer.from(aplicado.xml, 'utf8'));
    }
  }
  zip.writeZip(archivo);
  return { escritos: usados, quedanEjemplos };
}

function parchearAutodiagnostico(archivo, clasificacion) {
  const zip = new AdmZip(archivo);
  const entry = 'xl/worksheets/sheet1.xml';
  let xml = zip.readAsText(entry);
  const texto = xmlEscape(`2 · ${clasificacion.misionalidadTexto}`);
  xml = xml.replace(
    /(<c r="D7"[^>]*t="inlineStr"><is><t>)[\s\S]*?(<\/t><\/is><\/c>)/,
    `$1${texto}$2`,
  );
  xml = xml.replace(/(<c r="D8"[^>]*>\s*<v>)[^<]*(<\/v>)/, `$1${clasificacion.totalVehiculos}$2`);
  xml = xml.replace(
    /<f>IF\(D8&gt;=IF\(C28=1,51,101\),3,IF\(D8&gt;=IF\(C28=1,20,50\),2,IF\(D8&gt;=11,1,0\)\)\)<\/f>/,
    '<f>IF(D8&gt;=100,3,IF(D8&gt;=50,2,IF(D8&gt;=10,1,0)))</f>',
  );
  xml = xml.replace(/<f>IF\(\$C\$28=1,51,101\)<\/f>/, '<f>100</f>');
  const nivelNum = !clasificacion.obligado
    ? 0
    : clasificacion.nivel === 'avanzado'
      ? 3
      : clasificacion.nivel === 'estandar'
        ? 2
        : 1;
  const nivelTexto = !clasificacion.obligado
    ? 'POR DEBAJO DE UMBRAL'
    : clasificacion.nivel === 'avanzado'
      ? 'AVANZADO'
      : clasificacion.nivel === 'estandar'
        ? 'ESTÁNDAR'
        : 'BÁSICO';
  const valores = { C28: 2, C29: nivelNum, C30: nivelNum, C31: xmlEscape(nivelTexto), C32: 0 };
  for (const [celda, valor] of Object.entries(valores)) {
    const re = new RegExp(`(<c r="${celda}"[^>]*>[\\s\\S]*?<v>)[\\s\\S]*?(</v>)`);
    xml = xml.replace(re, `$1${valor}$2`);
  }
  zip.updateFile(entry, Buffer.from(xml, 'utf8'));
  zip.writeZip(archivo);
}

async function generar({ codigo, vigencia, user, permisos, config, clasificacion }) {
  const verSensibles = puedeVerSensibles(user, permisos);
  const { porCodigo } = leerPlantillas();
  const item = porCodigo.get(String(codigo || ''));
  if (!item) {
    const err = new Error('No existe esa plantilla.');
    err.status = 404;
    throw err;
  }
  if (item.tipo !== 'generar') {
    const err = new Error('Esta guía no se genera. Puede consultarla desde la lista.');
    err.status = 400;
    throw err;
  }
  if (item.sensible && !verSensibles) {
    const err = new Error('Sin permiso para generar documentos con datos sensibles del PESV.');
    err.status = 403;
    throw err;
  }

  const dir = path.join(DIR_DOCUMENTOS, String(vigencia), item.grupo);
  fs.mkdirSync(dir, { recursive: true });
  const previas = versionesGeneradas(item, vigencia);
  const version = previas.reduce((max, v) => Math.max(max, v.version), 0) + 1;
  const nombreArchivo = `${item.base}_v${version}${item.ext}`;
  const destino = path.join(dir, nombreArchivo);
  if (!dentroDe(DIR_DOCUMENTOS, destino) || !dentroDe(DIR_PLANTILLAS, item.origen)) {
    const err = new Error('Ruta de documento no permitida.');
    err.status = 400;
    throw err;
  }
  fs.copyFileSync(item.origen, destino);

  const datos = item.ext === '.docx' ? await datosDocumento({ vigencia, config, clasificacion }) : null;
  const parche = datos ? parchearDocxDatos(destino, datos) : null;
  if (item.codigo === '05' && item.ext === '.xlsx') {
    parchearAutodiagnostico(destino, clasificacion);
  }
  const nota = notaGeneracion({
    config: { razonSocial: datos?.razon || config?.razonSocial },
    clasificacion,
    vigencia,
    escritos: parche?.escritos,
  });
  const baseConEjemplo = item.codigo === '05' ? false : parche ? parche.quedanEjemplos : true;
  const aviso = item.codigo === '05'
    ? `Listo: ${nombreArchivo}. Ya trae la misionalidad y los vehículos confirmados.`
    : item.ext !== '.docx'
      ? `Listo: ${nombreArchivo}.`
      : parche?.escritos?.length
        ? `Listo: ${nombreArchivo}. Se escribió ${parche.escritos.join(', ')}.${parche.quedanEjemplos ? ' Otros campos entre corchetes siguen para llenarlos en su formulario.' : ''}`
        : `Listo: ${nombreArchivo}. No había razón social ni NIT para escribir. Revise Configuración → Empresa.`;

  const generadoEn = new Date().toISOString();
  const generadoPor = user?.usuario || user?.username || user?.email || '';
  fs.writeFileSync(
    `${destino}.meta.json`,
    JSON.stringify(
      {
        codigo: item.codigo,
        plantilla: item.nombre,
        vigencia,
        version,
        generadoEn,
        generadoPor,
        clasificacion,
        nota,
      },
      null,
      2,
    ),
    'utf8',
  );

  return {
    codigo: item.codigo,
    version,
    nombreArchivo,
    grupo: item.grupo,
    vigencia,
    generadoEn,
    generadoPor,
    baseConEjemplo,
    aviso,
  };
}

function firmaDePlantilla(ext, buffer) {
  if (!buffer?.length) return false;
  if (ext === '.pdf') return buffer.subarray(0, 5).toString('utf8') === '%PDF-';
  if (ext === '.docx' || ext === '.xlsx') return buffer.subarray(0, 2).toString('utf8') === 'PK';
  return false;
}

function reemplazarBase({ codigo, buffer, nombreOriginal, user, permisos }) {
  const verSensibles = puedeVerSensibles(user, permisos);
  const { porCodigo } = leerPlantillas();
  const item = porCodigo.get(String(codigo || ''));
  if (!item) {
    const err = new Error('No existe esa plantilla.');
    err.status = 404;
    throw err;
  }
  if (item.sensible && !verSensibles) {
    const err = new Error('Sin permiso para cambiar este documento.');
    err.status = 403;
    throw err;
  }
  const ext = path.extname(String(nombreOriginal || '')).toLowerCase();
  if (ext !== item.ext) {
    const err = new Error(`Suba un archivo ${item.ext} con el mismo tipo de esta base.`);
    err.status = 400;
    throw err;
  }
  if (!firmaDePlantilla(ext, buffer)) {
    const err = new Error('El archivo no parece un Word, Excel o PDF válido.');
    err.status = 400;
    throw err;
  }
  if (!dentroDe(DIR_PLANTILLAS, item.origen)) {
    const err = new Error('Ruta de plantilla no permitida.');
    err.status = 400;
    throw err;
  }
  const temporal = `${item.origen}.tmp`;
  fs.writeFileSync(temporal, buffer);
  fs.renameSync(temporal, item.origen);
  return {
    codigo: item.codigo,
    nombre: item.nombre,
    actualizadoEn: new Date().toISOString(),
  };
}

function rutaArchivo({ codigo, vigencia, version, user, permisos, base }) {
  const verSensibles = puedeVerSensibles(user, permisos);
  const { porCodigo } = leerPlantillas();
  const item = porCodigo.get(String(codigo || ''));
  if (!item) {
    const err = new Error('No existe esa plantilla.');
    err.status = 404;
    throw err;
  }
  if (item.sensible && !verSensibles) {
    const err = new Error('Sin permiso para consultar este documento.');
    err.status = 403;
    throw err;
  }

  let archivo;
  let descarga;
  if (base || (!version && item.tipo === 'referencia')) {
    archivo = item.origen;
    descarga = item.nombre;
  } else {
    const n = Number(version);
    if (!n) {
      const err = new Error('Indique la versión del documento generado.');
      err.status = 400;
      throw err;
    }
    descarga = `${item.base}_v${n}${item.ext}`;
    archivo = path.join(DIR_DOCUMENTOS, String(vigencia), item.grupo, descarga);
  }
  const raiz = base || (!version && item.tipo === 'referencia') ? DIR_PLANTILLAS : DIR_DOCUMENTOS;
  if (!dentroDe(raiz, archivo) || !fs.existsSync(archivo)) {
    const err = new Error('El archivo no está en el servidor.');
    err.status = 404;
    throw err;
  }
  return { archivo, descarga };
}

module.exports = {
  listar,
  generar,
  reemplazarBase,
  rutaArchivo,
  DIR_DOCUMENTOS,
  DIR_PLANTILLAS,
};
