import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { permisoGuard } from './core/guards/permiso.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'recibo/:ingresoId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/recibo/recibo-ingreso.component').then((m) => m.ReciboIngresoComponent),
  },
  {
    path: 'recibo-egreso/:egresoId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/recibo/recibo-egreso.component').then((m) => m.ReciboEgresoComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [permisoGuard],
        data: { permiso: 'dashboard' },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'alumnos',
        pathMatch: 'full',
        canActivate: [permisoGuard],
        data: { permiso: ['alumnos.ver', 'alumnos.gestionar'] },
        loadComponent: () =>
          import('./features/alumnos/alumnos-lista.component').then((m) => m.AlumnosListaComponent),
      },
      {
        path: 'alumnos/nuevo',
        canActivate: [permisoGuard],
        data: { permiso: 'alumnos.gestionar' },
        loadComponent: () =>
          import('./features/alumnos/alumno-detalle.component').then((m) => m.AlumnoDetalleComponent),
      },
      {
        path: 'alumnos/:id',
        canActivate: [permisoGuard],
        data: { permiso: ['alumnos.ver', 'alumnos.gestionar'] },
        loadComponent: () =>
          import('./features/alumnos/alumno-detalle.component').then((m) => m.AlumnoDetalleComponent),
      },
      {
        path: 'programas',
        canActivate: [permisoGuard],
        data: { permiso: ['programas.ver', 'programas.gestionar', 'programas.agregar'] },
        loadComponent: () =>
          import('./features/programas/programas-admin.component').then((m) => m.ProgramasAdminComponent),
      },
      {
        path: 'jornadas/alumnos/nuevo',
        canActivate: [permisoGuard],
        data: { permiso: ['alumnos.gestionar', 'jornadas.gestionar'], modoAlumnos: 'jornadas' },
        loadComponent: () =>
          import('./features/alumnos/alumno-detalle.component').then((m) => m.AlumnoDetalleComponent),
      },
      {
        path: 'jornadas/alumnos/:id',
        canActivate: [permisoGuard],
        data: { permiso: ['alumnos.ver', 'alumnos.gestionar', 'jornadas.ver'], modoAlumnos: 'jornadas' },
        loadComponent: () =>
          import('./features/alumnos/alumno-detalle.component').then((m) => m.AlumnoDetalleComponent),
      },
      {
        path: 'jornadas/alumnos',
        pathMatch: 'full',
        canActivate: [permisoGuard],
        data: { permiso: ['alumnos.ver', 'alumnos.gestionar', 'jornadas.ver'], modoAlumnos: 'jornadas' },
        loadComponent: () =>
          import('./features/alumnos/alumnos-lista.component').then((m) => m.AlumnosListaComponent),
      },
      {
        path: 'jornadas/instructor',
        canActivate: [permisoGuard],
        data: { permiso: ['jornadas.operar', 'jornadas.gestionar'] },
        loadComponent: () =>
          import('./features/jornadas/jornada-instructor.component').then((m) => m.JornadaInstructorComponent),
      },
      {
        path: 'jornadas/certificados',
        canActivate: [permisoGuard],
        data: { permiso: ['jornadas.ver', 'jornadas.gestionar'] },
        loadComponent: () =>
          import('./features/jornadas/certificados-jornada-lista.component').then(
            (m) => m.CertificadosJornadaListaComponent,
          ),
      },
      {
        path: 'jornadas/en-proceso',
        canActivate: [permisoGuard],
        data: { permiso: ['jornadas.ver', 'jornadas.gestionar'] },
        loadComponent: () =>
          import('./features/jornadas/jornadas-en-proceso-lista.component').then(
            (m) => m.JornadasEnProcesoListaComponent,
          ),
      },
      {
        path: 'jornadas/clases-hoy',
        canActivate: [permisoGuard],
        data: { permiso: ['jornadas.ver', 'jornadas.gestionar', 'jornadas.operar'] },
        loadComponent: () =>
          import('./features/jornadas/clases-hoy-lista.component').then(
            (m) => m.ClasesHoyListaComponent,
          ),
      },
      {
        path: 'jornadas',
        pathMatch: 'full',
        canActivate: [permisoGuard],
        data: { permiso: ['jornadas.ver', 'jornadas.gestionar', 'jornadas.operar'] },
        loadComponent: () =>
          import('./features/jornadas/jornadas-hub.component').then((m) => m.JornadasHubComponent),
      },
      {
        path: 'contratos',
        canActivate: [permisoGuard],
        data: { permiso: ['jornadas.ver', 'jornadas.gestionar'] },
        loadComponent: () =>
          import('./features/jornadas/contratos-lista.component').then((m) => m.ContratosListaComponent),
      },
      {
        path: 'servicios',
        canActivate: [permisoGuard],
        data: { permiso: ['servicios.ver', 'servicios.gestionar'] },
        loadComponent: () =>
          import('./features/servicios/servicios-admin.component').then((m) => m.ServiciosAdminComponent),
      },
      { path: 'clases', redirectTo: 'programas', pathMatch: 'full' },
      {
        path: 'facturacion',
        canActivate: [permisoGuard],
        data: { title: 'Facturación', permiso: 'facturacion' },
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
      },
      {
        path: 'instructores',
        canActivate: [permisoGuard],
        data: { title: 'Instructores', permiso: ['instructores', 'rrhh', 'jornadas.ver', 'jornadas.gestionar'] },
        loadComponent: () =>
          import('./features/instructores/instructores-lista.component').then((m) => m.InstructoresListaComponent),
      },
      {
        path: 'programacion-cea',
        canActivate: [permisoGuard],
        data: { permiso: ['programacion_cea.ver', 'programacion_cea.gestionar', 'programacion_cea.operar'] },
        loadComponent: () =>
          import('./features/programacion-cea/programacion-cea-hub.component').then(
            (m) => m.ProgramacionCeaHubComponent,
          ),
      },
      {
        path: 'programacion-cea/clases-hoy',
        canActivate: [permisoGuard],
        data: { permiso: ['programacion_cea.ver', 'programacion_cea.gestionar', 'programacion_cea.operar'] },
        loadComponent: () =>
          import('./features/programacion-cea/programacion-cea-clases-hoy.component').then(
            (m) => m.ProgramacionCeaClasesHoyComponent,
          ),
      },
      {
        path: 'cobros-pendientes',
        canActivate: [permisoGuard],
        data: { permiso: ['caja.cobros', 'caja.turno'] },
        loadComponent: () =>
          import('./features/caja/caja-cobros-pendientes.component').then((m) => m.CajaCobrosPendientesComponent),
      },
      {
        path: 'caja/ingresos-todos',
        canActivate: [permisoGuard],
        data: { permiso: 'caja.admin' },
        loadComponent: () =>
          import('./features/caja/caja-ingresos-todos.component').then((m) => m.CajaIngresosTodosComponent),
      },
      {
        path: 'caja/egresos-todos',
        canActivate: [permisoGuard],
        data: { permiso: 'caja.admin' },
        loadComponent: () =>
          import('./features/caja/caja-egresos-todos.component').then((m) => m.CajaEgresosTodosComponent),
      },
      {
        path: 'caja/descuadres',
        canActivate: [permisoGuard],
        data: { permiso: 'caja.admin' },
        loadComponent: () =>
          import('./features/caja/caja-descuadres-admin.component').then((m) => m.CajaDescuadresAdminComponent),
      },
      {
        path: 'cierres',
        canActivate: [permisoGuard],
        data: { permiso: 'caja.admin' },
        loadComponent: () =>
          import('./features/caja/caja-cierres-admin.component').then((m) => m.CajaCierresAdminComponent),
      },
      {
        path: 'cierres/:idSesion',
        canActivate: [permisoGuard],
        data: { permiso: 'caja.admin' },
        loadComponent: () =>
          import('./features/caja/caja-cierre-detalle.component').then((m) => m.CajaCierreDetalleComponent),
      },
      {
        path: 'cierre-general',
        canActivate: [permisoGuard],
        data: { permiso: 'caja.admin' },
        loadComponent: () =>
          import('./features/caja/caja-cierre-general.component').then((m) => m.CajaCierreGeneralComponent),
      },
      { path: 'caja/cierre-general', redirectTo: 'cierre-general', pathMatch: 'full' },
      { path: 'caja/admin', redirectTo: 'cierre-general', pathMatch: 'full' },
      {
        path: 'caja',
        canActivate: [permisoGuard],
        data: { permiso: 'caja.turno' },
        loadComponent: () =>
          import('./features/caja/caja-layout.component').then((m) => m.CajaLayoutComponent),
        children: [
          {
            path: 'cierres/:idSesion',
            canActivate: [permisoGuard],
            data: { permiso: 'caja.admin' },
            loadComponent: () =>
              import('./features/caja/caja-cierre-detalle.component').then((m) => m.CajaCierreDetalleComponent),
          },
          { path: '', loadComponent: () => import('./features/caja/caja-cuadre.component').then((m) => m.CajaCuadreComponent) },
          {
            path: 'ingresos',
            loadComponent: () =>
              import('./features/caja/caja-ingresos-sesion.component').then((m) => m.CajaIngresosSesionComponent),
          },
          {
            path: 'ingresos/nuevo',
            loadComponent: () =>
              import('./features/caja/ingresos-caja-form.component').then((m) => m.IngresosCajaFormComponent),
          },
          {
            path: 'egresos',
            loadComponent: () =>
              import('./features/caja/caja-egresos-sesion.component').then((m) => m.CajaEgresosSesionComponent),
          },
          {
            path: 'egresos/nuevo',
            loadComponent: () =>
              import('./features/caja/egresos-admin.component').then((m) => m.EgresosAdminComponent),
          },
          {
            path: 'egresos/editar/:id',
            loadComponent: () =>
              import('./features/caja/egresos-admin.component').then((m) => m.EgresosAdminComponent),
          },
        ],
      },
      { path: 'caja/cobros', redirectTo: 'cobros-pendientes', pathMatch: 'full' },
      { path: 'caja/empleados', redirectTo: 'rrhh/empleados', pathMatch: 'full' },
      {
        path: 'rrhh',
        canActivate: [permisoGuard],
        data: { permiso: 'rrhh' },
        loadComponent: () =>
          import('./features/rrhh/rrhh-layout.component').then((m) => m.RrhhLayoutComponent),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'inicio' },
          {
            path: 'inicio',
            loadComponent: () =>
              import('./features/rrhh/rrhh-hub.component').then((m) => m.RrhhHubComponent),
          },
          {
            path: 'empleados',
            loadComponent: () =>
              import('./features/rrhh/empleados-admin.component').then((m) => m.EmpleadosAdminComponent),
          },
          {
            path: 'contratos',
            loadComponent: () =>
              import('./features/rrhh/contratos-admin.component').then((m) => m.ContratosAdminComponent),
          },
          { path: 'catalogos', pathMatch: 'full', redirectTo: 'catalogos/cargos' },
          {
            path: 'catalogos/:tab',
            loadComponent: () =>
              import('./features/rrhh/rrhh-catalog-admin.component').then((m) => m.RrhhCatalogAdminComponent),
          },
          {
            path: 'nomina',
            loadComponent: () =>
              import('./features/rrhh/nomina-admin.component').then((m) => m.NominaAdminComponent),
          },
          {
            path: 'novedades',
            loadComponent: () =>
              import('./features/rrhh/novedades-admin.component').then((m) => m.NovedadesAdminComponent),
          },
          { path: 'cargos', redirectTo: 'catalogos/cargos', pathMatch: 'full' },
          { path: 'departamentos', redirectTo: 'catalogos/departamentos', pathMatch: 'full' },
          { path: 'eps', redirectTo: 'catalogos/eps', pathMatch: 'full' },
          { path: 'afp', redirectTo: 'catalogos/afp', pathMatch: 'full' },
          { path: 'arl', redirectTo: 'catalogos/arl', pathMatch: 'full' },
          { path: 'cajas-compensacion', redirectTo: 'catalogos/cajas', pathMatch: 'full' },
        ],
      },
      {
        path: 'vehiculos',
        pathMatch: 'full',
        canActivate: [permisoGuard],
        data: { title: 'Vehículos', permiso: 'vehiculos' },
        loadComponent: () =>
          import('./features/vehiculos/vehiculos-lista.component').then((m) => m.VehiculosListaComponent),
      },
      {
        path: 'vehiculos/nuevo',
        canActivate: [permisoGuard],
        data: { title: 'Nuevo vehículo', permiso: 'vehiculos' },
        loadComponent: () =>
          import('./features/vehiculos/vehiculo-detalle.component').then((m) => m.VehiculoDetalleComponent),
      },
      {
        path: 'vehiculos/:id',
        canActivate: [permisoGuard],
        data: { title: 'Vehículo', permiso: 'vehiculos' },
        loadComponent: () =>
          import('./features/vehiculos/vehiculo-detalle.component').then((m) => m.VehiculoDetalleComponent),
      },
      {
        path: 'configuracion',
        pathMatch: 'full',
        redirectTo: 'configuracion/usuarios',
      },
      {
        path: 'configuracion/usuarios',
        canActivate: [permisoGuard],
        data: { permiso: 'config.usuarios' },
        loadComponent: () =>
          import('./features/config/usuarios-admin.component').then((m) => m.UsuariosAdminComponent),
      },
      {
        path: 'configuracion/roles',
        canActivate: [permisoGuard],
        data: { permiso: 'config.roles' },
        loadComponent: () =>
          import('./features/config/roles-permisos-admin.component').then(
            (m) => m.RolesPermisosAdminComponent,
          ),
      },
      {
        path: 'configuracion/recibos',
        canActivate: [permisoGuard],
        data: { permiso: 'config.recibos' },
        loadComponent: () =>
          import('./features/config/config-recibos.component').then((m) => m.ConfigRecibosComponent),
      },
      {
        path: 'configuracion/nomina',
        canActivate: [permisoGuard],
        data: { permiso: 'config.nomina' },
        loadComponent: () =>
          import('./features/config/config-nomina.component').then((m) => m.ConfigNominaComponent),
      },
      {
        path: 'configuracion/certificados',
        canActivate: [permisoGuard],
        data: { permiso: 'config.certificados' },
        loadComponent: () =>
          import('./features/config/config-certificados.component').then(
            (m) => m.ConfigCertificadosComponent,
          ),
      },
      {
        path: 'configuracion/catalogos',
        canActivate: [permisoGuard],
        data: { permiso: 'config.catalogos' },
        loadComponent: () =>
          import('./features/config/catalogos-admin.component').then(
            (m) => m.CatalogosAdminComponent,
          ),
      },
      {
        path: 'configuracion/requisitos-documentos',
        redirectTo: 'configuracion/requisitos-documentos-alumnos',
        pathMatch: 'full',
      },
      {
        path: 'configuracion/requisitos-documentos-alumnos',
        canActivate: [permisoGuard],
        data: { permiso: 'config.requisitos' },
        loadComponent: () =>
          import('./features/config/config-requisitos-documentos.component').then(
            (m) => m.ConfigRequisitosDocumentosComponent,
          ),
      },
      {
        path: 'configuracion/requisitos-documentos-vehiculos',
        canActivate: [permisoGuard],
        data: { permiso: 'config.requisitos' },
        loadComponent: () =>
          import('./features/config/config-requisitos-documentos-vehiculos.component').then(
            (m) => m.ConfigRequisitosDocumentosVehiculosComponent,
          ),
      },
      {
        path: 'configuracion/requisitos-documentos-empleados',
        canActivate: [permisoGuard],
        data: { permiso: 'config.requisitos' },
        loadComponent: () =>
          import('./features/config/config-requisitos-documentos-empleados.component').then(
            (m) => m.ConfigRequisitosDocumentosEmpleadosComponent,
          ),
      },
      {
        path: 'configuracion/formato-inspeccion-vehiculos',
        canActivate: [permisoGuard],
        data: { permiso: 'config.requisitos' },
        loadComponent: () =>
          import('./features/config/config-formato-inspeccion-vehiculos.component').then(
            (m) => m.ConfigFormatoInspeccionVehiculosComponent,
          ),
      },
      {
        path: 'configuracion/auditoria',
        canActivate: [permisoGuard],
        data: { permiso: 'config.auditoria' },
        loadComponent: () =>
          import('./features/config/auditoria-admin.component').then(
            (m) => m.AuditoriaAdminComponent,
          ),
      },
      {
        path: 'configuracion/monitor',
        canActivate: [permisoGuard],
        data: { permiso: 'config.auditoria' },
        loadComponent: () =>
          import('./features/config/monitor-recursos-admin.component').then(
            (m) => m.MonitorRecursosAdminComponent,
          ),
      },
      { path: 'config/recibos', redirectTo: 'configuracion/recibos', pathMatch: 'full' },
      { path: 'config/certificados', redirectTo: 'configuracion/certificados', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
