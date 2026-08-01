import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';

import { AlumnoStore } from '../../../core/services/alumno-store.service';
import { PermisoService } from '../../../core/services/permiso.service';
import { FacturaEmitirModalComponent } from '../../facturacion/factura-emitir-modal.component';
import {
  FacturaElectronicaItem,
  FacturacionService,
} from '../../../core/services/facturacion.service';

@Component({
  selector: 'argo-alumno-facturacion',
  standalone: true,
  imports: [CommonModule, FacturaEmitirModalComponent],
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
})
export class AlumnoFacturacionComponent {
  store = inject(AlumnoStore);
  permisoSvc = inject(PermisoService);
  private feSvc = inject(FacturacionService);

  msg = signal<string | null>(null);
  mostrarFactura = signal(false);
  facturasEmitidas = signal<FacturaElectronicaItem[]>([]);
  loadingFacturas = signal(false);
  msgFacturas = signal<string | null>(null);
  facturaDetalleAbierto = signal<string | null>(null);

  puedeEmitir = (): boolean =>
    this.permisoSvc.tiene('facturacion') || this.permisoSvc.tiene('alumnos.pagos');

  constructor() {
    effect(() => {
      const nd = this.store.numDoc();
      this.store.liqTick();
      if (!nd) {
        this.facturasEmitidas.set([]);
        this.msgFacturas.set(null);
        return;
      }
      this.cargarFacturas(nd);
    });
  }

  alumnoNombre(): string {
    const a: any = this.store.alumno?.();
    if (!a) return '';
    return [a.nombre1, a.nombre2, a.apellido1, a.apellido2].filter(Boolean).join(' ').trim();
  }

  abrirFactura(): void {
    if (!this.store.numDoc()) {
      this.msg.set('Seleccione un alumno primero.');
      return;
    }
    this.mostrarFactura.set(true);
  }

  cerrarFactura(): void {
    this.mostrarFactura.set(false);
  }

  onFacturaEmitida(): void {
    const nd = this.store.numDoc();
    if (!nd) return;
    this.cargarFacturas(nd);
    this.store.touchLiquidacion();
  }

  toggleDetalleFactura(id: string): void {
    this.facturaDetalleAbierto.update((cur) => (cur === id ? null : id));
  }

  labelAdquirente(f: FacturaElectronicaItem): string {
    const tipo = String(f.adquirente?.tipo || 'alumno');
    const nombre = String(f.adquirente?.nombre || '').trim();
    if (tipo === 'cliente') return nombre || 'Empresa / tercero';
    return nombre || 'Alumno';
  }

  esFacturaAEmpresa(f: FacturaElectronicaItem): boolean {
    return String(f.adquirente?.tipo || '') === 'cliente';
  }

  resumenItemsFactura(f: FacturaElectronicaItem): string {
    const items = (f.items || []).map((it) => String(it.descripcion || '').trim()).filter(Boolean);
    if (!items.length) return '—';
    if (this.esFacturaAEmpresa(f) && items.length > 1) {
      return `${items.length} capacitaciones (1 ítem en factura)`;
    }
    if (items.length <= 2) return items.join(' · ');
    return `${items.slice(0, 2).join(' · ')} (+${items.length - 2})`;
  }

  participanteFactura(f: FacturaElectronicaItem): string | null {
    if (!this.esFacturaAEmpresa(f)) return null;
    const nombre = String(f.adquirente?.participanteNombre || '').trim();
    const doc = f.adquirente?.participanteNumDoc;
    if (nombre && doc) return `${nombre} (CC ${doc})`;
    if (nombre) return nombre;
    return null;
  }

  labelEstadoFactura(f: FacturaElectronicaItem): string {
    const e = String(f.estado || '');
    if (e === 'anulada') return 'Anulada';
    if (f.modoDesarrollo) return 'Desarrollo';
    if (e === 'validada') return 'Validada DIAN';
    if (e === 'rechazada') return 'Rechazada';
    if (e === 'pendiente_envio') return 'Pendiente DIAN';
    return e || '—';
  }

  claseEstadoFactura(f: FacturaElectronicaItem): string {
    const e = String(f.estado || '').toLowerCase();
    if (e === 'anulada' || e === 'rechazada') return 'badge err';
    if (f.modoDesarrollo) return 'badge warn';
    if (e === 'validada') return 'badge ok';
    if (e === 'pendiente_envio') return 'badge info';
    return 'badge';
  }

  verFacturaEmitida(f: FacturaElectronicaItem): void {
    this.feSvc.verFactura(f, (m) => this.msg.set(m));
  }

  imprimirFacturaEmitida(f: FacturaElectronicaItem): void {
    this.feSvc.abrirHtmlFactura(f._id, (m) => this.msg.set(m));
  }

  private cargarFacturas(numDoc: number | string): void {
    this.loadingFacturas.set(true);
    this.msgFacturas.set(null);
    this.feSvc.listarPorAlumno(numDoc).subscribe({
      next: (rows) => {
        this.facturasEmitidas.set(rows || []);
        this.loadingFacturas.set(false);
      },
      error: (e) => {
        this.facturasEmitidas.set([]);
        this.loadingFacturas.set(false);
        const status = e?.status ?? e?.error?.status;
        this.msgFacturas.set(
          status === 403
            ? 'Sin permiso para consultar facturas de este alumno.'
            : e?.error?.message || 'No se pudieron cargar las facturas emitidas.',
        );
      },
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
    return this.num(v).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }

  tiempoFmt(f?: string): string {
    if (!f) return '—';
    const d = new Date(f);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  }
}
