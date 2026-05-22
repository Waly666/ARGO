import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';
import { AlumnoStore } from '../../../core/services/alumno-store.service';
import { ReciboService, idIngreso } from '../../../core/services/recibo.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { IngresoService } from '../../../core/services/ingreso.service';
import { LiquidacionItem, LiquidacionResumen, LiquidacionService } from '../../../core/services/liquidacion.service';

const TIPOS_PAGO_DEF = [
  { idTipoPago: '1', codigo: 'EF', descripcion: 'Efectivo' },
  { idTipoPago: '2', codigo: 'TR', descripcion: 'Transferencia' },
  { idTipoPago: '3', codigo: 'TC', descripcion: 'Tarjeta crédito' },
  { idTipoPago: '4', codigo: 'TD', descripcion: 'Tarjeta débito' },
  { idTipoPago: '5', codigo: 'CH', descripcion: 'Cheque' },
  { idTipoPago: '6', codigo: 'NE', descripcion: 'Nequi / Daviplata' },
];

@Component({
  selector: 'argo-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.scss'],
})
export class PagosComponent {
  store = inject(AlumnoStore);
  private router = inject(Router);
  private catSvc = inject(CatalogoService);
  private liqSvc = inject(LiquidacionService);
  private ingSvc = inject(IngresoService);
  private reciboSvc = inject(ReciboService);
  private confirmSvc = inject(ConfirmDialogService);

  tiposPago = signal<Record<string, unknown>[]>(TIPOS_PAGO_DEF);
  bancos = signal<Record<string, unknown>[]>([]);

  liquidacion = signal<LiquidacionResumen>({ items: [], totales: { valor: 0, abonado: 0, saldo: 0 } });
  pagos = signal<any[]>([]);

  idLiquidacion = signal<string>('');
  valor = signal<number>(0);
  idTipoPago = signal<string>('');
  idBanco = signal<string>('');
  numComprobante = signal<string>('');
  observaciones = signal<string>('');

  loading = signal(false);
  saving = signal(false);
  msg = signal<string | null>(null);

  itemsConSaldo = computed(() => this.liquidacion().items.filter((i) => this.num(i.saldo) > 0));
  totales = computed(() => this.liquidacion().totales);

  itemSel = computed(() => this.liquidacion().items.find((i) => i._id === this.idLiquidacion()));

  esEfectivo = computed(() => {
    const t = this.tipoPagoSel();
    if (!t) return false;
    const txt = this.tipoPagoLabel(t).toLowerCase();
    return txt.includes('efect') || txt.includes('ef');
  });

  constructor() {
    this.catSvc.list('catTipoPago', { refresh: true }).subscribe({
      next: (d) => this.tiposPago.set(d?.length ? d : TIPOS_PAGO_DEF),
      error: () => this.tiposPago.set(TIPOS_PAGO_DEF),
    });
    this.catSvc.list('bancos', { refresh: true }).subscribe((d) => this.bancos.set(d || []));

    effect(() => {
      const nd = this.store.numDoc();
      if (nd) this.recargar(nd);
      else {
        this.liquidacion.set({ items: [], totales: { valor: 0, abonado: 0, saldo: 0 } });
        this.pagos.set([]);
      }
    });
  }

  tipoPagoValor(t: Record<string, unknown>): string {
    const v = t['idTipoPago'] ?? t['codigo'] ?? t['_id'];
    return v != null ? String(v) : '';
  }

  tipoPagoLabel(t: Record<string, unknown>): string {
    const d = t['descripcion'] ?? t['nombre'] ?? t['tipo'];
    return d ? String(d) : this.tipoPagoValor(t);
  }

  bancoValor(b: Record<string, unknown>): string {
    const v = b['idBanco'] ?? b['idbanco'] ?? b['codigo'] ?? b['_id'];
    return v != null ? String(v) : '';
  }

  bancoLabel(b: Record<string, unknown>): string {
    const d = b['descripcion'] ?? b['nombre'] ?? b['banco'];
    return d ? String(d) : this.bancoValor(b);
  }

  tipoPagoSel(): Record<string, unknown> | undefined {
    const id = this.idTipoPago();
    return this.tiposPago().find((x) => this.tipoPagoValor(x) === id);
  }

