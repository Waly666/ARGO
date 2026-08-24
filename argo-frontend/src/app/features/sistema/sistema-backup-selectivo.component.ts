import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  GrupoRespaldoSelectivo,
  ProgresoOperacion,
  RespaldoMeta,
  SistemaService,
} from '../../core/services/sistema.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { BackupResetRestoreNavComponent } from './backup-reset-restore-nav.component';

@Component({
  selector: 'argo-sistema-backup-selectivo',
  standalone: true,
  imports: [CommonModule, FormsModule, BackupResetRestoreNavComponent],
  templateUrl: './sistema-backup-selectivo.component.html',
  styleUrls: ['./sistema-backup-selectivo.component.scss'],
})
export class SistemaBackupSelectivoComponent implements OnInit, OnDestroy {
  private svc = inject(SistemaService);
  private confirm = inject(ConfirmDialogService);

  grupos = signal<GrupoRespaldoSelectivo[]>([]);
  fraseRestaurar = signal('RESTAURAR SELECTIVO');
  seleccion = signal<Record<string, boolean>>({});
  respaldos = signal<RespaldoMeta[]>([]);
  loading = signal(true);
  creando = signal(false);
  restaurando = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);
  progreso = signal<ProgresoOperacion | null>(null);

  nota = '';
  restaurarSel = signal<string | null>(null);
  archivoSubido = signal<File | null>(null);
  password = '';
  codigoMfa = '';
  confirmacion = '';

  private pollId: ReturnType<typeof setInterval> | null = null;

  seleccionadas = computed(() => {
    const sel = this.seleccion();
    return Object.keys(sel).filter((k) => sel[k]);
  });

  totalSeleccionadas = computed(() => this.seleccionadas().length);

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  private iniciarPolling() {
    this.detenerPolling();
    this.progreso.set(null);
    this.pollId = setInterval(() => {
      this.svc.progresoRespaldoSelectivo().subscribe({
        next: (p) => this.progreso.set(p),
        error: () => {},
      });
    }, 700);
  }

  private detenerPolling() {
    if (this.pollId) {
      clearInterval(this.pollId);
      this.pollId = null;
    }
  }

  private toast(texto: string, esError = false) {
    this.msg.set(texto);
    this.msgError.set(esError);
    if (!esError) setTimeout(() => this.msg.set(null), 7000);
  }

  cargar() {
    this.loading.set(true);
    this.svc.metaRespaldoSelectivo().subscribe({
      next: (meta) => {
        this.grupos.set(meta.grupos || []);
        this.fraseRestaurar.set(meta.fraseRestaurar || 'RESTAURAR SELECTIVO');
        const inicial: Record<string, boolean> = { ...this.seleccion() };
        for (const g of meta.grupos || []) {
          for (const c of g.colecciones) {
            if (inicial[c.nombre] === undefined) inicial[c.nombre] = false;
          }
        }
        this.seleccion.set(inicial);
      },
      error: (e) => this.toast(e?.error?.message || 'No se pudo cargar el catálogo de tablas', true),
    });
    this.svc.listarRespaldosSelectivos().subscribe({
      next: (r) => {
        this.respaldos.set(r.respaldos);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.toast(e?.error?.message || 'No se pudieron cargar los respaldos selectivos', true);
      },
    });
  }

  tamano(bytes: number | undefined): string {
    const b = Number(bytes) || 0;
    if (b >= 1024 * 1024 * 1024) return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(b / 1024))} KB`;
  }

  estaSeleccionada(nombre: string): boolean {
    return !!this.seleccion()[nombre];
  }

  toggleTabla(nombre: string, valor: boolean) {
    this.seleccion.update((s) => ({ ...s, [nombre]: valor }));
  }

  toggleGrupo(grupo: GrupoRespaldoSelectivo, valor: boolean) {
    this.seleccion.update((s) => {
      const next = { ...s };
      for (const c of grupo.colecciones) next[c.nombre] = valor;
      return next;
    });
  }

  grupoCompleto(grupo: GrupoRespaldoSelectivo): boolean {
    return grupo.colecciones.every((c) => this.estaSeleccionada(c.nombre));
  }

  grupoParcial(grupo: GrupoRespaldoSelectivo): boolean {
    const alguna = grupo.colecciones.some((c) => this.estaSeleccionada(c.nombre));
    return alguna && !this.grupoCompleto(grupo);
  }

  seleccionarTodas() {
    this.seleccion.update((s) => {
      const next = { ...s };
      for (const k of Object.keys(next)) next[k] = true;
      return next;
    });
  }

  limpiarSeleccion() {
    this.seleccion.update((s) => {
      const next = { ...s };
      for (const k of Object.keys(next)) next[k] = false;
      return next;
    });
  }

  crear() {
    const colecciones = this.seleccionadas();
    if (!colecciones.length) {
      this.toast('Seleccione al menos una tabla', true);
      return;
    }
    this.creando.set(true);
    this.iniciarPolling();
    this.svc.crearRespaldoSelectivo(colecciones, this.nota).subscribe({
      next: (meta) => {
        this.creando.set(false);
        this.detenerPolling();
        this.progreso.set(null);
        this.nota = '';
        this.toast(`Respaldo selectivo creado: ${meta.archivo}`);
        this.cargar();
      },
      error: (e) => {
        this.creando.set(false);
        this.detenerPolling();
        this.progreso.set(null);
        this.toast(e?.error?.message || 'No se pudo crear el respaldo selectivo', true);
      },
    });
  }

  descargar(r: RespaldoMeta) {
    this.svc.descargarRespaldoSelectivo(r.archivo).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = r.archivo;
        a.click();
        URL.revokeObjectURL(url);
        this.toast(`Descarga iniciada: ${r.archivo}`);
      },
      error: () => this.toast('No se pudo descargar', true),
    });
  }

  async eliminar(r: RespaldoMeta) {
    const ok = await this.confirm.open({
      title: 'Eliminar respaldo selectivo',
      message: `¿Eliminar «${r.archivo}»?`,
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.eliminarRespaldoSelectivo(r.archivo).subscribe({
      next: () => {
        this.toast('Respaldo eliminado.');
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
      this.confirmacion.trim().toUpperCase() === this.fraseRestaurar().toUpperCase() &&
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
    this.iniciarPolling();
    const obs = subido
      ? this.svc.restaurarSubidoSelectivo(subido, cred)
      : this.svc.restaurarRespaldoSelectivo(archivo!, cred);

    obs.subscribe({
      next: (r) => {
        this.restaurando.set(false);
        this.detenerPolling();
        this.progreso.set(null);
        this.restaurarSel.set(null);
        this.archivoSubido.set(null);
        this.limpiarCredenciales();
        this.toast(
          r.mensaje ||
            `Restauración selectiva: ${r.docsRestaurados} documentos en ${r.colecciones} tablas.`,
        );
        this.cargar();
      },
      error: (e) => {
        this.restaurando.set(false);
        this.detenerPolling();
        this.progreso.set(null);
        this.toast(e?.error?.message || 'La restauración selectiva falló', true);
      },
    });
  }
}
