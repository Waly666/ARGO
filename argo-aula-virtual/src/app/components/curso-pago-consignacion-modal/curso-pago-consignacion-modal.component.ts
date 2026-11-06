import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';

import { AulaApiService } from '../../core/aula-api.service';
import {
  CursoVirtual,
  EstadoConsignacionCurso,
  MedioPagoConsignacionPublico,
} from '../../core/models';
import { resolveUploadUrl } from '../../core/upload-url.util';

@Component({
  selector: 'av-curso-pago-consignacion-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './curso-pago-consignacion-modal.component.html',
  styleUrl: './curso-pago-consignacion-modal.component.scss',
})
export class CursoPagoConsignacionModalComponent {
  private api = inject(AulaApiService);

  curso = input.required<CursoVirtual>();
  consignacion = input.required<EstadoConsignacionCurso>();
  montoCop = input<number | null>(null);

  closed = output<void>();
  actualizado = output<void>();

  msg = signal('');
  medioConsignacion = signal<MedioPagoConsignacionPublico | null>(null);
  referenciaConsignacion = signal('');
  archivoConsignacion = signal<File | null>(null);
  enviandoConsignacion = signal(false);

  cerrar(): void {
    this.medioConsignacion.set(null);
    this.referenciaConsignacion.set('');
    this.archivoConsignacion.set(null);
    this.msg.set('');
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
    this.closed.emit();
  }

  abrir(): void {
    this.medioConsignacion.set(null);
    this.referenciaConsignacion.set('');
    this.archivoConsignacion.set(null);
    this.msg.set('');
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  elegirMedioConsignacion(medio: MedioPagoConsignacionPublico): void {
    this.medioConsignacion.set(medio);
    this.msg.set('');
  }

  volverMediosConsignacion(): void {
    this.medioConsignacion.set(null);
    this.referenciaConsignacion.set('');
    this.archivoConsignacion.set(null);
    this.msg.set('');
  }

  onComprobanteConsignacion(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.archivoConsignacion.set(input.files?.[0] || null);
  }

  enviarSolicitudConsignacion(): void {
    const c = this.curso();
    const medio = this.medioConsignacion();
    const ref = this.referenciaConsignacion().trim();
    const archivo = this.archivoConsignacion();
    if (!c || !medio || this.enviandoConsignacion()) return;

    if (!ref) {
      this.msg.set('Indique la referencia bancaria de la consignación.');
      return;
    }
    if (!archivo) {
      this.msg.set('Adjunte la foto del comprobante de pago.');
      return;
    }

    this.enviandoConsignacion.set(true);
    this.msg.set('');
    this.api.enviarSolicitudConsignacion(c.idPrograma, medio.id, ref, archivo).subscribe({
      next: (res) => {
        this.enviandoConsignacion.set(false);
        this.msg.set(res.message || 'Solicitud enviada. Está en revisión.');
        this.actualizado.emit();
        this.cerrar();
      },
      error: (e) => {
        this.enviandoConsignacion.set(false);
        this.msg.set(e?.error?.message || 'No se pudo enviar la solicitud.');
      },
    });
  }

  qrConsignacionUrl(url?: string | null): string | null {
    return resolveUploadUrl(url);
  }

  textoConsignacion(clave: keyof NonNullable<EstadoConsignacionCurso['textos']>, fallback: string): string {
    return this.consignacion()?.textos?.[clave] || fallback;
  }

  pasoConsignacion(): 1 | 2 {
    return this.medioConsignacion() ? 2 : 1;
  }

  iconoMedioConsignacion(etiqueta?: string | null): string {
    const t = String(etiqueta || '').toLowerCase();
    if (t.includes('nequi')) return 'N';
    if (t.includes('davi')) return 'D';
    if (t.includes('bancolombia') || t.includes('banco')) return 'B';
    if (t.includes('pse')) return 'P';
    return '$';
  }

  fmtPrecio(n: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n || 0);
  }

  totalPagar(): number {
    const c = this.curso();
    const m = this.montoCop();
    if (m != null && m > 0) return m;
    const saldo = c.pago?.saldo;
    if (saldo != null && saldo > 0) return saldo;
    return c.matricula?.tarifa ?? c.tarifaVirtual ?? 0;
  }
}