  recargar(numDoc: string) {
    this.loading.set(true);
    this.liqSvc.listarPorAlumno(numDoc).subscribe({
      next: (r) => this.liquidacion.set(r),
    });
    this.ingSvc.listarPorAlumno(numDoc).subscribe({
      next: (r) => {
        this.pagos.set(r || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  registrar() {
    const nd = this.store.numDoc();
    if (!nd) {
      this.msg.set('Selecciona un alumno primero.');
      return;
    }
    if (!this.idLiquidacion()) {
      this.msg.set('Selecciona un ítem de liquidación.');
      return;
    }
    if (!this.valor() || this.valor() <= 0) {
      this.msg.set('Valor del pago inválido.');
      return;
    }
    if (!this.idTipoPago()) {
      this.msg.set('Selecciona el tipo de pago.');
      return;
    }
    const it = this.itemSel();
    if (it && this.valor() > this.num(it.saldo)) {
      this.msg.set('El valor del pago excede el saldo del ítem.');
      return;
    }
    this.saving.set(true);
    this.msg.set(null);
    this.ingSvc
      .crear({
        numDoc: nd,
        idLiquidacion: this.idLiquidacion(),
        valor: this.valor(),
        idTipoPago: this.idTipoPago(),
        idBanco: this.esEfectivo() ? undefined : this.idBanco() || undefined,
        numComprobante: this.numComprobante() || undefined,
        observaciones: this.observaciones() || undefined,
      })
      .subscribe({
        next: (ing) => {
          this.saving.set(false);
          this.valor.set(0);
          this.idLiquidacion.set('');
          this.idBanco.set('');
          this.numComprobante.set('');
          this.observaciones.set('');
          this.recargar(nd);
          const id = ing?._id;
          this.msg.set(
            id
              ? `Pago registrado (${ing.numRecibo || ''}). Puede imprimir el recibo.`
              : 'Pago registrado correctamente.',
          );
          if (id) {
            void this.preguntarImprimirRecibo(ing);
          }
        },
        error: (e) => {
          this.saving.set(false);
          this.msg.set(e?.error?.message || 'Error al registrar pago.');
        },
      });
  }

  imprimirRecibo(ing: { _id?: unknown; id?: unknown }) {
    const id = idIngreso(ing);
    if (!id) {
      this.msg.set('No se puede imprimir: comprobante sin ID.');
      return;
    }
    this.reciboSvc.abrirHtml(id, (m) => this.msg.set(m));
  }

  verRecibo(ing: { _id?: unknown; id?: unknown }) {
    const id = idIngreso(ing);
    if (!id) return;
    const url = this.router.serializeUrl(this.router.createUrlTree(['/recibo', id]));
    const w = window.open(url, '_blank', 'width=420,height=720');
    if (!w) this.msg.set('Permita ventanas emergentes para ver el comprobante.');
  }

  private async preguntarImprimirRecibo(ing: { _id?: unknown; id?: unknown; numRecibo?: string }) {
    const num = ing.numRecibo ? ` (${ing.numRecibo})` : '';
    const ok = await this.confirmSvc.open({
      title: '¿Imprimir comprobante?',
      message: `El pago se registró correctamente${num}. ¿Desea imprimir el comprobante de ingreso ahora?`,
      variant: 'primary',
      icon: 'print',
      confirmLabel: 'Sí, imprimir',
      cancelLabel: 'Ahora no',
    });
    if (ok) this.imprimirRecibo(ing);
  }

  async reversar(p: any) {
    const nd = this.store.numDoc();
    if (!nd) return;
    const ref = p.numRecibo ? ` «${p.numRecibo}»` : '';
    const ok = await this.confirmSvc.open({
      title: '¿Reversar este pago?',
      message: `Se anulará el comprobante${ref} y se descontará el valor de la liquidación. Esta acción no se puede deshacer.`,
      variant: 'warn',
      icon: 'warning',
      confirmLabel: 'Sí, reversar',
    });
    if (!ok) return;
    this.ingSvc.eliminar(p._id).subscribe({
      next: () => this.recargar(nd),
      error: (e) => this.msg.set(e?.error?.message || 'Error reversando pago.'),
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
    return this.num(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  tiempoFmt(f?: string): string {
    if (!f) return '';
    const d = new Date(f);
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  }

  descrItem(it: LiquidacionItem): string {
    const d = it.descripcion || '(sin descripción)';
    return `${d} · saldo ${this.fmt(it.saldo)}`;
  }

  conceptoPago(p: { idLiquidacion?: string; liquidacionDescr?: string }): string {
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
}
