import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AccionPermisoService } from '../../core/services/accion-permiso.service';
import { EliminacionOperacionService } from '../../core/services/eliminacion-operacion.service';
import { CajaEgresoItem, CajaSesionService } from '../../core/services/caja-sesion.service';
import { EgresoService } from '../../core/services/egreso.service';
import {
  capBeneficiario,
  capConceptoCaja,
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
import { CajaAperturaAlertService } from '../../core/services/caja-apertura-alert.service';
import { ReciboService } from '../../core/services/recibo.service';

@Component({
  selector: 'argo-caja-egresos-sesion',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './caja-egresos-sesion.component.html',
  styleUrls: ['./caja-movimientos.scss'],
})
export class CajaEgresosSesionComponent implements OnInit {
  private cajaSvc = inject(CajaSesionService);
  private egresoSvc = inject(EgresoService);
  private cajaAlert = inject(CajaAperturaAlertService);
  private router = inject(Router);
  private reciboSvc = inject(ReciboService);
  accionPermiso = inject(AccionPermisoService);
  private eliminacionOps = inject(EliminacionOperacionService);

  items = signal<CajaEgresoItem[]>([]);
  sesionId = signal<number | null>(null);
  cajaAbierta = signal(false);
  loading = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);

  puedeAnularEgreso = computed(() => this.accionPermiso.mostrarAccionEliminar('egresos'));
  etiquetaAnular = computed(() =>
    this.accionPermiso.puedeEliminar('egresos') ? 'Anular' : 'Solicitar anulación',
  );

  capFecha = capFecha;
  capRecibo = capRecibo;
  capBeneficiario = capBeneficiario;
  capConceptoCaja = capConceptoCaja;
  capTipoEgreso = capTipoEgreso;
  capFormaPago = capFormaPago;
  capValorEgreso = capValorEgreso;

  total = () => this.items().reduce((a, e) => a + (e.valorEgreso || 0), 0);

  sinSoporte = () => this.items().filter((e) => !tieneSoporteEgreso(e));

  cantSinSoporte = () => this.sinSoporte().length;

  tieneSoporte = tieneSoporteEgreso;

  tituloSoporte = tituloSoporteEgreso;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.cajaSvc.activa().subscribe({
      next: (r) => {
        this.cajaAbierta.set(!!r.abierta);
        this.sesionId.set(r.sesion?.idSesion ?? null);
        if (!r.abierta) {
          this.items.set([]);
          this.loading.set(false);
          return;
        }
        this.cajaSvc.egresosSesionActiva().subscribe({
          next: (rows) => {
            this.items.set(rows || []);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  puedeGestionar(e: CajaEgresoItem): boolean {
    if (!this.cajaAbierta() || this.sesionId() == null) return false;
    if (e.idSesion == null) return true;
    return Number(e.idSesion) === Number(this.sesionId());
  }

  async nuevoEgreso(): Promise<void> {
    if (!(await this.cajaAlert.ensureAbierta('registrar egresos'))) return;
    this.router.navigate(['/app/caja/egresos/nuevo']);
  }

  editarEgreso(e: CajaEgresoItem): void {
    if (!this.puedeGestionar(e)) {
      this.inform('Solo puede editar egresos de su sesión de caja actual.');
      return;
    }
    this.router.navigate(['/app/caja/egresos/editar', e.idEgreso]);
  }

  verRecibo(id: string): void {
    this.reciboSvc.abrirHtmlEgreso(id, (m) => this.inform(m));
  }

  onAlarmaSoporte(e: CajaEgresoItem, ev?: Event): void {
    ev?.stopPropagation();
    if (this.puedeGestionar(e)) {
      this.editarEgreso(e);
      this.inform('Adjunte el soporte (imagen) en el formulario y guarde.');
      return;
    }
    this.inform('Solicite a un administrador que adjunte el comprobante.');
  }

  async anularEgreso(e: CajaEgresoItem): Promise<void> {
    if (!this.puedeAnularEgreso()) return;
    if (!this.puedeGestionar(e)) {
      this.inform('Solo puede anular egresos de su sesión de caja actual.');
      return;
    }
    if (!(await this.cajaAlert.ensureAbierta('anular egresos'))) return;
    const ref = e.numRecibo ? ` «${e.numRecibo}»` : '';
    const resumen = `Egreso${ref || ` ${e.idEgreso}`}`;
    try {
      const resultado = await this.eliminacionOps.ejecutarEliminacionOSolicitar({
        modulo: 'egresos',
        idEntidad: e.idEgreso,
        resumen,
        tituloConfirm: '¿Anular este egreso?',
        mensajeConfirm: `Se anulará el comprobante${ref} y quedará en cero. Esta acción no se puede deshacer.`,
        confirmLabel: this.accionPermiso.puedeEliminar('egresos') ? 'Sí, anular' : 'Enviar solicitud',
        ejecutar: () => this.egresoSvc.eliminar(e.idEgreso),
      });
      if (resultado === 'eliminado') {
        this.inform('Egreso anulado.');
        this.cargar();
      } else if (resultado === 'solicitado') {
        this.inform('Solicitud de anulación enviada a Configuración.');
      }
    } catch (err: unknown) {
      const error = err as { error?: { message?: string } };
      this.inform(error?.error?.message || 'No se pudo anular', true);
    }
  }

  private inform(text: string | null, isErr?: boolean): void {
    this.msg.set(text);
    let err = !!isErr;
    if (!err && text) {
      const t = text.toLowerCase();
      err =
        t.includes('error') ||
        t.includes('no se') ||
        t.includes('inválid') ||
        t.includes('obligator') ||
        t.includes('indique') ||
        t.includes('seleccione') ||
        t.includes('ingrese') ||
        t.includes('solo puede') ||
        t.includes('adjunte') ||
        t.includes('verifique');
    }
    this.msgError.set(err);
  }
}
