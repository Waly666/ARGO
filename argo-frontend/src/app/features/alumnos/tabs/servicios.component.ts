import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AlumnoStore } from '../../../core/services/alumno-store.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { IngresoService } from '../../../core/services/ingreso.service';
import { LiquidacionItem, LiquidacionResumen, LiquidacionService } from '../../../core/services/liquidacion.service';
import { MatriculaService } from '../../../core/services/matricula.service';
import { ReciboService, idIngreso } from '../../../core/services/recibo.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'argo-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.scss'],
})
export class ServiciosComponent {
  store = inject(AlumnoStore);
  private router = inject(Router);
  private catSvc = inject(CatalogoService);
  private matSvc = inject(MatriculaService);
  private liqSvc = inject(LiquidacionService);
  private ingSvc = inject(IngresoService);
  private reciboSvc = inject(ReciboService);
  private confirmSvc = inject(ConfirmDialogService);

  programas = signal<any[]>([]);
  servicios = signal<any[]>([]);

  // form matrícula
  idProg = signal<string>('');
  tarifa = signal<1 | 2 | 3>(1);

  // form servicio adicional
  idServ = signal<string>('');
  servDescripcion = signal<string>('');
  servValor = signal<number>(0);

  liquidacion = signal<LiquidacionResumen>({ items: [], totales: { valor: 0, abonado: 0, saldo: 0 } });
  comprobantes = signal<any[]>([]);
  itemRecibosAbierto = signal<string | null>(null);
  loading = signal(false);
  msg = signal<string | null>(null);

  comprobantesPorItem = (idLiq: string) =>
    this.comprobantes().filter((p) => String(p.idLiquidacion) === String(idLiq));

  descrComprobante(p: { idLiquidacion?: string; liquidacionDescr?: string }): string {
    if (p.liquidacionDescr) return p.liquidacionDescr;
    const it = this.liquidacion().items.find((i) => String(i._id) === String(p.idLiquidacion));
    return it?.descripcion || '—';
  }

  tipoAbonoLabel(p: { tipoAbono?: string; tipoAbonoDescr?: string }): string {
    if (p.tipoAbonoDescr) return p.tipoAbonoDescr;
    if (p.tipoAbono === 'total') return 'Total';
    if (p.tipoAbono === 'abono') return 'Abono';
    return '—';
  }

  tipoAbonoClass(p: { tipoAbono?: string }): string {
    if (p.tipoAbono === 'total') return 'ok';
    if (p.tipoAbono === 'abono') return 'warn';
    return '';
  }

  programaSel = computed(() =>
    this.programas().find((p) => String(p.idPrograma ?? p.idProg ?? p._id) === this.idProg()),
  );
  valorMatCalculado = computed(() => {
    const p = this.programaSel();
    if (!p) return 0;
    const t = this.tarifa();
    // intenta tarifaN del servicio asociado, si no usa valorMatricula del programa
    const idP = p.idPrograma ?? p.idProg;
    const serv = this.servicios().find((s) => String(s.idProg) === String(idP) || String(s.idServ) === String(p.idServ));
    if (serv) {
      const v = serv[`tarifa${t}`];
      if (v != null && v !== '') return this.num(v);
    }
    return this.num(p.valorMatricula);
  });

  servicioSel = computed(() => this.servicios().find((s) => (s.idServ || s._id) === this.idServ()));

  constructor() {
    this.catSvc.list('programas').subscribe((d) => this.programas.set(d || []));
    this.catSvc.list('servicios').subscribe((d) => this.servicios.set(d || []));

    effect(() => {
      const nd = this.store.numDoc();
      if (nd) this.recargar(nd);
      else {
        this.liquidacion.set({ items: [], totales: { valor: 0, abonado: 0, saldo: 0 } });
        this.comprobantes.set([]);
      }
    });
  }

