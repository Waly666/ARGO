import { Injectable, inject, signal } from '@angular/core';
import { interval, startWith, switchMap, catchError, of } from 'rxjs';

import { AccionPermisoService } from './accion-permiso.service';
import { AutorizacionOperacionService } from './autorizacion-operacion.service';

@Injectable({ providedIn: 'root' })
export class AutorizacionPendientesAlertService {
  private accionPermiso = inject(AccionPermisoService);
  private autorizacion = inject(AutorizacionOperacionService);

  readonly pendientes = signal(0);

  iniciarPolling(intervalMs = 60000): void {
    interval(intervalMs)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (!this.accionPermiso.puedeAutorizar()) {
            this.pendientes.set(0);
            return of({ pendientes: 0 });
          }
          return this.autorizacion.contarPendientes().pipe(catchError(() => of({ pendientes: 0 })));
        }),
      )
      .subscribe((r) => this.pendientes.set(r.pendientes || 0));
  }

  refrescar(): void {
    if (!this.accionPermiso.puedeAutorizar()) {
      this.pendientes.set(0);
      return;
    }
    this.autorizacion.contarPendientes().subscribe({
      next: (r) => this.pendientes.set(r.pendientes || 0),
      error: () => this.pendientes.set(0),
    });
  }
}
