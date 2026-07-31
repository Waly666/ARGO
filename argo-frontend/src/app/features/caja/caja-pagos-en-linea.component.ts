import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  InformeIngresosEnLinea,
  PasarelaService,
} from '../../core/services/pasarela.service';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';

@Component({
  selector: 'argo-caja-pagos-en-linea',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, ArgoDateInputComponent],
  templateUrl: './caja-pagos-en-linea.component.html',
  styleUrls: ['./caja-pagos-en-linea.component.scss', './caja-listados-admin.scss'],
})
export class CajaPagosEnLineaComponent implements OnInit {
  private pasSvc = inject(PasarelaService);

  desde = signal('');
  hasta = signal('');
  q = signal('');
  numDoc = signal('');
  numRecibo = signal('');
  referencia = signal('');

  loading = signal(false);
  data = signal<InformeIngresosEnLinea | null>(null);
  msg = signal<string | null>(null);
  msgError = signal(false);

  ngOnInit(): void {
    const hoy = new Date();
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - 30);
    this.hasta.set(hoy.toISOString().slice(0, 10));
    this.desde.set(desde.toISOString().slice(0, 10));
    this.cargar();
  }

  filtrosExtra() {
    return {
      q: this.q().trim() || undefined,
      numDoc: this.numDoc().trim() || undefined,
      numRecibo: this.numRecibo().trim() || undefined,
      referencia: this.referencia().trim() || undefined,
    };
  }

  cargar(): void {
    this.loading.set(true);
    this.msg.set(null);
    this.msgError.set(false);
    this.pasSvc
      .informeIngresos(this.desde() || undefined, this.hasta() || undefined, this.filtrosExtra())
      .subscribe({
        next: (r) => {
          this.data.set(r);
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.data.set(null);
          this.msgError.set(true);
          this.msg.set(e?.error?.message || 'No se pudieron cargar los pagos en línea.');
        },
      });
  }

  limpiar(): void {
    this.q.set('');
    this.numDoc.set('');
    this.numRecibo.set('');
    this.referencia.set('');
    this.cargar();
  }

  exportarCsv(): void {
    this.pasSvc
      .exportIngresos(this.desde() || undefined, this.hasta() || undefined, this.filtrosExtra())
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'pagos-en-linea.csv';
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => {
          this.msgError.set(true);
          this.msg.set('No se pudo exportar el informe.');
        },
      });
  }

  imprimir(): void {
    const d = this.data();
    if (!d) return;
    const money = (v: number) =>
      (v || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    const esc = (s: unknown) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const rows = d.filas
      .map(
        (f) => `<tr>
          <td>${esc(f.fecha ? new Date(f.fecha).toISOString().slice(0, 10) : '')}</td>
          <td>${esc(f.numRecibo)}</td>
          <td>${esc(f.numDoc)}</td>
          <td>${esc(f.recibiDe || '')}</td>
          <td>${esc(f.concepto)}</td>
          <td>${esc(f.pagoEnLineaReference || f.wompiTransactionId || '')}</td>
          <td style="text-align:right">${money(f.valor)}</td>
        </tr>`,
      )
      .join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pagos en línea</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;color:#111}
        h1{font-size:1.25rem;margin:0 0 8px}
        .meta{color:#555;margin-bottom:16px;font-size:0.9rem}
        table{width:100%;border-collapse:collapse;font-size:0.85rem}
        th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
        th{background:#f3f4f6}
        .tot{margin-top:12px;font-weight:700}
      </style></head><body>
      <h1>Informe de pagos en línea</h1>
      <p class="meta">Periodo: ${esc(d.desde || this.desde() || '—')} a ${esc(d.hasta || this.hasta() || '—')}
        · ${d.resumen.cantidad} recibo(s) · Total ${money(d.resumen.total)}</p>
      <p class="meta">Cobros automáticos de aula virtual (pasarela). No forman parte del cuadre de caja del cajero.</p>
      <table><thead><tr>
        <th>Fecha</th><th>Recibo</th><th>Documento</th><th>Pagador</th><th>Concepto</th><th>Referencia</th><th>Valor</th>
      </tr></thead><tbody>${rows || '<tr><td colspan="7">Sin registros</td></tr>'}</tbody></table>
      <p class="tot">Total: ${money(d.resumen.total)}</p>
      </body></html>`;
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  }
}
