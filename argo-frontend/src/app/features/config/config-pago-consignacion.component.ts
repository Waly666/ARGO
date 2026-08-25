import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  ConfigPagoConsignacion,
  MedioPagoConsignacion,
  PasarelaService,
} from '../../core/services/pasarela.service';
import { AulaVirtualAdminService } from '../../core/services/aula-virtual-admin.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import { ArgoSwitchComponent } from '../../shared/argo-switch/argo-switch.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'argo-config-pago-consignacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ArgoSwitchComponent],
  templateUrl: './config-pago-consignacion.component.html',
  styleUrls: ['./config-pago-consignacion.component.scss', './config-pasarela.component.scss'],
})
export class ConfigPagoConsignacionComponent implements OnInit {
  private pasSvc = inject(PasarelaService);
  private catSvc = inject(CatalogoService);
  private aulaSvc = inject(AulaVirtualAdminService);

  form = signal<ConfigPagoConsignacion>({ activo: false, medios: [], textos: {}, enviarCorreosAlumno: true });
  emailConfirmacionPortal = signal('');
  cuentas = signal<Record<string, unknown>[]>([]);
  tiposPago = signal<Record<string, unknown>[]>([]);
  loading = signal(true);
  saving = signal(false);
  uploadingMedio = signal<string | null>(null);
  msg = signal<string | null>(null);
  msgError = signal(false);

  ngOnInit(): void {
    this.catSvc.list('cuentasBancarias', { refresh: true }).subscribe({
      next: (rows) => this.cuentas.set(rows || []),
    });
    this.catSvc.list('catTipoPago', { refresh: true }).subscribe({
      next: (rows) => this.tiposPago.set(rows || []),
    });
    this.aulaSvc.obtenerPortal().subscribe({
      next: (p) => this.emailConfirmacionPortal.set(String(p.emailConfirmacion || '').trim()),
      error: () => this.emailConfirmacionPortal.set(''),
    });
    this.pasSvc.obtenerConfigConsignacion().subscribe({
      next: (c) => {
        this.form.set({
          ...c,
          enviarCorreosAlumno: c.enviarCorreosAlumno !== false,
          medios: c.medios?.length ? c.medios : [],
          textos: c.textos || {},
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.msgError.set(true);
        this.msg.set('No se pudo cargar la configuración de consignación.');
      },
    });
  }

  patch<K extends keyof ConfigPagoConsignacion>(key: K, value: ConfigPagoConsignacion[K]): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  patchTexto(key: string, value: string): void {
    this.form.update((f) => ({
      ...f,
      textos: { ...(f.textos || {}), [key]: value },
    }));
  }

  labelCuenta(c: Record<string, unknown>): string {
    const banco = String(c['banco'] || '').trim();
    const tipo = String(c['tipo'] || '').trim();
    const num = String(c['numCuenta'] ?? c['llave'] ?? '').trim();
    return [banco, tipo, num].filter(Boolean).join(' — ') || 'Cuenta';
  }

  cuentaValor(c: Record<string, unknown>): string {
    return String(c['idCuentaBancaria'] ?? c['idCuenta'] ?? c['_id'] ?? '');
  }

  qrUrl(rel?: string | null): string {
    const r = String(rel || '').trim();
    if (!r) return '';
    if (r.startsWith('http')) return r;
    return `${environment.apiUrl.replace(/\/api\/?$/, '')}/uploads/${r.replace(/^\/+/, '')}`;
  }

  agregarMedio(): void {
    const id = crypto.randomUUID();
    this.form.update((f) => ({
      ...f,
      medios: [
        ...(f.medios || []),
        {
          id,
          etiqueta: `Medio ${(f.medios?.length || 0) + 1}`,
          idCuentaBancaria: '',
          urlQr: '',
          activo: true,
          orden: f.medios?.length || 0,
        },
      ],
    }));
  }

  quitarMedio(id: string): void {
    this.form.update((f) => ({
      ...f,
      medios: (f.medios || []).filter((m) => m.id !== id),
    }));
  }

  patchMedio(id: string, patch: Partial<MedioPagoConsignacion>): void {
    this.form.update((f) => ({
      ...f,
      medios: (f.medios || []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }

  onQrSelected(medioId: string, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingMedio.set(medioId);
    this.pasSvc.subirQrConsignacion(medioId, file).subscribe({
      next: (res) => {
        this.form.set(res.config);
        this.uploadingMedio.set(null);
        this.msgError.set(false);
        this.msg.set('Imagen QR cargada.');
        input.value = '';
      },
      error: (e) => {
        this.uploadingMedio.set(null);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo subir el QR.');
        input.value = '';
      },
    });
  }

  guardar(): void {
    this.saving.set(true);
    this.msg.set(null);
    this.msgError.set(false);
    this.pasSvc.guardarConfigConsignacion(this.form()).subscribe({
      next: (c) => {
        this.form.set(c);
        this.saving.set(false);
        this.msg.set('Configuración de consignación guardada.');
      },
      error: (e) => {
        this.saving.set(false);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo guardar.');
      },
    });
  }
}
