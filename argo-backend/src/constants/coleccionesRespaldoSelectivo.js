const { MODULOS_RESET } = require('./modulosResetEmpresa');

const ETIQUETAS_COLECCION = {
  usuarios: 'Usuarios del personal (ERP)',
  roles_app: 'Roles y permisos del sistema',
  config: 'Configuración clave-valor',
};

const FRASE_RESTAURAR = 'RESTAURAR SELECTIVO';

function etiquetaColeccion(nombre) {
  return ETIQUETAS_COLECCION[nombre] || nombre;
}

/** Catálogo agrupado para la UI del backup selectivo. */
function listarGruposSelectivos() {
  const grupos = [];
  for (const mod of MODULOS_RESET) {
    if (mod.especial === 'usuarios') {
      grupos.push({
        id: mod.id,
        etiqueta: mod.etiqueta,
        descripcion: mod.descripcion,
        advertencias: mod.advertencias || [],
        colecciones: [{ nombre: 'usuarios', etiqueta: etiquetaColeccion('usuarios') }],
      });
      continue;
    }
    if (mod.especial === 'config') {
      grupos.push({
        id: mod.id,
        etiqueta: mod.etiqueta,
        descripcion: mod.descripcion,
        advertencias: mod.advertencias || [],
        colecciones: [
          { nombre: 'config', etiqueta: etiquetaColeccion('config') },
          { nombre: 'roles_app', etiqueta: etiquetaColeccion('roles_app') },
        ],
      });
      continue;
    }
    if (!mod.colecciones?.length) continue;
    grupos.push({
      id: mod.id,
      etiqueta: mod.etiqueta,
      descripcion: mod.descripcion,
      advertencias: mod.advertencias || [],
      colecciones: mod.colecciones.map((nombre) => ({
        nombre,
        etiqueta: etiquetaColeccion(nombre),
      })),
    });
  }
  return grupos;
}

function nombresCatalogoSelectivo() {
  const set = new Set();
  for (const g of listarGruposSelectivos()) {
    for (const c of g.colecciones) set.add(c.nombre);
  }
  return set;
}

function esNombreColeccionInvalido(nombre) {
  const n = String(nombre || '').trim();
  if (!n) return true;
  if (n.startsWith('system.')) return true;
  if (n.includes('__argo_restore') || n.includes('__staging')) return true;
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(n)) return true;
  return false;
}

function normalizarSeleccion(colecciones) {
  if (!Array.isArray(colecciones)) {
    const err = new Error('Seleccione al menos una tabla para el respaldo selectivo');
    err.status = 400;
    throw err;
  }
  const out = [...new Set(colecciones.map((c) => String(c || '').trim()).filter(Boolean))];
  const invalidas = out.filter((n) => esNombreColeccionInvalido(n));
  if (invalidas.length) {
    const err = new Error(`Nombres de tabla no válidos: ${invalidas.join(', ')}`);
    err.status = 400;
    throw err;
  }
  if (!out.length) {
    const err = new Error('Seleccione al menos una tabla para el respaldo selectivo');
    err.status = 400;
    throw err;
  }
  return out.sort();
}

module.exports = {
  FRASE_RESTAURAR,
  listarGruposSelectivos,
  nombresCatalogoSelectivo,
  normalizarSeleccion,
  etiquetaColeccion,
};
