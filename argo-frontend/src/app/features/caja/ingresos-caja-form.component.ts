import { CommonModule } from '@angular/common';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CatalogoService } from '../../core/services/catalogo.service';
import { CajaSesionService } from '../../core/services/caja-sesion.service';
import { CajaAperturaAlertService } from '../../core/services/caja-apertura-alert.service';
import { Empleado, EmpleadoService } from '../../core/services/empleado.service';
import { IngresoService } from '../../core/services/ingreso.service';
import { Tercero, TerceroService } from '../../core/services/tercero.service';
import { requiereReferenciaPago, requiereSoportePago } from '../../core/utils/referencia-pago.util';
import { leerImagenSoporte } from '../../core/utils/pago-soporte.helpers';
import { pagoIntangibleCompleto, validarPagoIntangible } from '../../core/utils/pago-intangible.validators';
import { PagoSoporteFieldComponent } from '../../shared/pago-soporte-field/pago-soporte-field.component';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
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
  { idTipoPago: '7', codigo: 'PL', descripcion: 'Pago en línea' },
];

@Component({
  selector: 'argo-ingresos-caja-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ArgoDateInputComponent,
    PagoSoporteFieldComponent,
    CatalogoEnumBuscarComponent,
  ],
  templateUrl: './ingresos-caja-form.component.html',
  styleUrls: ['./ingresos-caja-form.component.scss'],
})
export class IngresosCajaFormComponent implements OnInit {
  private catSvc = inject(CatalogoService);
  private cajaSvc = inject(CajaSesionService);
  private cajaAlert = inject(CajaAperturaAlertService);
  private ingSvc = inject(IngresoService);
  private empSvc = inject(EmpleadoService);
  private terSvc = inject(TerceroService);
  private router = inject(Router);

  tiposIngreso = signal<TipoIngresoCat[]>([]);
  tiposPago = signal<Record<string, unknown>[]>(TIPOS_PAGO_DEF);
  cuentasBancarias = signal<Record<string, unknown>[]>([]);
  empleados = signal<Empleado[]>([]);
  terceros = signal<Tercero[]>([]);
  cajaAbierta = signal(false);
  sesionId = signal<number | null>(null);

  idTipoIngreso = signal('');
  concepto = signal('');
  /** libre | empleado | tercero */
  tipoPagador = signal<'libre' | 'empleado' | 'tercero'>('tercero');
  idEmpleado = signal<number | null>(null);
  idTercero = signal<string | null>(null);
  empleadoTexto = signal('');
  terceroTexto = signal('');
  recibidoDe = signal('');
  documentoTercero = signal('');
  tipoPersona = signal<'natural' | 'juridica' | ''>('');
  correoPagador = signal('');
  direccionPagador = signal('');
  telefonoPagador = signal('');
  valor = signal(0);
  idTipoPago = signal('');
  idCuentaBancaria = signal('');
  numComprobante = signal('');
  archivoSoporte = signal<File | null>(null);
  previewSoporte = signal<string | null>(null);
  observaciones = signal('');
  fecha = signal(new Date().toISOString().slice(0, 10));

