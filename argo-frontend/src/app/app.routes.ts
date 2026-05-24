import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { programasGuard } from './core/guards/programas.guard';
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
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'alumnos',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/alumnos/alumnos-lista.component').then((m) => m.AlumnosListaComponent),
      },
      {
        path: 'alumnos/nuevo',
        loadComponent: () =>
          import('./features/alumnos/alumno-detalle.component').then((m) => m.AlumnoDetalleComponent),
      },
      {
        path: 'alumnos/:id',
        loadComponent: () =>
          import('./features/alumnos/alumno-detalle.component').then((m) => m.AlumnoDetalleComponent),
      },
      {
        path: 'programas',
        canActivate: [programasGuard],
        loadComponent: () =>
          import('./features/programas/programas-admin.component').then((m) => m.ProgramasAdminComponent),
      },
      {
        path: 'servicios',
        canActivate: [programasGuard],
        loadComponent: () =>
          import('./features/servicios/servicios-admin.component').then((m) => m.ServiciosAdminComponent),
      },
      { path: 'clases', redirectTo: 'programas', pathMatch: 'full' },
      {
        path: 'facturacion',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
        data: { title: 'Facturación' },
      },
      {
        path: 'instructores',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
        data: { title: 'Instructores' },
      },
      {
        path: 'cobros-pendientes',
        loadComponent: () =>
          import('./features/caja/caja-cobros-pendientes.component').then((m) => m.CajaCobrosPendientesComponent),
      },
      {
        path: 'caja/ingresos-todos',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/caja/caja-ingresos-todos.component').then((m) => m.CajaIngresosTodosComponent),
      },
      {
        path: 'caja/egresos-todos',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/caja/caja-egresos-todos.component').then((m) => m.CajaEgresosTodosComponent),
      },
      {
        path: 'caja',
        loadComponent: () =>
          import('./features/caja/caja-layout.component').then((m) => m.CajaLayoutComponent),
        children: [
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
          {
            path: 'admin',
            canActivate: [adminGuard],
            loadComponent: () =>
              import('./features/caja/caja-admin.component').then((m) => m.CajaAdminComponent),
          },
        ],
      },
      { path: 'caja/cobros', redirectTo: 'cobros-pendientes', pathMatch: 'full' },
      { path: 'caja/empleados', redirectTo: 'rrhh/empleados', pathMatch: 'full' },
      {
        path: 'rrhh',
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
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
        data: { title: 'Vehículos' },
      },
      {
        path: 'configuracion',
        pathMatch: 'full',
        redirectTo: 'configuracion/usuarios',
      },
      {
        path: 'configuracion/usuarios',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/config/usuarios-admin.component').then((m) => m.UsuariosAdminComponent),
      },
      {
        path: 'configuracion/recibos',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/config/config-recibos.component').then((m) => m.ConfigRecibosComponent),
      },
      {
        path: 'configuracion/nomina',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/config/config-nomina.component').then((m) => m.ConfigNominaComponent),
      },
      {
        path: 'configuracion/certificados',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/config/config-certificados.component').then(
            (m) => m.ConfigCertificadosComponent,
          ),
      },
      {
        path: 'configuracion/catalogos',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/config/catalogos-admin.component').then(
            (m) => m.CatalogosAdminComponent,
          ),
      },
      {
        path: 'configuracion/requisitos-documentos',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/config/config-requisitos-documentos.component').then(
            (m) => m.ConfigRequisitosDocumentosComponent,
          ),
      },
      {
        path: 'configuracion/auditoria',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/config/auditoria-admin.component').then(
            (m) => m.AuditoriaAdminComponent,
          ),
      },
      { path: 'config/recibos', redirectTo: 'configuracion/recibos', pathMatch: 'full' },
      { path: 'config/certificados', redirectTo: 'configuracion/certificados', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
