import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ConfigRecibo, ConfigService } from '../../core/services/config.service';

@Component({
  selector: 'argo-config-recibos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-recibos.component.html',
  styleUrls: ['./config-recibos.component.scss'],
})
export class ConfigRecibosComponent implements OnInit {
  private cfgSvc = inject(ConfigService);

  form = signal<ConfigRecibo>({});
  saving = signal(false);
  msg = signal<string | null>(null);

  ngOnInit(): void {
    this.cfgSvc.obtenerRecibo().subscribe({
      next: (c) => this.form.set({ ...c }),
      error: () => this.msg.set('No se pudo cargar la configuración'),
    });
  }

  patch<K extends keyof ConfigRecibo>(k: K, v: ConfigRecibo[K]) {
    this.form.update((f) => ({ ...f, [k]: v }));
  }

  guardar() {
    this.saving.set(true);
    this.msg.set(null);
    this.cfgSvc.guardarRecibo(this.form()).subscribe({
      next: (c) => {
        this.form.set(c);
        this.saving.set(false);
        this.msg.set('Configuración guardada.');
      },
      error: (e) => {
        this.saving.set(false);
        this.msg.set(e?.error?.message || 'Error al guardar');
      },
    });
  }
}
