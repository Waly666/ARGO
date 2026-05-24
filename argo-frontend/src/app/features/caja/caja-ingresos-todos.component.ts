import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { IngresoService } from '../../core/services/ingreso.service';
import { ReciboService, idIngreso } from '../../core/services/recibo.service';
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
import { readVistaLista, saveVistaLista, VistaLista } from '../../core/utils/vista-lista.helpers';

@Component({
  selector: 'argo-caja-ingresos-todos',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './caja-ingresos-todos.component.html',
  styleUrls: ['./caja-listados-admin.scss'],
})
export class CajaIngresosTodosComponent implements OnInit {
  private ingSvc = inject(IngresoService);
  private reciboSvc = inject(ReciboService);
  private router = inject(Router);

  private readonly vistaKey = 'argo-caja-ingresos-todos-vista';

  vista = signal<VistaLista>(readVistaLista(this.vistaKey));
  items = signal<any[]>([]);
  total = signal(0);
  totalValor = signal(0);
  loading = signal(false);
  msg = signal<string | null>(null);

  q = signal('');
  numDoc = signal('');
  desde = signal('');
  hasta = signal('');

  capFecha = capFecha;
  capRecibo = capRecibo;
  capDoc = capDoc;
  capTipoIngreso = capTipoIngreso;
  capTipoAbono = capTipoAbono;
  capConceptoCaja = capConceptoCaja;
  capFormaPago = capFormaPago;
  capCuentaBancaria = capCuentaBancaria;
  capValorIngreso = capValorIngreso;
  capBeneficiario = capBeneficiario;
  capRefComprobante = capRefComprobante;

  ngOnInit(): void {
    this.cargar();
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

  private fetchPaginas(skip: number, acumulado: any[]): void {
    this.ingSvc
      .listarTodosAdmin({
        q: this.q().trim() || undefined,
        numDoc: this.numDoc().trim() || undefined,
        desde: this.desde() || undefined,
        hasta: this.hasta() || undefined,
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
          this.totalValor.set(r.totalValor || merged.reduce((a, i) => a + Number(i.valor || 0), 0));
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.msg.set(e?.error?.message || 'Error cargando ingresos.');
        },
      });
  }

  limpiarFiltros(): void {
    this.q.set('');
    this.numDoc.set('');
    this.desde.set('');
    this.hasta.set('');
    this.cargar();
  }

  pagadorLabel(i: any): string {
    if (i.esIngresoCaja) return i.pagadorDescr || i.recibidoDe || 'Tercero';
    return i.alumnoNombre || i.pagadorDescr || (i.numDoc != null ? String(i.numDoc) : '—');
  }

  conceptoLabel(i: any): string {
    return i.conceptoLabel || i.liquidacionDescr || i.concepto || '—';
  }

  formaPagoLabel(i: any): string {
    return i.formaPago || i.tipoPagoDescr || '—';
  }

  refComprobante(i: any): string {
    return String(i.numTransferencia || i.numComprobante || '').trim();
  }

  verRecibo(ing: { _id?: unknown }): void {
    const id = idIngreso(ing);
    if (!id) return;
    const url = this.router.serializeUrl(this.router.createUrlTree(['/recibo', id]));
    window.open(url, '_blank', 'width=420,height=720');
  }

  imprimirRecibo(ing: { _id?: unknown }): void {
    const id = idIngreso(ing);
    if (!id) return;
    this.reciboSvc.abrirHtml(id, (m) => this.msg.set(m));
  }
}
