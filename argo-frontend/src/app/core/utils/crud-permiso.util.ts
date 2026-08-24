import { permisoConcedido } from './permiso-legacy.util';

export type AccionCrud = 'ver' | 'crear' | 'editar' | 'eliminar';

export type ModuloCrud =
  | 'alumnos'
  | 'matriculas'
  | 'programas'
  | 'servicios'
  | 'certificados'
  | 'ingresos'
  | 'liquidaciones'
  | 'combos'
  | 'vehiculos'
  | 'egresos'
  | 'empleados'
  | 'clientes'
  | 'terceros'
  | 'gestores'
  | 'jornadas';

export const ACCIONES_CRUD: AccionCrud[] = ['ver', 'crear', 'editar', 'eliminar'];

export const ETIQUETA_ACCION_CORTA: Record<AccionCrud, string> = {
  ver: 'Ver',
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
};

export const CATEGORIAS_CRUD = [
  { id: 'academico', label: 'Académico y alumnos' },
  { id: 'caja', label: 'Caja y facturación' },
  { id: 'flota', label: 'Flota' },
  { id: 'rrhh', label: 'Recursos humanos' },
] as const;

const MODULOS_CRUD: Record<
  ModuloCrud,
  {
    label: string;
    prefijo: string;
    categoria: string;
    orden: number;
    legacyPorAccion: Partial<Record<AccionCrud, string[]>>;
  }
