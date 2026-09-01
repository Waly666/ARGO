/** Pantallas configurables de la app móvil Jornadas (Configuración → Roles y permisos). */
export type JornadasAppPantalla =
  | 'hoy'
  | 'operar_clase'
  | 'registrar_alumno'
  | 'certificados'
  | 'gestionar'
  | 'crear'
  | 'editar'
  | 'informes';

export const JORNADAS_APP_PERMISO: Record<JornadasAppPantalla, string> = {
  hoy: 'jornadas.app.hoy',
  operar_clase: 'jornadas.app.operar_clase',
  registrar_alumno: 'jornadas.app.registrar_alumno',
  certificados: 'jornadas.app.certificados',
  gestionar: 'jornadas.app.gestionar',
  crear: 'jornadas.app.crear',
  editar: 'jornadas.app.editar',
  informes: 'jornadas.app.informes',
};

/** Permisos ERP amplios que conceden pantallas de la app (roles ya guardados). */
const JORNADAS_APP_LEGACY: Record<string, string[]> = {
  'jornadas.operar': [
    JORNADAS_APP_PERMISO.hoy,
    JORNADAS_APP_PERMISO.operar_clase,
    JORNADAS_APP_PERMISO.certificados,
  ],
  'jornadas.gestionar': Object.values(JORNADAS_APP_PERMISO),
  'jornadas.registrar_alumnos': [JORNADAS_APP_PERMISO.registrar_alumno],
  'jornadas.ver': [JORNADAS_APP_PERMISO.informes],
  'alumnos.certificados': [JORNADAS_APP_PERMISO.certificados],
};

function concedidoPorLegacy(permisos: string[], clave: string): boolean {
  for (const [legacy, concedidos] of Object.entries(JORNADAS_APP_LEGACY)) {
    if (permisos.includes(legacy) && concedidos.includes(clave)) return true;
  }
  return false;
}

export function tienePermiso(permisos: string[] | undefined, clave: string | string[]): boolean {
  const keys = Array.isArray(clave) ? clave : [clave];
  const p = permisos || [];
  if (!p.length) return false;
  if (p.includes('*')) return true;
  if (keys.some((k) => p.includes(k))) return true;
  return keys.some((k) => concedidoPorLegacy(p, k));
}

export function puedePantallaJornadas(
  permisos: string[] | undefined,
  pantalla: JornadasAppPantalla,
): boolean {
  return tienePermiso(permisos, JORNADAS_APP_PERMISO[pantalla]);
}

export function pantallasJornadasVisibles(permisos: string[] | undefined): JornadasAppPantalla[] {
  return (Object.keys(JORNADAS_APP_PERMISO) as JornadasAppPantalla[]).filter((p) =>
    puedePantallaJornadas(permisos, p),
  );
}

export function puedeOperarJornadas(permisos?: string[]): boolean {
  return (
    puedePantallaJornadas(permisos, 'operar_clase') ||
    tienePermiso(permisos, ['jornadas.operar', 'jornadas.gestionar'])
  );
}

/** Entrar a la app móvil Jornadas. */
export function puedeUsarAppJornadas(permisos?: string[]): boolean {
  if (tienePermiso(permisos, '*')) return true;
  if (pantallasJornadasVisibles(permisos).length > 0) return true;
  return tienePermiso(permisos, [
    'jornadas.operar',
    'jornadas.gestionar',
    'jornadas.registrar_alumnos',
  ]);
}

/** Alta de ficha «Nuevo alumno jornada». */
export function puedeRegistrarAlumnosJornada(permisos?: string[]): boolean {
  return puedePantallaJornadas(permisos, 'registrar_alumno');
}

/** Gestión completa de jornadas (ERP + funciones admin dentro de pantallas). */
export function puedeGestionarJornadas(
  permisos?: string[],
  rol?: string,
  rolNombre?: string,
): boolean {
  if (puedePantallaJornadas(permisos, 'gestionar')) return true;
  if (tienePermiso(permisos, ['*', 'jornadas.gestionar'])) return true;
  const r = String(rol || '').trim().toLowerCase();
  if (r === 'admin' || r === 'administrador') return true;
  const rn = String(rolNombre || '').trim().toLowerCase();
  if (rn.includes('admin')) return true;
  return false;
}

export function puedeVerCertificadosApp(permisos?: string[]): boolean {
  return puedePantallaJornadas(permisos, 'certificados');
}

export function puedeInformesApp(permisos?: string[]): boolean {
  return puedePantallaJornadas(permisos, 'informes');
}
