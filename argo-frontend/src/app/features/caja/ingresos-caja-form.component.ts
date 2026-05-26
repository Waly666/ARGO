import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CatalogoService } from '../../core/services/catalogo.service';
import { CajaSesionService } from '../../core/services/caja-sesion.service';
import { CajaAperturaAlertService } from '../../core/services/caja-apertura-alert.service';
import { IngresoService } from '../../core/services/ingreso.service';
import {
  TipoIngresoCat,
  esAprovisionamientoCaja,
  esIngresoContrato,
  esOtrosIngresos,
  filtrarTiposIngresoCaja,
  labelTipoIngreso,
} from '../../core/utils/tipo-ingreso-caja.helpers';

const TIPOS_PAGO_DEF = [
  { idTipoPago: '1', codigo: 'EF', descripcion: 'Efectivo' },
  { idTipoPago: '2', codigo: 'TR', descripcion: 'Transferencia' },
  { idTipoPago: '3', codigo: 'TC', descripcion: 'Tarjeta crédito' },
  { idTipoPago: '4', codigo: 'TD', descripcion: 'Tarjeta débito' },
  { idTipoPago: '5', codigo: 'CH', descripcion: 'Cheque' },
  { idTipoPago: '6', codigo: 'NE', descripcion: 'Nequi / Daviplata' },
];

@Component({
  selector: 'argo-ingresos-caja-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ingresos-caja-form.component.html',
  styleUrls: ['./ingresos-caja-form.component.scss'],
})
export class IngresosCajaFormComponent implements OnInit {
  private catSvc = inject(CatalogoService);
  private cajaSvc = inject(CajaSesionService);
  private cajaAlert = inject(CajaAperturaAlertService);
  private ingSvc = inject(IngresoService);
  private router = inject(Router);

  tiposIngreso = signal<TipoIngresoCat[]>([]);
  tiposPago = signal<Record<string, unknown>[]>(TIPOS_PAGO_DEF);
  cuentasBancarias = signal<Record<string, unknown>[]>([]);
  cajaAbierta = signal(false);
  sesionId = signal<number | null>(null);

  idTipoIngreso = signal('');
  concepto = signal('');
  recibidoDe = signal('');
  documentoTercero = signal('');
  tipoPersona = signal<'natural' | 'juridica' | ''>('');
  valor = signal(0);
  idTipoPago = signal('');
  idCuentaBancaria = signal('');
  numComprobante = signal('');
  observaciones = signal('');
  fecha = signal(new Date().toISOString().slice(0, 10));

  saving = signal(false);
  msg = signal<string | null>(null);

  tipoSel = computed(() =>
    this.tiposIngreso().find((t) => String(t.idTipoIngreso) === String(this.idTipoIngreso())) ?? null,
  );

  esContrato = computed(() => esIngresoContrato(this.tipoSel()));
  esAprovision = computed(() => esAprovisionamientoCaja(this.tipoSel()));
  esOtros = computed(() => esOtrosIngresos(this.tipoSel()));

  esEfectivo = computed(() => {
    const t = this.tipoPagoSel();
    if (!t) return false;
    const txt = this.tipoPagoLabel(t).toLowerCase();
    return txt.includes('efect') || txt.includes('ef');
  });

  requiereCuentaEmpresa = computed(() => !!this.idTipoPago() && !this.esEfectivo());

  ngOnInit(): void {
    this.catSvc.list('tipoIngreso', { refresh: true }).subscribe({
      next: (rows) => this.tiposIngreso.set(filtrarTiposIngresoCaja((rows || []) as TipoIngresoCat[])),
    });
    this.catSvc.list('catTipoPago', { refresh: true }).subscribe({
      next: (d) => this.tiposPago.set(d?.length ? d : TIPOS_PAGO_DEF),
    });
    this.catSvc.list('cuentasBancarias', { refresh: true }).subscribe({
      next: (d) => this.cuentasBancarias.set(d || []),
    });
    this.cajaSvc.activa().subscribe({
      next: (r) => {
        this.cajaAbierta.set(!!r.abierta);
        this.sesionId.set(r.sesion?.idSesion ?? null);
      },
    });
  }

  labelTipo = labelTipoIngreso;

  onTipoIngresoChange(id: string): void {
    this.idTipoIngreso.set(id);
    const t = this.tiposIngreso().find((x) => String(x.idTipoIngreso) === String(id));
    if (esAprovisionamientoCaja(t) && !this.concepto().trim()) {
      this.concepto.set('Aprovisionamiento de caja para operación');
    }
    if (esIngresoContrato(t) && !this.tipoPersona()) {
      this.tipoPersona.set('juridica');
    }
  }

