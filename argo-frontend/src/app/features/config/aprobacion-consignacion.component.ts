import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PasarelaService, SolicitudConsignacionAdmin } from '../../core/services/pasarela.service';
import { CajaEstadoService } from '../../core/services/caja-estado.service';
import { ConsignacionAlertService } from '../../core/services/consignacion-alert.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { environment } from '../../../environments/environment';

type FiltroEstado = 'pendiente' | 'aprobada' | 'rechazada' | 'todos';

@Component({
  selector: 'argo-aprobacion-consignacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './aprobacion-consignacion.component.html',
  styleUrls: ['./aprobacion-consignacion.component.scss', './config-pasarela.component.scss'],
})
export class AprobacionConsignacionComponent implements OnInit {
  private pasSvc = inject(PasarelaService);
  private confirm = inject(ConfirmDialogService);
  private route = inject(ActivatedRoute);
  private consignacionAlert = inject(ConsignacionAlertService);
  cajaEstado = inject(CajaEstadoService);

  filas = signal<SolicitudConsignacionAdmin[]>([]);
  estado = signal<FiltroEstado>('pendiente');
  q = signal('');
  loading = signal(true);
  procesando = signal<string | null>(null);
  msg = signal<string | null>(null);
  msgError = signal(false);
  seleccionada = signal<string | null>(null);
  modoRechazo = signal(false);
  motivoRechazo = signal('');
  comprobanteAmpliado = signal(false);

  puedeAprobar = computed(() => this.cajaEstado.abierta() === true);
  sesionCajaLabel = computed(() => {
    const s = this.cajaEstado.sesion();
    if (!s?.idSesion) return '';
    return `Sesión #${s.idSesion}${s.idSede ? ` · sede ${s.idSede}` : ''}`;
  });

  solicitudActiva = computed(() => {
    const id = this.seleccionada();
    if (!id) return null;
    return this.filas().find((f) => f.id === id) ?? null;
  });

  filtros: { id: FiltroEstado; label: string }[] = [
    { id: 'pendiente', label: 'Por revisar' },
    { id: 'aprobada', label: 'Aprobadas' },
    { id: 'rechazada', label: 'Rechazadas' },
    { id: 'todos', label: 'Todas' },
  ];

  ngOnInit(): void {
    void this.cajaEstado.refrescar();
    const idQuery = String(this.route.snapshot.queryParamMap.get('id') || '').trim();
    if (idQuery) {
      this.estado.set('pendiente');
      this.seleccionada.set(idQuery);
    }
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.msg.set(null);
    this.pasSvc.listarSolicitudesConsignacion(this.estado(), this.q() || undefined).subscribe({
      next: (rows) => {
        const list = rows || [];
        this.filas.set(list);
        this.loading.set(false);
        const prev = this.seleccionada();
        if (prev && list.some((f) => f.id === prev)) return;
        const idQuery = String(this.route.snapshot.queryParamMap.get('id') || '').trim();
        if (idQuery && list.some((f) => f.id === idQuery)) {
          this.seleccionada.set(idQuery);
          this.modoRechazo.set(false);
          return;
        }
        const primera = list[0];
        this.seleccionada.set(primera?.id ?? null);
        this.modoRechazo.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.msgError.set(true);
        this.msg.set('No se pudo cargar el panel de aprobación.');
      },
    });
  }

  setFiltro(f: FiltroEstado): void {
    if (this.estado() === f) return;
    this.estado.set(f);
    this.seleccionada.set(null);
    this.modoRechazo.set(false);
    this.cargar();
  }

  seleccionar(f: SolicitudConsignacionAdmin): void {
    this.seleccionada.set(f.id);
    this.modoRechazo.set(false);
    this.comprobanteAmpliado.set(false);
    this.msg.set(null);
  }

  comprobanteUrl(rel?: string | null): string {
    const r = String(rel || '').trim();
    if (!r) return '';
    if (r.startsWith('http')) return r;
    return `${environment.apiUrl.replace(/\/api\/?$/, '')}/uploads/${r.replace(/^\/+/, '')}`;
  }

  fmtMoney(n?: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(n || 0);
  }

  fmtFecha(s?: string | null): string {
    if (!s) return '—';
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }

  labelEstado(e?: string): string {
    const m: Record<string, string> = {
      pendiente: 'Por revisar',
      aprobada: 'Aprobada',
      rechazada: 'Rechazada',
    };
    return m[String(e || '')] || e || '—';
  }

  iniciales(nombre?: string, numDoc?: number | string): string {
    const n = String(nombre || numDoc || '?').trim();
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (n[0] || '?').toUpperCase();
  }

  iniciarRechazo(): void {
    this.modoRechazo.set(true);
    this.motivoRechazo.set('');
  }

  cancelarRechazo(): void {
    this.modoRechazo.set(false);
    this.motivoRechazo.set('');
  }

  async aprobar(id: string): Promise<void> {
    const sol = this.filas().find((f) => f.id === id);
    if (!this.puedeAprobar()) {
      this.msgError.set(true);
      this.msg.set('Debe abrir su caja antes de aprobar pagos del portal.');
      return;
    }
    const ok = await this.confirm.open({
      title: 'Confirmar aprobación',
      message: sol
        ? `¿El comprobante de ${sol.nombreAlumno || sol.numDoc} por ${this.fmtMoney(sol.montoCop)} es correcto? Se generará el CI en su caja abierta y se avisará al alumno por correo.`
        : '¿Confirma que el comprobante es válido? Se generará el comprobante de ingreso en su caja abierta.',
      confirmLabel: 'Sí, aprobar pago',
      variant: 'success',
    });
    if (!ok) return;
    this.procesando.set(id);
    this.msg.set(null);
    this.pasSvc.aprobarSolicitudConsignacion(id).subscribe({
      next: (r) => {
        this.procesando.set(null);
        this.msgError.set(false);
        this.msg.set(r.message || `Aprobado. Recibo ${r.numRecibo || ''}`.trim());
        void this.cajaEstado.refrescar();
        this.consignacionAlert.cargar();
        this.cargar();
      },
      error: (e) => {
        this.procesando.set(null);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo aprobar.');
      },
    });
  }

  confirmarRechazo(): void {
    const id = this.seleccionada();
    if (!id) return;
    const motivo = this.motivoRechazo().trim();
    if (!motivo) {
      this.msgError.set(true);
      this.msg.set('Escriba el motivo del rechazo. El alumno lo recibirá por correo.');
      return;
    }
    this.procesando.set(id);
    this.pasSvc.rechazarSolicitudConsignacion(id, motivo).subscribe({
      next: (r) => {
        this.procesando.set(null);
        this.cancelarRechazo();
        this.msgError.set(false);
        this.msg.set(r.message || 'Solicitud rechazada. Se notificó al alumno.');
        this.consignacionAlert.cargar();
        this.cargar();
      },
      error: (e) => {
        this.procesando.set(null);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo rechazar.');
      },
    });
  }
}
