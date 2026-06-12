import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ConfigRespaldos,
  RespaldoMeta,
  SistemaService,
} from '../../core/services/sistema.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'argo-sistema-respaldos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sistema-respaldos.component.html',
  styleUrls: ['./sistema-respaldos.component.scss'],
})
export class SistemaRespaldosComponent implements OnInit {
  private svc = inject(SistemaService);
  private confirm = inject(ConfirmDialogService);

  respaldos = signal<RespaldoMeta[]>([]);
  config = signal<ConfigRespaldos | null>(null);
  loading = signal(true);
  creando = signal(false);
  guardandoCfg = signal(false);
  restaurando = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);

  nota = '';

  /** Respaldo seleccionado para restaurar (muestra el formulario de credenciales). */
  restaurarSel = signal<string | null>(null);
  /** Archivo externo subido para restaurar. */
  archivoSubido = signal<File | null>(null);
  password = '';
  codigoMfa = '';
  confirmacion = '';

  ngOnInit(): void {
    this.cargar();
  }

  private toast(texto: string, esError = false) {
    this.msg.set(texto);
    this.msgError.set(esError);
    if (!esError) setTimeout(() => this.msg.set(null), 6000);
  }

  cargar() {
    this.loading.set(true);
    this.svc.listarRespaldos().subscribe({
      next: (r) => {
        this.respaldos.set(r.respaldos);
        this.config.set(r.config);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.toast(e?.error?.message || 'No se pudieron cargar las copias de seguridad', true);
      },
    });
  }

  tamano(bytes: number | undefined): string {
    const b = Number(bytes) || 0;
    if (b >= 1024 * 1024 * 1024) return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(b / 1024))} KB`;
  }

  tipoEtiqueta(tipo: string): string {
    switch (tipo) {
      case 'auto': return 'Automática';
      case 'manual': return 'Manual';
      case 'pre-reset': return 'Antes de puesta en cero';
      case 'pre-restauracion': return 'Antes de restaurar';
      default: return tipo;
    }
  }

  crear() {
    this.creando.set(true);
    this.svc.crearRespaldo(this.nota).subscribe({
      next: (meta) => {
        this.creando.set(false);
        this.nota = '';
        this.toast(`Copia creada: ${meta.archivo} (${this.tamano(meta.tamano)})`);
        this.cargar();
      },
      error: (e) => {
        this.creando.set(false);
        this.toast(e?.error?.message || 'No se pudo crear la copia de seguridad', true);
      },
    });
  }

  guardarConfig() {
    const cfg = this.config();
    if (!cfg) return;
    this.guardandoCfg.set(true);
    this.svc.guardarConfigRespaldos(cfg).subscribe({
      next: (c) => {
        this.config.set(c);
        this.guardandoCfg.set(false);
        this.toast('Configuración de copias automáticas guardada.');
      },
      error: (e) => {
        this.guardandoCfg.set(false);
        this.toast(e?.error?.message || 'No se pudo guardar la configuración', true);
      },
    });
  }

  patchConfig<K extends keyof ConfigRespaldos>(k: K, v: ConfigRespaldos[K]) {
    const cfg = this.config();
    if (cfg) this.config.set({ ...cfg, [k]: v });
  }

  descargar(r: RespaldoMeta) {
    this.toast(`Preparando descarga de ${r.archivo}…`);
    this.svc.descargarRespaldo(r.archivo).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = r.archivo;
        a.click();
        URL.revokeObjectURL(url);
        this.toast(`Descarga iniciada: ${r.archivo}`);
      },
      error: () => this.toast('No se pudo descargar la copia', true),
    });
  }

  async eliminar(r: RespaldoMeta) {
    const ok = await this.confirm.open({
      title: 'Eliminar copia de seguridad',
      message: `¿Eliminar la copia «${r.archivo}»? Esta acción no se puede deshacer.`,
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.eliminarRespaldo(r.archivo).subscribe({
      next: () => {
        this.toast('Copia eliminada.');
        this.cargar();
      },
      error: (e) => this.toast(e?.error?.message || 'No se pudo eliminar', true),
    });
  }

  abrirRestaurar(r: RespaldoMeta) {
    this.archivoSubido.set(null);
    this.restaurarSel.set(this.restaurarSel() === r.archivo ? null : r.archivo);
    this.limpiarCredenciales();
  }

  onArchivoSubido(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0] || null;
    this.archivoSubido.set(file);
    this.restaurarSel.set(null);
    this.limpiarCredenciales();
  }

  private limpiarCredenciales() {
    this.password = '';
    this.codigoMfa = '';
    this.confirmacion = '';
  }

  puedeRestaurar(): boolean {
    return (
      !!this.password &&
      this.confirmacion.trim().toUpperCase() === 'RESTAURAR' &&
      !this.restaurando()
    );
  }

  restaurar() {
    const cred = {
      password: this.password,
      codigoMfa: this.codigoMfa,
      confirmacion: this.confirmacion,
    };
    const archivo = this.restaurarSel();
    const subido = this.archivoSubido();
    if (!archivo && !subido) return;

    this.restaurando.set(true);
    const obs = subido
      ? this.svc.restaurarSubido(subido, cred)
      : this.svc.restaurarRespaldo(archivo!, cred);

    obs.subscribe({
      next: (r) => {
        this.restaurando.set(false);
        this.restaurarSel.set(null);
        this.archivoSubido.set(null);
        this.limpiarCredenciales();
        this.toast(
          r.mensaje ||
            `Restauración completada: ${r.docsRestaurados} documentos y ${r.archivosRestaurados} archivos.`,
        );
        this.cargar();
      },
      error: (e) => {
        this.restaurando.set(false);
        this.toast(e?.error?.message || 'La restauración falló', true);
      },
    });
  }
}
