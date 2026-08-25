import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { PasarelaService, SolicitudConsignacionAdmin } from './pasarela.service';
import { PermisoService } from './permiso.service';

export interface ConsignacionAlertaPendiente {
  id: string;
  numDoc: number | string;
  nombreAlumno: string;
  nombreCurso: string;
  referenciaBancaria: string;
  medioEtiqueta: string;
  montoCop: number;
  fechaCreacion?: string;
}

@Injectable({ providedIn: 'root' })
export class ConsignacionAlertService {
  private pasSvc = inject(PasarelaService);
  private permisos = inject(PermisoService);
  private router = inject(Router);

  private descartados = new Set<string>();

  private readonly _pendientes = signal<ConsignacionAlertaPendiente[]>([]);
  readonly pendientes = this._pendientes.asReadonly();

  puedeAprobar(): boolean {
    return this.permisos.tiene('caja.admin');
  }

  cargar(): void {
    if (!this.puedeAprobar()) {
      this._pendientes.set([]);
      return;
    }
    this.pasSvc
      .listarSolicitudesConsignacion('pendiente')
      .pipe(catchError(() => of([])))
      .subscribe((rows) => {
        const list = (rows || [])
          .filter((r) => r.id && r.estado === 'pendiente' && !this.descartados.has(r.id))
          .map((r) => this.mapPendiente(r))
          .slice(0, 12);
        this._pendientes.set(list);
      });
  }

  descartar(id: string): void {
    const key = String(id || '').trim();
    if (key) this.descartados.add(key);
    this._pendientes.update((list) => list.filter((a) => a.id !== key));
  }

  descartarTodas(): void {
    for (const a of this._pendientes()) this.descartados.add(a.id);
    this._pendientes.set([]);
  }

  irPanel(id?: string): void {
    const queryParams = id ? { id } : undefined;
    void this.router.navigate(['/app/configuracion/aprobacion-consignacion'], { queryParams });
  }

  limpiar(): void {
    this.descartados.clear();
    this._pendientes.set([]);
  }

  private mapPendiente(r: SolicitudConsignacionAdmin): ConsignacionAlertaPendiente {
    return {
      id: String(r.id),
      numDoc: r.numDoc,
      nombreAlumno: String(r.nombreAlumno || '').trim() || `CC ${r.numDoc}`,
      nombreCurso: String(r.nombreCurso || '').trim() || 'Curso virtual',
      referenciaBancaria: String(r.referenciaBancaria || '').trim(),
      medioEtiqueta: String(r.medioEtiqueta || r.bancoNombre || '').trim(),
      montoCop: Number(r.montoCop) || 0,
      fechaCreacion: r.fechaCreacion,
    };
  }
}