> = {
  alumnos: {
    label: 'Alumnos',
    prefijo: 'alumnos',
    categoria: 'academico',
    orden: 10,
    legacyPorAccion: {
      ver: ['alumnos.ver', 'alumnos.gestionar', 'alumnos.pagos'],
      crear: ['alumnos.gestionar', 'alumnos.crear'],
      editar: ['alumnos.gestionar', 'alumnos.editar'],
      eliminar: ['alumnos.gestionar', 'alumnos.eliminar'],
    },
  },
  matriculas: {
    label: 'Matrículas',
    prefijo: 'matriculas',
    categoria: 'academico',
    orden: 15,
    legacyPorAccion: {
      ver: ['alumnos.ver', 'alumnos.gestionar', 'alumnos.pagos'],
      crear: ['alumnos.pagos', 'alumnos.gestionar'],
      editar: ['alumnos.pagos', 'alumnos.gestionar'],
      eliminar: ['alumnos.gestionar'],
    },
  },
  programas: {
    label: 'Programas',
    prefijo: 'programas',
    categoria: 'academico',
    orden: 20,
    legacyPorAccion: {
      ver: ['programas.ver', 'programas.gestionar', 'programas.agregar'],
      crear: ['programas.agregar', 'programas.gestionar', 'programas.crear'],
      editar: ['programas.gestionar', 'programas.editar'],
      eliminar: ['programas.gestionar', 'programas.eliminar'],
    },
  },
  servicios: {
    label: 'Servicios (catálogo)',
    prefijo: 'servicios',
    categoria: 'academico',
    orden: 30,
    legacyPorAccion: {
      ver: ['servicios.ver', 'servicios.gestionar'],
      crear: ['servicios.gestionar', 'servicios.crear'],
      editar: ['servicios.gestionar', 'servicios.editar'],
      eliminar: ['servicios.gestionar', 'servicios.eliminar'],
    },
  },
  certificados: {
    label: 'Certificados',
    prefijo: 'certificados',
    categoria: 'academico',
    orden: 40,
    legacyPorAccion: {
      ver: ['alumnos.certificados', 'certificados.vencidos'],
      crear: ['alumnos.certificados', 'certificados.crear'],
      editar: ['alumnos.certificados', 'certificados.editar'],
      eliminar: ['alumnos.certificados', 'certificados.eliminar'],
    },
  },
  liquidaciones: {
    label: 'Ítems de liquidación',
    prefijo: 'liquidaciones',
    categoria: 'academico',
    orden: 50,
    legacyPorAccion: {
      ver: ['alumnos.ver', 'alumnos.gestionar', 'alumnos.pagos', 'ingresos.ver', 'ingresos.crear'],
      crear: ['alumnos.gestionar', 'liquidaciones.crear'],
      editar: ['alumnos.gestionar', 'liquidaciones.editar'],
      eliminar: ['alumnos.gestionar', 'liquidaciones.eliminar'],
    },
  },
  combos: {
    label: 'Combos de cursos',
    prefijo: 'combos',
    categoria: 'academico',
    orden: 55,
    legacyPorAccion: {
      ver: ['combos.gestionar', 'alumnos.pagos', 'alumnos.gestionar'],
      crear: ['combos.gestionar', 'combos.crear'],
      editar: ['combos.gestionar', 'combos.editar'],
      eliminar: ['combos.gestionar', 'combos.eliminar'],
    },
  },
  jornadas: {
    label: 'Contratos y jornadas',
    prefijo: 'jornadas',
    categoria: 'academico',
    orden: 60,
    legacyPorAccion: {
      ver: ['jornadas.ver', 'jornadas.gestionar', 'jornadas.operar', 'jornadas.registrar_alumnos'],
      crear: ['jornadas.gestionar', 'jornadas.crear'],
      editar: ['jornadas.gestionar', 'jornadas.editar'],
      eliminar: ['jornadas.gestionar', 'jornadas.eliminar'],
    },
  },
  ingresos: {
    label: 'Pagos / ingresos',
    prefijo: 'ingresos',
    categoria: 'caja',
    orden: 70,
    legacyPorAccion: {
      ver: ['alumnos.pagos', 'caja.turno', 'caja.cobros', 'caja.admin', 'contabilidad', 'ingresos.ver', 'ingresos.crear'],
      crear: ['alumnos.pagos', 'caja.turno', 'caja.cobros', 'contabilidad', 'ingresos.crear'],
      editar: ['alumnos.pagos', 'caja.admin', 'contabilidad', 'ingresos.editar'],
      eliminar: ['caja.admin', 'contabilidad', 'ingresos.eliminar'],
    },
  },
  egresos: {
    label: 'Egresos / gastos',
    prefijo: 'egresos',
    categoria: 'caja',
    orden: 80,
    legacyPorAccion: {
      ver: ['caja.turno', 'caja.admin', 'contabilidad'],
      crear: ['caja.turno', 'caja.admin', 'contabilidad', 'egresos.crear'],
      editar: ['caja.admin', 'contabilidad', 'egresos.editar'],
      eliminar: ['caja.admin', 'contabilidad', 'egresos.eliminar'],
    },
  },
  clientes: {
    label: 'Clientes / empresas',
    prefijo: 'clientes',
    categoria: 'caja',
    orden: 90,
    legacyPorAccion: {
      ver: [
        'facturacion',
        'config.facturacion',
        'alumnos.pagos',
        'caja.turno',
        'caja.admin',
        'contabilidad',
        'jornadas.gestionar',
      ],
      crear: ['facturacion', 'config.facturacion', 'caja.admin', 'contabilidad', 'clientes.crear'],
      editar: ['facturacion', 'config.facturacion', 'caja.admin', 'contabilidad', 'clientes.editar'],
      eliminar: ['facturacion', 'config.facturacion', 'caja.admin', 'contabilidad', 'clientes.eliminar'],
    },
  },
  terceros: {
    label: 'Terceros (caja)',
    prefijo: 'terceros',
    categoria: 'caja',
    orden: 95,
    legacyPorAccion: {
      ver: ['caja.admin', 'contabilidad'],
      crear: ['caja.admin', 'contabilidad', 'terceros.crear'],
      editar: ['caja.admin', 'contabilidad', 'terceros.editar'],
      eliminar: ['caja.admin', 'contabilidad', 'terceros.eliminar'],
    },
  },
  gestores: {
    label: 'Gestores comerciales',
    prefijo: 'gestores',
    categoria: 'caja',
    orden: 100,
    legacyPorAccion: {
      ver: ['caja.admin', 'contabilidad'],
      crear: ['caja.admin', 'contabilidad', 'gestores.crear'],
      editar: ['caja.admin', 'contabilidad', 'gestores.editar'],
      eliminar: ['caja.admin', 'contabilidad', 'gestores.eliminar'],
    },
  },
  vehiculos: {
    label: 'Vehículos',
    prefijo: 'vehiculos',
    categoria: 'flota',
    orden: 110,
    legacyPorAccion: {
      ver: ['vehiculos', 'instructores.inspeccion'],
      crear: ['vehiculos', 'vehiculos.crear'],
      editar: ['vehiculos', 'vehiculos.editar'],
      eliminar: ['vehiculos', 'vehiculos.eliminar'],
    },
  },
  empleados: {
    label: 'Empleados (RRHH)',
    prefijo: 'empleados',
    categoria: 'rrhh',
    orden: 120,
    legacyPorAccion: {
      ver: ['rrhh'],
      crear: ['rrhh', 'empleados.crear'],
      editar: ['rrhh', 'empleados.editar'],
      eliminar: ['rrhh', 'empleados.eliminar'],
    },
  },
};

