import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  AutorizacionOperacionService,
  SolicitudAutorizacion,
} from '../../core/services/autorizacion-operacion.service';
import { AutorizacionPendientesAlertService } from '../../core/services/autorizacion-pendientes-alert.service';
import { AutorizacionAlertService } from '../../core/services/autorizacion-alert.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import {
  etiquetaModulo,
  modulosCrudOrdenados,
  ModuloCrud,
} from '../../core/utils/crud-permiso.util';
import { coincideBusquedaTexto } from '../../core/utils/busqueda-alumno.helpers';

@Component({
  selector: 'argo-config-autorizaciones-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  templateUrl: './config-autorizaciones-pendientes.component.html',
  styleUrls: ['./config-autorizaciones-pendientes.component.scss'],
})
export class ConfigAutorizacionesPendientesComponent implements OnInit, OnDestroy {
  private svc = inject(AutorizacionOperacionService);
  private confirm = inject(ConfirmDialogService);
  private pendientesAlert = inject(AutorizacionPendientesAlertService);
  private autorizacionAlert = inject(AutorizacionAlertService);

  readonly modulos = modulosCrudOrdenados();

  readonly estadosFiltro = [
    { value: 'pendiente', label: 'Pendientes' },
    { value: '', label: 'Todos los estados' },
    { value: 'ejecutada', label: 'Ejecutadas' },
    { value: 'rechazada', label: 'Rechazadas' },
    { value: 'fallida', label: 'Fallidas' },
  ];

  items = signal<SolicitudAutorizacion[]>([]);
  cargando = signal(false);
  procesandoId = signal<number | null>(null);
  msg = signal<string | null>(null);
  msgError = signal(false);
  filtroEstado = signal('pendiente');
  filtroModulo = signal('');
  filtroBusqueda = signal('');

  pendientes = computed(() => this.items().filter((s) => s.estado === 'pendiente').length);

  itemsFiltrados = computed(() => {
    const q = this.filtroBusqueda().trim().toLowerCase();
    if (!q) return this.items();
    return this.items().filter((s) => {
      const blob = [
        s.idSolicitud,
        s.modulo,
        this.etiquetaModulo(s.modulo),
        s.resumen,
        s.idEntidad,
        s.usuarioSolicita,
        s.nombreSolicita,
        s.motivo,
        s.motivoRechazo,
        s.errorEjecucion,
        s.estado,
        this.labelEstado(s.estado),
      ]
        .filter(Boolean)
        .join(' ');
      return coincideBusquedaTexto(blob, q);
    });
  });

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.cargar();
    this.refreshTimer = setInterval(() => this.cargar(true), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  onFiltroEstadoChange(value: string): void {
    this.filtroEstado.set(value);
    this.cargar();
  }

  onFiltroModuloChange(value: string): void {
    this.filtroModulo.set(value);
    this.cargar();
  }

  filtrarSoloPendientes(): void {
    this.filtroEstado.set('pendiente');
    this.filtroModulo.set('');
    this.filtroBusqueda.set('');
    this.cargar();
  }

  limpiarFiltros(): void {
    this.filtroEstado.set('');
    this.filtroModulo.set('');
    this.filtroBusqueda.set('');
    this.cargar();
  }

  cargar(silent = false): void {
    if (!silent) this.cargando.set(true);
    this.svc
      .listar({
        estado: this.filtroEstado() || undefined,
        modulo: this.filtroModulo() || undefined,
        limit: 150,
      })
      .subscribe({
        next: (rows) => {
          this.items.set(rows);
          this.cargando.set(false);
        },
        error: (e) => {
          this.cargando.set(false);
          this.inform(e?.error?.message || 'No se pudo cargar la bandeja.', true);
        },
      });
  }

  etiquetaModulo(modulo: string): string {
    return etiquetaModulo(modulo as ModuloCrud);
  }

  labelEstado(estado: string): string {
    switch (String(estado || '').toLowerCase()) {
      case 'pendiente':
        return 'Pendiente';
      case 'ejecutada':
        return 'Ejecutada';
      case 'rechazada':
        return 'Rechazada';
      case 'fallida':
        return 'Fallida';
      case 'caducada':
        return 'Caducada';
      default:
        return estado || '—';
    }
  }

  claseEstado(estado: string): string {
    return `estado-${String(estado || 'pendiente').toLowerCase()}`;
  }

  async autorizar(s: SolicitudAutorizacion): Promise<void> {
    const ok = await this.confirm.open({
      title: 'Autorizar eliminación',
      message: `¿Autorizar y ejecutar la eliminación solicitada por ${s.usuarioSolicita || 'el usuario'}?\n\n${s.resumen || ''}`,
      confirmLabel: 'Autorizar y eliminar',
      variant: 'danger',
      icon: 'delete',
    });
    if (!ok) return;
    this.procesandoId.set(s.idSolicitud);
    this.svc.autorizar(s.idSolicitud).subscribe({
      next: () => {
        this.procesandoId.set(null);
        this.inform('Eliminación autorizada y ejecutada.');
        this.pendientesAlert.refrescar();
        this.autorizacionAlert.cargarPendientesAdmin();
        this.cargar(true);
      },
      error: (e) => {
        this.procesandoId.set(null);
        this.inform(e?.error?.message || 'No se pudo autorizar la eliminación.', true);
        this.cargar(true);
      },
    });
  }

  async rechazar(s: SolicitudAutorizacion): Promise<void> {
    const motivo = await this.confirm.openPrompt({
      title: 'Rechazar solicitud',
      message: `Indique el motivo del rechazo (opcional) para: ${s.resumen || s.idEntidad}`,
      inputLabel: 'Motivo de rechazo',
      confirmLabel: 'Rechazar solicitud',
      variant: 'warn',
      icon: 'warning',
    });
    if (motivo === null) return;
    this.procesandoId.set(s.idSolicitud);
    this.svc.rechazar(s.idSolicitud, motivo.trim() || undefined).subscribe({
      next: () => {
        this.procesandoId.set(null);
        this.inform('Solicitud rechazada.');
        this.pendientesAlert.refrescar();
        this.autorizacionAlert.cargarPendientesAdmin();
        this.cargar(true);
      },
      error: (e) => {
        this.procesandoId.set(null);
        this.inform(e?.error?.message || 'No se pudo rechazar la solicitud.', true);
      },
    });
  }

  private inform(texto: string, error = false): void {
    this.msg.set(texto);
    this.msgError.set(error);
    setTimeout(() => {
      if (this.msg() === texto) this.msg.set(null);
    }, 6000);
  }
}