  saving = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);

  tipoSel = computed(() =>
    this.tiposIngreso().find((t) => String(t.idTipoIngreso) === String(this.idTipoIngreso())) ?? null,
  );

  esContrato = computed(() => esIngresoContrato(this.tipoSel()));
  esAprovision = computed(() => esAprovisionamientoCaja(this.tipoSel()));
  esOtros = computed(() => esOtrosIngresos(this.tipoSel()));

  opcionesEmpleado = computed<EnumBuscarOption[]>(() =>
    this.empleados().map((e) => ({
      value: e.idEmpleado,
      label: `${e.nombreCompleto || ''} — ${e.numeroDocumento || ''}`.trim(),
      hint: e.cargoNombre || undefined,
    })),
  );

  opcionesTercero = computed<EnumBuscarOption[]>(() =>
    this.terceros().map((t) => ({
      value: String(t._id),
      label: `${t.nombre || t.razonSocial || t.nombres || ''} — ${t.identificacion || ''}`.trim(),
      hint: t.correo || t.telefono || undefined,
    })),
  );

  contactoVisible = computed(() => {
    const tipo = this.tipoPagador();
    if (tipo === 'empleado' && this.idEmpleado()) return true;
    if (tipo === 'tercero' && this.idTercero()) return true;
    return false;
  });

  esEfectivo = computed(() => {
    const t = this.tipoPagoSel();
    if (!t) return false;
    const txt = this.tipoPagoLabel(t).toLowerCase();
    return txt.includes('efect') || txt.includes('ef');
  });

  requiereCuentaEmpresa = computed(() => !!this.idTipoPago() && !this.esEfectivo());

  requiereComprobante = computed(() => {
    const t = this.tipoPagoSel();
    if (!t) return false;
    const d = t['descripcion'] ?? t['nombre'] ?? t['tipo'];
    return requiereReferenciaPago(d ? String(d) : '');
  });

  requiereSoporte = computed(() => {
    const t = this.tipoPagoSel();
    if (!t) return false;
    const d = t['descripcion'] ?? t['nombre'] ?? t['tipo'];
    return requiereSoportePago(d ? String(d) : '');
  });

  onSoporteArchivo(file: File) {
    const ok = leerImagenSoporte(
      file,
      (dataUrl) => {
        this.archivoSoporte.set(file);
        this.previewSoporte.set(dataUrl);
      },
      (msg) => this.inform(msg, true),
    );
    if (!ok) this.quitarSoporte();
  }

  quitarSoporte() {
    this.archivoSoporte.set(null);
    this.previewSoporte.set(null);
  }

  inputPagoIntangible = computed(() => ({
    esIntangible: this.requiereCuentaEmpresa(),
    referencia: this.numComprobante(),
    archivo: this.archivoSoporte(),
  }));

  mensajePagoIntangible = computed(() => {
    const v = validarPagoIntangible(this.inputPagoIntangible());
    return v.ok ? null : v.message;
  });

  puedeGuardar = computed(() => {
    if (!this.idTipoIngreso() || !this.concepto().trim() || !(this.valor() > 0) || !this.idTipoPago()) {
      return false;
    }
    if (this.requiereCuentaEmpresa() && !this.idCuentaBancaria()) return false;
    return pagoIntangibleCompleto(this.inputPagoIntangible());
  });

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
    this.empSvc.listar({ activos: true }).subscribe({
      next: (e) => this.empleados.set((e || []).filter((x) => x.numeroDocumento)),
    });
    this.terSvc.listar().subscribe({
      next: (t) => this.terceros.set(t || []),
      error: () => this.terceros.set([]),
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

  setTipoPagador(tipo: 'libre' | 'empleado' | 'tercero'): void {
    this.tipoPagador.set(tipo);
    this.idEmpleado.set(null);
    this.idTercero.set(null);
    this.empleadoTexto.set('');
    this.terceroTexto.set('');
    this.recibidoDe.set('');
    this.documentoTercero.set('');
    this.correoPagador.set('');
    this.direccionPagador.set('');
    this.telefonoPagador.set('');
    if (tipo === 'libre' && this.esContrato() && !this.tipoPersona()) {
      this.tipoPersona.set('juridica');
    }
  }

  onEmpleadoPick(opt: EnumBuscarOption): void {
    const id = Number(opt.value);
    this.idEmpleado.set(Number.isFinite(id) ? id : null);
    this.empleadoTexto.set(opt.label);
    const emp = this.empleados().find((e) => e.idEmpleado === id);
    if (!emp) return;
    this.recibidoDe.set(emp.nombreCompleto || '');
    this.documentoTercero.set(emp.numeroDocumento || '');
    this.tipoPersona.set('natural');
    this.correoPagador.set(String(emp.correoCorporativo || emp.correoPersonal || '').trim());
    this.direccionPagador.set(String(emp.direccion || '').trim());
    this.telefonoPagador.set(String(emp.celular || emp.telefono || '').trim());
  }

  onEmpleadoLimpiar(): void {
    this.idEmpleado.set(null);
    this.empleadoTexto.set('');
    this.recibidoDe.set('');
    this.documentoTercero.set('');
    this.correoPagador.set('');
    this.direccionPagador.set('');
    this.telefonoPagador.set('');
  }

  onTerceroPick(opt: EnumBuscarOption): void {
    const id = String(opt.value);
    this.idTercero.set(id);
    this.terceroTexto.set(opt.label);
    const ter = this.terceros().find((t) => String(t._id) === id);
    if (!ter) return;
    this.recibidoDe.set(ter.nombre || ter.razonSocial || ter.nombres || '');
    this.documentoTercero.set(ter.identificacion || '');
    this.tipoPersona.set(String(ter.legalOrganizationCode) === '1' ? 'juridica' : 'natural');
    this.correoPagador.set(String(ter.correo || '').trim());
    this.direccionPagador.set(String(ter.direccion || '').trim());
    this.telefonoPagador.set(String(ter.telefono || '').trim());
  }

  onTerceroLimpiar(): void {
    this.idTercero.set(null);
    this.terceroTexto.set('');
    this.recibidoDe.set('');
    this.documentoTercero.set('');
    this.correoPagador.set('');
    this.direccionPagador.set('');
    this.telefonoPagador.set('');
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
      this.inform('Seleccione el tipo de ingreso.');
      return;
    }
    if (!this.concepto().trim()) {
      this.inform('El concepto es obligatorio.');
      return;
    }
    if (!(this.valor() > 0)) {
      this.inform('Indique un valor válido.');
      return;
    }
    if (!this.idTipoPago()) {
      this.inform('Seleccione la forma de pago.');
      return;
    }
    if (this.requiereCuentaEmpresa() && !this.idCuentaBancaria()) {
      this.inform('Indique la cuenta bancaria de la empresa.');
      return;
    }
    const intangible = validarPagoIntangible(this.inputPagoIntangible());
    if (!intangible.ok) {
      this.inform(intangible.message, true);
      return;
    }
    if (!this.puedeGuardar()) {
      this.inform(this.mensajePagoIntangible() || 'Complete referencia y pantallazo del movimiento.', true);
      return;
    }

    const pagador = this.tipoPagador();
    if (pagador === 'empleado' && !this.idEmpleado()) {
      this.inform('Seleccione el empleado que entrega el dinero.');
      return;
    }
    if (pagador === 'tercero' && !this.idTercero()) {
      this.inform('Seleccione el tercero del catálogo (o créelo en Flujo de caja → Terceros).');
      return;
    }
    if (pagador === 'libre' || !pagador) {
      if (this.esContrato()) {
        if (!this.recibidoDe().trim()) {
          this.inform('Indique el nombre del contratante.');
          return;
        }
        if (!this.documentoTercero().trim()) {
          this.inform('Indique NIT o documento del contratante.');
          return;
        }
        if (!this.tipoPersona()) {
          this.inform('Indique si es persona natural o jurídica.');
          return;
        }
      } else if (this.esAprovision() || this.esOtros()) {
        if (!this.recibidoDe().trim()) {
          this.inform('Indique quién entrega el dinero.');
          return;
        }
      }
    }

    this.saving.set(true);
    this.inform(null);
    this.ingSvc
      .crearCaja(
        {
          idTipoIngreso: this.idTipoIngreso(),
          concepto: this.concepto().trim(),
          recibidoDe: this.recibidoDe().trim() || undefined,
          documentoTercero: this.documentoTercero().trim() || undefined,
          tipoPersona: this.tipoPersona() || undefined,
          idEmpleado: pagador === 'empleado' ? this.idEmpleado() : null,
          idTercero: pagador === 'tercero' ? this.idTercero() : null,
          valor: this.valor(),
          idTipoPago: this.idTipoPago(),
          idCuentaBancaria: this.requiereCuentaEmpresa() ? this.idCuentaBancaria() : undefined,
          numComprobante: this.numComprobante().trim() || undefined,
          observaciones: this.observaciones().trim() || undefined,
          fecha: this.fecha() || undefined,
        },
        this.archivoSoporte(),
      )
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          const ref = res?.numRecibo ? ` Comprobante ${res.numRecibo}.` : '';
          this.inform(`Ingreso registrado.${ref}`);
          setTimeout(() => void this.router.navigate(['/app/caja/ingresos']), 600);
        },
        error: (e) => {
          this.saving.set(false);
          this.inform(e?.error?.message || 'No se pudo registrar el ingreso.');
        },
      });
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
