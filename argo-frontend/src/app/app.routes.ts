import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

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
        path: 'clases',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
        data: { title: 'Programación de Clases' },
      },
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
        path: 'caja',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
        data: { title: 'Flujo de Caja' },
      },
      {
        path: 'vehiculos',
        loadComponent: () =>
          import('./features/placeholder/placeholder.component').then((m) => m.PlaceholderComponent),
        data: { title: 'Vehículos' },
      },
      {
        path: 'config/recibos',
        loadComponent: () =>
          import('./features/config/config-recibos.component').then((m) => m.ConfigRecibosComponent),
      },
      {
        path: 'config/certificados',
        loadComponent: () =>
          import('./features/config/config-certificados.component').then((m) => m.ConfigCertificadosComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