  recargar(numDoc: string) {
    this.loading.set(true);
    this.liqSvc.listarPorAlumno(numDoc).subscribe({
      next: (r) => this.liquidacion.set(r),
      error: () => this.loading.set(false),
    });
    this.ingSvc.listarPorAlumno(numDoc).subscribe({
      next: (r) => {
        this.comprobantes.set(r || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setTarifa(v: number | string) {
    const n = Number(v);
    if (n === 1 || n === 2 || n === 3) this.tarifa.set(n);
  }

  crearMatricula() {
    const nd = this.store.numDoc();
    if (!nd) { this.msg.set('Selecciona o crea un alumno primero.'); return; }
    if (!this.idProg()) { this.msg.set('Selecciona un programa.'); return; }
    this.msg.set(null);
    this.matSvc.crear({ numDoc: nd, idPrograma: this.idProg(), tarifa: this.tarifa() }).subscribe({
      next: () => {
        this.idProg.set('');
        this.tarifa.set(1);
        this.recargar(nd);
        this.msg.set('Matrícula creada y liquidación generada.');
      },
      error: (e) => this.msg.set(e?.error?.message || 'Error creando matrícula.'),
    });
  }

  crearServicioAdicional() {
    const nd = this.store.numDoc();
    if (!nd) { this.msg.set('Selecciona un alumno primero.'); return; }
    if (!this.idServ()) { this.msg.set('Selecciona un servicio.'); return; }
    const v = this.servValor();
    if (!v || v <= 0) { this.msg.set('Valor del servicio inválido.'); return; }
    this.msg.set(null);
    this.liqSvc
      .crear({
        numDoc: nd,
        idServ: this.idServ(),
        descripcion: this.servDescripcion() || (this.servicioSel()?.descripcion ?? ''),
        valor: v,
      })
      .subscribe({
        next: () => {
          this.idServ.set('');
          this.servDescripcion.set('');
          this.servValor.set(0);
          this.recargar(nd);
          this.msg.set('Servicio adicional agregado.');
        },
        error: (e) => this.msg.set(e?.error?.message || 'Error agregando servicio.'),
      });
  }

  async eliminarItem(item: LiquidacionItem) {
    const nd = this.store.numDoc();
    if (!nd) return;
    if (item.abonado > 0) {
      this.msg.set('No se puede eliminar un ítem con pagos.');
      return;
    }
    const descr = item.descripcion || 'este ítem';
    const ok = await this.confirmSvc.open({
      title: '¿Eliminar este ítem?',
      message: `Se eliminará «${descr}» de la liquidación. Esta acción no se puede deshacer.`,
      variant: 'danger',
      icon: 'delete',
      confirmLabel: 'Sí, eliminar',
    });
    if (!ok) return;
    this.liqSvc.eliminar(item._id).subscribe({
      next: () => this.recargar(nd),
      error: (e) => this.msg.set(e?.error?.message || 'Error eliminando.'),
    });
  }

  num(v: any): number {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return Number(v) || 0;
    if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
    return Number(v) || 0;
  }

  fmt(v: any): string {
    const n = this.num(v);
    return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  estadoClass(it: LiquidacionItem): string {
    const s = this.num(it.saldo);
    if (s <= 0) return 'ok';
    if (this.num(it.abonado) > 0) return 'warn';
    return 'err';
  }

  toggleRecibosItem(it: LiquidacionItem) {
    const id = it._id;
    this.itemRecibosAbierto.set(this.itemRecibosAbierto() === id ? null : id);
  }

  imprimirRecibo(idIngreso: string) {
    this.reciboSvc.abrirHtml(idIngreso, (m) => this.msg.set(m));
  }

  verRecibo(idIngreso: string) {
    if (!idIngreso) return;
    const url = this.router.serializeUrl(this.router.createUrlTree(['/recibo', idIngreso]));
    const w = window.open(url, '_blank', 'width=420,height=720');
    if (!w) this.msg.set('Permita ventanas emergentes para ver el comprobante.');
  }

  tiempoFmt(f?: string): string {
    if (!f) return '';
    const d = new Date(f);
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  }

  idIngreso = idIngreso;
}
