/**
 * Catálogo de permisos y alarmas relevantes para cada app móvil.
 * Se editan desde Configuración → Apps móviles; se guardan en el mismo RolApp
 * (sin borrar permisos/alarmas del resto del sistema).
 */
export type AppMovilId = 'jornadas' | 'cajero';

export interface AppMovilPermiso {
  key: string;
  label: string;
  hint?: string;
}

export interface AppMovilAlarma {
  key: string;
  label: string;
  hint?: string;
}

export interface AppMovilDef {
  id: AppMovilId;
  label: string;
  descripcion: string;
  icon: string;
  accent: 'teal' | 'emerald';
  permisos: AppMovilPermiso[];
  alarmas: AppMovilAlarma[];
}

export const APPS_MOVILES: AppMovilDef[] = [
  {
    id: 'jornadas',
    label: 'App Jornadas',
    descripcion:
      'Operación en campo: jornadas del día, clases, asistencia, certificados e informes (admin).',
    icon: '📱',
    accent: 'teal',
    permisos: [
      {
        key: 'jornadas.operar',
        label: 'Operar jornadas',
        hint: 'Entrar a la app, ver jornada del día y operar clases/asistencia',
      },
      {
        key: 'jornadas.registrar_alumnos',
        label: 'Registrar alumnos (alta ficha)',
        hint: 'Nuevo alumno jornada — lo hace Registro/Recepción, no el instructor de campo',
      },
      {
        key: 'jornadas.gestionar',
        label: 'Gestionar (admin móvil)',
        hint: 'Crear/editar jornadas de cualquier fecha, GPS e informes PDF del contrato',
      },
      {
        key: 'jornadas.ver',
        label: 'Consultar / informes',
        hint: 'Ver dashboard e informes del contrato en la app',
      },
    ],
    alarmas: [
      {
        key: 'alarmas.jornadas.en_proceso',
        label: 'Jornada(s) en proceso hoy',
        hint: 'Aviso cuando hay jornadas EN PROCESO (si la app lo consulta)',
      },
      {
        key: 'alarmas.jornadas.certificado_nuevo',
        label: 'Certificado recién emitido',
        hint: 'Aviso de certificados nuevos de jornadas',
      },
    ],
  },
  {
    id: 'cajero',
    label: 'App Cajero',
    descripcion:
      'Caja del turno, cobros, alumnos, certificados, facturación y alertas de caja en el celular.',
    icon: '💳',
    accent: 'emerald',
    permisos: [
      {
        key: 'caja.turno',
        label: 'Caja del turno',
        hint: 'Apertura, cuadre y movimientos del día',
      },
      {
        key: 'caja.cobros',
        label: 'Cobros pendientes',
        hint: 'Módulo de cobros en la app',
      },
      {
        key: 'caja.admin',
        label: 'Caja admin',
        hint: 'Cierres, descuadres y movimientos globales',
      },
      {
        key: 'alumnos.ver',
        label: 'Consultar alumnos',
        hint: 'Ver ficha de alumnos en la app',
      },
      {
        key: 'alumnos.gestionar',
        label: 'Gestionar alumnos',
        hint: 'Crear/editar alumnos desde la app',
      },
      {
        key: 'alumnos.certificados',
        label: 'Certificados',
        hint: 'Emitir y consultar certificados',
      },
      {
        key: 'facturacion',
        label: 'Facturación',
        hint: 'Módulo de facturación en la app',
      },
      {
        key: 'programas.ver',
        label: 'Consultar programas',
        hint: 'Ver programas académicos',
      },
      {
        key: 'programas.gestionar',
        label: 'Gestionar programas',
        hint: 'Administrar programas',
      },
      {
        key: 'programas.agregar',
        label: 'Crear programas',
        hint: 'Alta de programas (sin eliminar)',
      },
      {
        key: 'servicios.ver',
        label: 'Consultar servicios',
        hint: 'Ver servicios',
      },
      {
        key: 'servicios.gestionar',
        label: 'Gestionar servicios',
        hint: 'Administrar servicios',
      },
    ],
    alarmas: [
      {
        key: 'alarmas.caja.cerrada',
        label: 'Caja personal cerrada',
        hint: 'Banner / aviso de caja cerrada',
      },
      {
        key: 'alarmas.caja.descuadres',
        label: 'Descuadres pendientes',
        hint: 'Requiere permiso caja.admin en la app',
      },
      {
        key: 'alarmas.caja.sin_abrir',
        label: 'Sin caja abierta al cobrar',
        hint: 'Aviso al intentar cobrar o egresar sin caja',
      },
      {
        key: 'alarmas.caja.alerta_pago',
        label: 'Recordatorio de cobro',
        hint: 'Día programado de cobro a alumnos',
      },
      {
        key: 'alarmas.alumnos.comprobante_ingreso',
        label: 'Comprobante de ingreso',
        hint: 'Alerta de ingreso reciente',
      },
      {
        key: 'alarmas.alumnos.comprobante_egreso',
        label: 'Comprobante de egreso',
        hint: 'Alerta de egreso reciente',
      },
      {
        key: 'alarmas.alumnos.factura',
        label: 'Factura',
        hint: 'Alerta de factura reciente',
      },
      {
        key: 'alarmas.jornadas.certificado_nuevo',
        label: 'Certificado recién emitido',
        hint: 'Certificados de jornadas / aula',
      },
      {
        key: 'alarmas.certificados.vencimiento',
        label: 'Certificados por vencer',
        hint: 'Antelación configurable en Alertas',
      },
      {
        key: 'alarmas.certificados.vencidos',
        label: 'Certificados vencidos',
        hint: 'Gracia configurable en Alertas',
      },
      {
        key: 'alarmas.jornadas.en_proceso',
        label: 'Jornadas en proceso',
        hint: 'Aviso de jornadas activas hoy',
      },
      {
        key: 'alarmas.empleados.docs_vencidos',
        label: 'Docs. empleados por vencer',
        hint: 'RRHH en la app cajero',
      },
      {
        key: 'alarmas.empleados.docs_faltantes',
        label: 'Docs. empleados faltantes',
        hint: 'RRHH en la app cajero',
      },
    ],
  },
];

export function appMovilPorId(id: AppMovilId): AppMovilDef {
  return APPS_MOVILES.find((a) => a.id === id) || APPS_MOVILES[0];
}

export function clavesPermisosApp(app: AppMovilDef): string[] {
  return app.permisos.map((p) => p.key);
}

export function clavesAlarmasApp(app: AppMovilDef): string[] {
  return app.alarmas.map((a) => a.key);
}
