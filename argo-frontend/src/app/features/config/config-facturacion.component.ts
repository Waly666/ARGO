import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ConfigFacturacion, ConfigService } from '../../core/services/config.service';
import { FacturacionService } from '../../core/services/facturacion.service';

@Component({
  selector: 'argo-config-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-facturacion.component.html',
  styleUrls: ['./config-facturacion.component.scss'],
})
export class ConfigFacturacionComponent implements OnInit {
  private cfgSvc = inject(ConfigService);
  private feSvc = inject(FacturacionService);

  loading = signal(true);
  saving = signal(false);
  probando = signal(false);
  msg = signal<string | null>(null);
  pruebaMsg = signal<string | null>(null);
  pruebaOk = signal(true);

  catalogos = signal<{ proveedores: { id: string; label: string }[]; ambientes: { id: string; label: string }[]; modosEmision: { id: string; label: string }[] }>({
    proveedores: [],
    ambientes: [],
    modosEmision: [],
  });

  form = signal<
    ConfigFacturacion & { clientSecret?: string; password?: string }
  >({
    proveedor: 'stub',
    ambiente: 'sandbox',
    modoEmision: 'manual',
    valorIncluyeIva: true,
    sendEmail: true,
    activo: false,
  });

  esFactus = computed(() => this.form().proveedor === 'factus');

  ngOnInit(): void {
    this.feSvc.catalogos().subscribe({
      next: (c) => this.catalogos.set(c),
      error: () => {},
    });
    this.cfgSvc.obtenerFacturacion().subscribe({
      next: (c) => {
        this.form.set({ ...c, clientSecret: '', password: '' });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.msg.set('No se pudo cargar la configuración');
      },
    });
  }

  patch<K extends keyof (ConfigFacturacion & { clientSecret?: string; password?: string })>(
    k: K,
    v: (ConfigFacturacion & { clientSecret?: string; password?: string })[K],
  ): void {
    this.form.update((f) => ({ ...f, [k]: v }));
  }

  guardar(): void {
    this.saving.set(true);
    this.msg.set(null);
    const f = this.form();
    const payload: Partial<ConfigFacturacion> & { clientSecret?: string; password?: string } = {
      proveedor: f.proveedor,
      ambiente: f.ambiente,
      baseUrl: f.baseUrl,
      clientId: f.clientId,
      username: f.username,
      numberingRangeId: f.numberingRangeId,
      modoEmision: f.modoEmision,
      valorIncluyeIva: f.valorIncluyeIva,
      sendEmail: f.sendEmail,
      activo: f.activo,
      emisorNit: f.emisorNit,
      emisorDv: f.emisorDv,
      emisorRazonSocial: f.emisorRazonSocial,
      emisorResponsabilidadFiscal: f.emisorResponsabilidadFiscal,
      emisorRegimen: f.emisorRegimen,
      emisorActividadEconomica: f.emisorActividadEconomica,
      emisorMunicipioCodigo: f.emisorMunicipioCodigo,
      ivaPorDefecto: f.ivaPorDefecto,
      prefijoDesarrollo: f.prefijoDesarrollo,
    };
    if (f.clientSecret?.trim()) payload.clientSecret = f.clientSecret.trim();
    if (f.password?.trim()) payload.password = f.password.trim();

    this.cfgSvc.guardarFacturacion(payload).subscribe({
      next: (c) => {
        this.form.set({ ...c, clientSecret: '', password: '' });
        this.saving.set(false);
        this.msg.set('Configuración guardada.');
      },
      error: (e) => {
        this.saving.set(false);
        this.msg.set(e?.error?.message || 'Error al guardar');
      },
    });
  }

  probar(): void {
    this.probando.set(true);
    this.pruebaMsg.set(null);
    this.cfgSvc.probarFacturacion().subscribe({
      next: (r) => {
        this.probando.set(false);
        this.pruebaOk.set(!!r.ok);
        this.pruebaMsg.set(r.message);
      },
      error: (e) => {
        this.probando.set(false);
        this.pruebaOk.set(false);
        this.pruebaMsg.set(e?.error?.message || 'Error de conexión');
      },
    });
  }
}
