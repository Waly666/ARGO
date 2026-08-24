import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { etiquetaModulo } from '../utils/crud-permiso.util';
import { AccionPermisoService } from './accion-permiso.service';
import {
  AutorizacionOperacionService,
  SolicitudAutorizacion,
} from './autorizacion-operacion.service';
import { AutorizacionPendientesAlertService } from './autorizacion-pendientes-alert.service';
import { ChatSocketService } from './chat-socket.service';

export interface AutorizacionAlertaPendiente {
  idSolicitud: number;
  modulo: string;
  resumen: string;
  usuarioSolicita?: string | null;
  nombreSolicita?: string | null;
  motivo?: string | null;
  fechaSolicitud?: string;
}

export interface AutorizacionAlertaResuelta {
  idSolicitud: number;
  modulo: string;
  resumen: string;
  estado: string;
  nombreResuelve?: string | null;
  motivoRechazo?: string | null;
  errorEjecucion?: string | null;
  fechaResolucion?: string;
}

@Injectable({ providedIn: 'root' })
export class AutorizacionAlertService {
  private autorizacion = inject(AutorizacionOperacionService);
  private accionPermiso = inject(AccionPermisoService);
  private pendientesBadge = inject(AutorizacionPendientesAlertService);
  private chatSocket = inject(ChatSocketService);
  private router = inject(Router);

  private pendientesDescartados = new Set<number>();
  private resueltasVistas = new Set<number>();
  private escuchando = false;

  private readonly _pendientesAdmin = signal<AutorizacionAlertaPendiente[]>([]);
  private readonly _resueltasMias = signal<AutorizacionAlertaResuelta[]>([]);

  readonly pendientesAdmin = this._pendientesAdmin.asReadonly();
  readonly resueltasMias = this._resueltasMias.asReadonly();

  private readonly onNueva = (raw: SolicitudAutorizacion) => this.recibirNueva(raw);
  private readonly onResuelta = (raw: SolicitudAutorizacion) => this.recibirResuelta(raw);

  conectar(): void {
    const socket = this.chatSocket.connect();
    if (!socket || this.escuchando) return;

    socket.off('autorizacion:nueva', this.onNueva);
    socket.off('autorizacion:resuelta', this.onResuelta);
    socket.on('autorizacion:nueva', this.onNueva);
    socket.on('autorizacion:resuelta', this.onResuelta);
    this.escuchando = true;
  }

  desconectar(): void {
    this.escuchando = false;
    this._pendientesAdmin.set([]);
    this._resueltasMias.set([]);
    this.pendientesDescartados.clear();
    this.resueltasVistas.clear();
  }

  cargarPendientesAdmin(): void {
    if (!this.accionPermiso.puedeAutorizar()) {
      this._pendientesAdmin.set([]);
      return;
    }
    this.autorizacion
      .listarAlertasAdmin()
      .pipe(catchError(() => of([])))
      .subscribe((rows) => {
        const list = (rows || [])
          .filter((r) => r.estado === 'pendiente' && !this.pendientesDescartados.has(r.idSolicitud))
          .map((r) => this.mapPendiente(r));
        this._pendientesAdmin.set(list);
        this.pendientesBadge.refrescar();
      });
  }

  cargarMisResueltas(): void {
    this.autorizacion
      .listarMisAlertas()
      .pipe(catchError(() => of([])))
      .subscribe((rows) => {
        const list = (rows || [])
          .filter((r) => !this.resueltasVistas.has(r.idSolicitud))
          .map((r) => this.mapResuelta(r));
        this._resueltasMias.set(list);
      });
  }

  descartarPendiente(idSolicitud: number): void {
    this.pendientesDescartados.add(idSolicitud);
    this._pendientesAdmin.update((list) => list.filter((a) => a.idSolicitud !== idSolicitud));
  }

  descartarTodasPendientes(): void {
    for (const a of this._pendientesAdmin()) this.pendientesDescartados.add(a.idSolicitud);
    this._pendientesAdmin.set([]);
  }

  descartarResuelta(idSolicitud: number): void {
    this.resueltasVistas.add(idSolicitud);
    this._resueltasMias.update((list) => list.filter((a) => a.idSolicitud !== idSolicitud));
    this.autorizacion.marcarVista(idSolicitud).pipe(catchError(() => of(null))).subscribe();
  }

  descartarTodasResueltas(): void {
    const actuales = this._resueltasMias();
    for (const a of actuales) {
      this.resueltasVistas.add(a.idSolicitud);
      this.autorizacion.marcarVista(a.idSolicitud).pipe(catchError(() => of(null))).subscribe();
    }
    this._resueltasMias.set([]);
  }

  irBandejaAdmin(): void {
    this.descartarTodasPendientes();
    void this.router.navigate(['/app/configuracion/autorizaciones']);
  }

  textoEstadoResuelta(estado: string): string {
    switch (estado) {
      case 'ejecutada':
        return 'Eliminación autorizada y ejecutada';
      case 'rechazada':
        return 'Solicitud rechazada';
      case 'fallida':
        return 'Autorizada pero no se pudo ejecutar';
      default:
        return estado;
    }
  }

  etiquetaModulo(modulo: string): string {
    return etiquetaModulo(modulo);
  }

  private recibirNueva(raw: SolicitudAutorizacion): void {
    if (!this.accionPermiso.puedeAutorizar()) return;
    if (!raw || raw.estado !== 'pendiente') return;
    if (this.pendientesDescartados.has(raw.idSolicitud)) return;

    const alerta = this.mapPendiente(raw);
    this._pendientesAdmin.update((list) => {
      if (list.some((a) => a.idSolicitud === alerta.idSolicitud)) return list;
      return [alerta, ...list].slice(0, 10);
    });
    this.pendientesBadge.refrescar();
  }

  private recibirResuelta(raw: SolicitudAutorizacion): void {
    if (!raw?.idSolicitud) return;
    if (this.resueltasVistas.has(raw.idSolicitud)) return;

    this._pendientesAdmin.update((list) => list.filter((a) => a.idSolicitud !== raw.idSolicitud));
    this.pendientesBadge.refrescar();

    const alerta = this.mapResuelta(raw);
    this._resueltasMias.update((list) => {
      if (list.some((a) => a.idSolicitud === alerta.idSolicitud)) return list;
      return [alerta, ...list].slice(0, 10);
    });
  }

  private mapPendiente(r: SolicitudAutorizacion): AutorizacionAlertaPendiente {
    return {
      idSolicitud: r.idSolicitud,
      modulo: String(r.modulo || ''),
      resumen: String(r.resumen || ''),
      usuarioSolicita: r.usuarioSolicita,
      nombreSolicita: r.nombreSolicita,
      motivo: r.motivo,
      fechaSolicitud: r.fechaSolicitud,
    };
  }

  private mapResuelta(r: SolicitudAutorizacion): AutorizacionAlertaResuelta {
    return {
      idSolicitud: r.idSolicitud,
      modulo: String(r.modulo || ''),
      resumen: String(r.resumen || ''),
      estado: String(r.estado || ''),
      nombreResuelve: r.nombreResuelve || r.usuarioResuelve,
      motivoRechazo: r.motivoRechazo,
      errorEjecucion: r.errorEjecucion,
      fechaResolucion: r.fechaResolucion,
    };
  }
}