  tipoPagoValor(t: Record<string, unknown>): string {
    const v = t['idTipoPago'] ?? t['codigo'] ?? t['_id'];
    return v != null ? String(v) : '';
  }

  tipoPagoLabel(t: Record<string, unknown>): string {
    const d = t['descripcion'] ?? t['nombre'] ?? t['tipo'];
    return d ? String(d) : this.tipoPagoValor(t);
  }

  cuentaValor(c: Record<string, unknown>): string {
    const v = c['idCuentaBancaria'] ?? c['idCuenta'] ?? c['_id'];
    return v != null ? String(v) : '';
  }

  labelCuenta(c: Record<string, unknown>): string {
    const b = String(c['banco'] || '').trim();
    const n = c['numCuenta'] ?? '';
    const t = String(c['tipo'] || '').trim();
    return [b, t, n].filter(Boolean).join(' — ');
  }

  onTipoPagoChange(id: string): void {
    this.idTipoPago.set(id);
    if (!id) {
      this.idCuentaBancaria.set('');
      return;
    }
    const t = this.tiposPago().find((x) => this.tipoPagoValor(x) === id);
    const txt = t ? this.tipoPagoLabel(t).toLowerCase() : '';
    const cuentas = this.cuentasBancarias();
    if (!cuentas.length) return;
    let match: Record<string, unknown> | undefined;
    if (txt.includes('nequi')) {
      match = cuentas.find((c) => String(c['banco'] || '').toLowerCase().includes('nequi'));
    } else if (txt.includes('daviplata')) {
      match = cuentas.find((c) => String(c['banco'] || '').toLowerCase().includes('daviplata'));
    }
    if (match) this.idCuentaBancaria.set(this.cuentaValor(match));
  }

  tipoPagoSel(): Record<string, unknown> | undefined {
    const id = this.idTipoPago();
    return this.tiposPago().find((x) => this.tipoPagoValor(x) === id);
  }

  cancelar(): void {
    void this.router.navigate(['/app/caja/ingresos']);
  }

  async guardar(): Promise<void> {
    if (!(await this.cajaAlert.ensureAbierta('registrar ingresos'))) return;
    if (!this.idTipoIngreso()) {
      this.msg.set('Seleccione el tipo de ingreso.');
      return;
    }
    if (!this.concepto().trim()) {
      this.msg.set('El concepto es obligatorio.');
      return;
    }
    if (!(this.valor() > 0)) {
      this.msg.set('Indique un valor válido.');
      return;
    }
    if (!this.idTipoPago()) {
      this.msg.set('Seleccione la forma de pago.');
      return;
    }
    if (this.requiereCuentaEmpresa() && !this.idCuentaBancaria()) {
      this.msg.set('Indique la cuenta bancaria de la empresa.');
      return;
    }
    if (this.esContrato()) {
      if (!this.recibidoDe().trim()) {
        this.msg.set('Indique el nombre del contratante.');
        return;
      }
      if (!this.documentoTercero().trim()) {
        this.msg.set('Indique NIT o documento del contratante.');
        return;
      }
      if (!this.tipoPersona()) {
        this.msg.set('Indique si es persona natural o jurídica.');
        return;
      }
    } else if (this.esAprovision() || this.esOtros()) {
      if (!this.recibidoDe().trim()) {
        this.msg.set('Indique quién entrega el dinero.');
        return;
      }
    }

    this.saving.set(true);
    this.msg.set(null);
    this.ingSvc
      .crearCaja({
        idTipoIngreso: this.idTipoIngreso(),
        concepto: this.concepto().trim(),
        recibidoDe: this.recibidoDe().trim() || undefined,
        documentoTercero: this.documentoTercero().trim() || undefined,
        tipoPersona: this.tipoPersona() || undefined,
        valor: this.valor(),
        idTipoPago: this.idTipoPago(),
        idCuentaBancaria: this.requiereCuentaEmpresa() ? this.idCuentaBancaria() : undefined,
        numComprobante: this.numComprobante().trim() || undefined,
        observaciones: this.observaciones().trim() || undefined,
        fecha: this.fecha() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          const ref = res?.numRecibo ? ` Comprobante ${res.numRecibo}.` : '';
          this.msg.set(`Ingreso registrado.${ref}`);
          setTimeout(() => void this.router.navigate(['/app/caja/ingresos']), 600);
        },
        error: (e) => {
          this.saving.set(false);
          this.msg.set(e?.error?.message || 'No se pudo registrar el ingreso.');
        },
      });
  }
}
