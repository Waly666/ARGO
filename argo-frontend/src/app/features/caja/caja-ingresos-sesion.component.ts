import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';

import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';



import { AlumnoListItem, AlumnoService } from '../../core/services/alumno.service';

import { AccionPermisoService } from '../../core/services/accion-permiso.service';
import { EliminacionOperacionService } from '../../core/services/eliminacion-operacion.service';

import {

  CajaIngresoItem,

  CajaSesionService,

} from '../../core/services/caja-sesion.service';
import { resolverFormaPagoIngreso } from '../../core/utils/caja-forma-pago.util';

import { IngresoService } from '../../core/services/ingreso.service';

import {
  capConceptoCaja,
  capCuentaBancaria,
  capDoc,
  capFecha,
  capFormaPago,
  capRecibo,
  capTipoAbono,
  capTipoIngreso,
  capValorIngreso,
  capBeneficiario,
  capRefComprobante,
} from '../../core/utils/capsule.util';

import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { CajaAperturaAlertService } from '../../core/services/caja-apertura-alert.service';



@Component({

  selector: 'argo-caja-ingresos-sesion',

  standalone: true,

  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, RouterLink],

  templateUrl: './caja-ingresos-sesion.component.html',

  styleUrls: ['./caja-movimientos.scss'],

})

export class CajaIngresosSesionComponent implements OnInit {

  private cajaSvc = inject(CajaSesionService);

  private alumnoSvc = inject(AlumnoService);

  private ingSvc = inject(IngresoService);

  private confirmSvc = inject(ConfirmDialogService);
  private cajaAlert = inject(CajaAperturaAlertService);
  accionPermiso = inject(AccionPermisoService);
  private eliminacionOps = inject(EliminacionOperacionService);

  private router = inject(Router);



  items = signal<CajaIngresoItem[]>([]);

  sesionId = signal<number | null>(null);

  cajaAbierta = signal(false);

  loading = signal(false);

  busqueda = signal('');

  resultados = signal<AlumnoListItem[]>([]);

  msg = signal<string | null>(null);
  msgError = signal(false);

  puedeReversarPago = computed(() => this.accionPermiso.mostrarAccionEliminar('ingresos'));
  etiquetaReversar = computed(() =>
    this.accionPermiso.puedeEliminar('ingresos') ? 'Reversar' : 'Solicitar reversión',
  );



  capFecha = capFecha;
  capRecibo = capRecibo;
  capDoc = capDoc;
  capConceptoCaja = capConceptoCaja;
  capFormaPago = capFormaPago;
  capTipoAbono = capTipoAbono;
  capCuentaBancaria = capCuentaBancaria;
  capValorIngreso = capValorIngreso;
  capTipoIngreso = capTipoIngreso;
  capBeneficiario = capBeneficiario;
  capRefComprobante = capRefComprobante;

  total = () => this.items().reduce((a, i) => a + (i.valor || 0), 0);

  formaPagoLabel(i: CajaIngresoItem): string {
    return resolverFormaPagoIngreso(i);
  }

  refComprobante(i: CajaIngresoItem): string {
    return String(i.numTransferencia || i.numComprobante || '').trim();
  }

  esPagoNoEfectivo(i: CajaIngresoItem): boolean {
    const txt = this.formaPagoLabel(i).toLowerCase();
    if (!txt || txt === '—') return !!(i.cuentaBancariaDescr || i.cuentaRecibe);
    return !txt.includes('efect') && txt !== 'ef';
  }

  muestraRefEnCuenta(i: CajaIngresoItem): boolean {
    return this.esPagoNoEfectivo(i) && !!this.refComprobante(i);
  }

  pagadorLabel(i: CajaIngresoItem): string {
    if (i.esIngresoCaja) return i.pagadorDescr || i.recibidoDe || 'Tercero';
    return i.numDoc != null ? String(i.numDoc) : '—';
  }

  conceptoLabel(i: CajaIngresoItem): string {
    if (i.esIngresoCaja) {
      return i.concepto || i.liquidacionDescr || '—';
    }
    return i.liquidacionDescr || '—';
  }

  tipoIngresoLabel(i: CajaIngresoItem): string {
    return i.tipoIngresoDescr || i.tipoIngreso || '—';
  }

  async nuevoIngresoCaja(): Promise<void> {
    if (!(await this.cajaAlert.ensureAbierta('registrar ingresos de caja'))) return;
    this.router.navigate(['/app/caja/ingresos/nuevo']);
  }



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

        this.cajaSvc.ingresosSesionActiva().subscribe({

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



  buscarAlumno(): void {

    const q = this.busqueda().trim();

    if (q.length < 2) return;

    this.alumnoSvc.listar({ q, limit: 8 }).subscribe({

      next: (r) => this.resultados.set(r.items || []),

    });

  }



  async cobrarAlumno(a: AlumnoListItem): Promise<void> {
    if (!(await this.cajaAlert.ensureAbierta('registrar cobros'))) return;
    this.router.navigate(['/app/cobros-pendientes'], { queryParams: { q: String(a.numDoc ?? '') } });
  }



  verRecibo(id: string): void {

    window.open(`/recibo/${id}`, '_blank');

  }



  async reversar(i: CajaIngresoItem): Promise<void> {
    if (!this.puedeReversarPago()) return;
    if (!(await this.cajaAlert.ensureAbierta('reversar cobros'))) return;
    const ref = i.numRecibo ? ` «${i.numRecibo}»` : '';
    const resumen = `Ingreso${ref || ` ${i._id}`}`;
    try {
      const resultado = await this.eliminacionOps.ejecutarEliminacionOSolicitar({
        modulo: 'ingresos',
        idEntidad: i._id,
        resumen,
        tituloConfirm: '¿Reversar este cobro?',
        mensajeConfirm: `Se anulará el comprobante${ref} y se descontará el valor de la liquidación. Esta acción no se puede deshacer.`,
        confirmLabel: this.accionPermiso.puedeEliminar('ingresos') ? 'Sí, reversar' : 'Enviar solicitud',
        ejecutar: () => this.ingSvc.eliminar(i._id),
      });
      if (resultado === 'eliminado') {
        this.inform('Cobro reversado.');
        this.cargar();
      } else if (resultado === 'solicitado') {
        this.inform('Solicitud de anulación enviada a Configuración.');
      }
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.inform(err?.error?.message || 'Error reversando cobro.', true);
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