export function claveAccionModulo(modulo: ModuloCrud, accion: AccionCrud): string {
  const def = MODULOS_CRUD[modulo];
  return `${def.prefijo}.${accion}`;
}

export function etiquetaModulo(modulo: ModuloCrud | string): string {
  return MODULOS_CRUD[modulo as ModuloCrud]?.label || String(modulo);
}

export function modulosCrudOrdenados(): Array<{
  id: ModuloCrud;
  label: string;
  prefijo: string;
  categoria: string;
  orden: number;
}> {
  return (Object.entries(MODULOS_CRUD) as [ModuloCrud, (typeof MODULOS_CRUD)[ModuloCrud]][])
    .map(([id, def]) => ({
      id,
      label: def.label,
      prefijo: def.prefijo,
      categoria: def.categoria,
      orden: def.orden,
    }))
    .sort((a, b) => a.orden - b.orden || a.label.localeCompare(b.label, 'es'));
}

export function tieneAccionModulo(
  permisos: string[],
  modulo: ModuloCrud,
  accion: AccionCrud,
): boolean {
  if (!permisos.length) return false;
  if (permisos.includes('*')) return true;
  if (!MODULOS_CRUD[modulo] || !ACCIONES_CRUD.includes(accion)) return false;

  const clave = claveAccionModulo(modulo, accion);
  if (permisoConcedido(permisos, clave)) return true;

  const legacy = MODULOS_CRUD[modulo].legacyPorAccion?.[accion] || [];
  return legacy.some((k) => permisos.includes(k));
}

/** Activa o desactiva un permiso CRUD granular, expandiendo legacy al desactivar. */
export function aplicarAccionCrudEnPermisos(
  permisos: string[],
  modulo: ModuloCrud,
  accion: AccionCrud,
  activo: boolean,
): string[] {
  if (permisos.includes('*')) return permisos;
  const def = MODULOS_CRUD[modulo];
  const clave = claveAccionModulo(modulo, accion);
  let p = [...permisos];

  if (activo) {
    if (!p.includes(clave)) p.push(clave);
    return p;
  }

  p = p.filter((k) => k !== clave);
  const legacy = def.legacyPorAccion?.[accion] || [];
  for (const leg of legacy) {
    if (!p.includes(leg)) continue;
    p = p.filter((k) => k !== leg);
    for (const otra of ACCIONES_CRUD) {
      if (otra === accion) continue;
      if (def.legacyPorAccion?.[otra]?.includes(leg)) {
        const k = claveAccionModulo(modulo, otra);
        if (!p.includes(k)) p.push(k);
      }
    }
  }
  return p;
}

export function aplicarFilaCrudEnPermisos(
  permisos: string[],
  modulo: ModuloCrud,
  activo: boolean,
): string[] {
  let p = [...permisos];
  for (const accion of ACCIONES_CRUD) {
    p = aplicarAccionCrudEnPermisos(p, modulo, accion, activo);
  }
  return p;
}

export function puedeAutorizarOperaciones(permisos: string[]): boolean {
  if (!permisos.length) return false;
  if (permisos.includes('*')) return true;
  return (
    permisoConcedido(permisos, 'config.autorizaciones') || permisoConcedido(permisos, 'config.roles')
  );
}

export function contarAccionesCrudActivas(permisos: string[], modulo: ModuloCrud): number {
  return ACCIONES_CRUD.filter((a) => tieneAccionModulo(permisos, modulo, a)).length;
}

export function filaCrudCompleta(permisos: string[], modulo: ModuloCrud): boolean {
  return ACCIONES_CRUD.every((a) => tieneAccionModulo(permisos, modulo, a));
}
