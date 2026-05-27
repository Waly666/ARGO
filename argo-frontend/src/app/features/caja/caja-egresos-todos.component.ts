import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Egreso, EgresoService } from '../../core/services/egreso.service';
import { CajaSesionService } from '../../core/services/caja-sesion.service';
import {
  capBeneficiario,
  capPlaca,
  capConceptoCaja,
  capDoc,
  capFecha,
  capFormaPago,
  capRecibo,
  capTipoEgreso,
  capValorEgreso,
} from '../../core/utils/capsule.util';
import {
  tieneSoporteEgreso,
  tituloSoporteEgreso,
} from '../../core/utils/egreso-soporte.helpers';
import { readVistaLista, saveVistaLista, VistaLista } from '../../core/utils/vista-lista.helpers';
import { CajaDescuadresBannerComponent } from './caja-descuadres-banner.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'argo-caja-egresos-todos',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, CajaDescuadresBannerComponent],
  templateUrl: './caja-egresos-todos.component.html',
  styleUrls: ['./caja-listados-admin.scss'],
})
export class CajaEgresosTodosComponent implements OnInit {
  private egresoSvc = inject(EgresoService);
  private cajaSvc = inject(CajaSesionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirm = inject(ConfirmDialogService);

  private readonly vistaKey = 'argo-caja-egresos-todos-vista';

  vista = signal<VistaLista>(readVistaLista(this.vistaKey));
  items = signal<Egreso[]>([]);
  total = signal(0);
  totalValor = signal(0);
  loading = signal(false);
  msg = signal<string | null>(null);

  q = signal('');
  numDoc = signal('');
  desde = signal('');
  hasta = signal('');
  idSesion = signal('');

  sesionAbiertaId = signal<number | null>(null);
  mostrarAuthAnular = signal(false);
  authAdminUser = signal('');
  authAdminPass = signal('');
  egresoPendienteAnular = signal<Egreso | null>(null);

  capFecha = capFecha;
  capRecibo = capRecibo;
  capDoc = capDoc;
  capBeneficiario = capBeneficiario;
  capPlaca = capPlaca;
  capConceptoCaja = capConceptoCaja;
  capTipoEgreso = capTipoEgreso;
  capFormaPago = capFormaPago;
  capValorEgreso = capValorEgreso;

  egresosSinSoporte = computed(() => this.items().filter((e) => !tieneSoporteEgreso(e)));
  cantSinSoporte = computed(() => this.egresosSinSoporte().length);
  tieneSoporte = tieneSoporteEgreso;
  tituloSoporte = tituloSoporteEgreso;

  ngOnInit(): void {
    this.cajaSvc.activa().subscribe({
      next: (r) => this.sesionAbiertaId.set(r.sesion?.idSesion ?? null),
      error: () => this.sesionAbiertaId.set(null),
    });
    this.route.queryParamMap.subscribe((p) => {
      const sid = p.get('idSesion');
      if (sid) this.idSesion.set(sid);
      this.cargar();
    });
  }

  setVista(v: VistaLista): void {
    this.vista.set(v);
    saveVistaLista(this.vistaKey, v);
  }

  cargar(): void {
    this.loading.set(true);
    this.msg.set(null);
    this.fetchPaginas(0, []);
  }

  private fetchPaginas(skip: number, acumulado: Egreso[]): void {
    const sid = this.idSesion().trim();
    this.egresoSvc
      .listarTodosAdmin({
        q: this.q().trim() || undefined,
        numeroDocumento: this.numDoc().trim() || undefined,
        desde: this.desde() || undefined,
        hasta: this.hasta() || undefined,
        idSesion: sid ? Number(sid) : undefined,
        skip,
        limit: 500,
      })
      .subscribe({
        next: (r) => {
          const pagina = r.items || [];
          const merged = [...acumulado, ...pagina];
          const total = r.total || merged.length;
          if (merged.length < total && pagina.length > 0) {
            this.fetchPaginas(merged.length, merged);
            return;
          }
          this.items.set(merged);
          this.total.set(total);
          this.totalValor.set(r.totalValor || merged.reduce((a, e) => a + Number(e.valorEgreso || 0), 0));
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.msg.set(e?.error?.message || 'Error cargando egresos.');
        },
      });
  }

  limpiarFiltros(): void {
    this.q.set('');
    this.numDoc.set('');
    this.desde.set('');
    this.hasta.set('');
    this.idSesion.set('');
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.cargar();
  }

  irAlCierre(idSesion: number | null | undefined): void {
    if (!idSesion) return;
    this.router.navigate(['/app/cierres', idSesion]);
  }

  filtrarPorSesion(idSesion: number | null | undefined): void {
    if (!idSesion) return;
    this.idSesion.set(String(idSesion));
    this.router.navigate([], { relativeTo: this.route, queryParams: { idSesion } });
    this.cargar();
  }

  verRecibo(e: Egreso): void {
    const id = e.idEgreso;
    if (!id) return;
    const url = this.router.serializeUrl(this.router.createUrlTree(['/recibo-egreso', id]));
    window.open(url, '_blank', 'width=420,height=720');
  }

  puedeEditarEgreso(e: Egreso): boolean {
    if (e.anticipoNomina || e.idNovedadGenerada) return false;
    return !!e.idEgreso;
  }

  editarEgreso(e: Egreso): void {
    const id = e.idEgreso;
    if (!id) return;
    if (!this.puedeEditarEgreso(e)) {
      this.msg.set('Los egresos de préstamo/adelanto no se editan; anule y vuelva a crear si fue un error.');
      return;
    }
    void this.router.navigate(['/app/caja/egresos/editar', id], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  onAlarmaSoporte(e: Egreso, ev?: Event): void {
    ev?.stopPropagation();
    if (this.puedeEditarEgreso(e)) {
      this.editarEgreso(e);
      this.msg.set('Adjunte el soporte (imagen) en el formulario y guarde.');
      return;
    }
    this.msg.set(
      `Egreso ${e.numRecibo || e.concepto || ''} sin soporte. Este movimiento no admite edición desde aquí.`,
    );
  }

  requiereAuthSupervisor(e: Egreso): boolean {
    const abierta = this.sesionAbiertaId();
    if (abierta == null) return true;
    if (e.idSesion == null) return true;
    return Number(e.idSesion) !== Number(abierta);
  }

  async anularEgreso(e: Egreso): Promise<void> {
    const id = e.idEgreso;
    if (!id) return;
    const ok = await this.confirm.open({
      title: 'Anular egreso',
      message: `¿Anular el egreso ${e.numRecibo || id}? Si pertenece a un cierre con descuadre, recalcule el cuadre desde el detalle del cierre.`,
      confirmLabel: 'Anular',
      variant: 'danger',
    });
    if (!ok) return;

    if (this.requiereAuthSupervisor(e)) {
      this.egresoPendienteAnular.set(e);
      this.authAdminUser.set('');
      this.authAdminPass.set('');
      this.mostrarAuthAnular.set(true);
      return;
    }
    this.ejecutarAnularEgreso(e);
  }

  confirmarAnularSupervisor(): void {
    const e = this.egresoPendienteAnular();
    if (!e) return;
    const u = this.authAdminUser().trim();
    const p = this.authAdminPass();
    if (!u || !p) {
      this.msg.set('Ingrese usuario y contraseña de un administrador');
      return;
    }
    this.ejecutarAnularEgreso(e, { autorizadoUsername: u, autorizadoPassword: p });
  }

  cancelarAnularSupervisor(): void {
    this.mostrarAuthAnular.set(false);
    this.egresoPendienteAnular.set(null);
    this.authAdminUser.set('');
    this.authAdminPass.set('');
  }

  private ejecutarAnularEgreso(
    e: Egreso,
    auth?: { autorizadoUsername: string; autorizadoPassword: string },
  ): void {
    const id = e.idEgreso;
    if (!id) return;
    this.egresoSvc.eliminar(id, auth).subscribe({
      next: () => {
        this.cancelarAnularSupervisor();
        this.msg.set('Egreso anulado');
        this.cargar();
      },
      error: (err) => {
        if (err?.error?.code === 'SUPERVISOR_AUTH_REQUIRED') {
          this.mostrarAuthAnular.set(true);
        }
        this.msg.set(err?.error?.message || 'No se pudo anular');
      },
    });
  }
}
