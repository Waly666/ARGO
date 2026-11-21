import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PesvPlantillasVista, PesvService } from '../../core/services/pesv.service';
import { AccionPermisoService } from '../../core/services/accion-permiso.service';
import { PesvAyudaComponent } from './pesv-ayuda.component';
import { PesvNavComponent } from './pesv-nav.component';

@Component({
  selector: 'argo-pesv-documentos',
  standalone: true,
  imports: [CommonModule, RouterLink, PesvNavComponent, PesvAyudaComponent],
  templateUrl: './pesv-documentos.component.html',
  styleUrls: ['./pesv-shared.scss'],
})
export class PesvDocumentosComponent implements OnInit {
  private pesv = inject(PesvService);
  accionPerm = inject(AccionPermisoService);

  vigencia = signal(new Date().getFullYear());
  loading = signal(true);
  generando = signal<string | null>(null);
  subiendo = signal<string | null>(null);
  msg = signal<string | null>(null);
  error = signal(false);
  vista = signal<PesvPlantillasVista | null>(null);

  ngOnInit(): void {
    this.pesv.config().subscribe({
      next: (c) => {
        if (c.vigenciaActiva) this.vigencia.set(c.vigenciaActiva);
        this.cargar();
      },
      error: () => this.cargar(),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.pesv.plantillas(this.vigencia()).subscribe({
      next: (r) => {
        this.vista.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.msg.set('No se pudieron leer las plantillas.');
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  puedeEditar(): boolean {
    return this.accionPerm.tiene('pesv', 'editar');
  }

  generar(codigo: string): void {
    if (!this.puedeEditar()) {
      this.msg.set('Sin permiso para generar documentos del PESV.');
      this.error.set(true);
      return;
    }
    this.generando.set(codigo);
    this.msg.set(null);
    this.error.set(false);
    this.pesv.generarPlantilla(codigo, this.vigencia()).subscribe({
      next: (r) => {
        this.generando.set(null);
        this.msg.set(r.aviso || `Listo: ${r.nombreArchivo}.`);
        this.cargar();
      },
      error: (e) => {
        this.generando.set(null);
        this.error.set(true);
        this.msg.set(e?.error?.message || 'No se pudo generar el documento.');
      },
    });
  }

  descargarBase(item: { codigo: string; nombre: string }): void {
    this.pesv.archivoPlantilla(item.codigo, this.vigencia(), undefined, true).subscribe({
      next: (blob) => this.bajar(blob, item.nombre),
      error: () => {
        this.error.set(true);
        this.msg.set('No se pudo descargar la base.');
      },
    });
  }

  reemplazarBase(codigo: string, ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;
    if (!this.puedeEditar()) {
      this.msg.set('Sin permiso para editar las bases del PESV.');
      this.error.set(true);
      return;
    }
    this.subiendo.set(codigo);
    this.msg.set(null);
    this.error.set(false);
    this.pesv.reemplazarBase(codigo, archivo).subscribe({
      next: (r) => {
        this.subiendo.set(null);
        this.msg.set(`Base actualizada: ${r.nombre}. Las próximas generaciones usan este archivo. Los campos entre corchetes siguen siendo los datos de la empresa.`);
      },
      error: (e) => {
        this.subiendo.set(null);
        this.error.set(true);
        this.msg.set(e?.error?.message || 'No se pudo reemplazar la base.');
      },
    });
  }

  private bajar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre || 'documento-pesv';
    a.click();
    URL.revokeObjectURL(url);
  }

  descargar(codigo: string, version?: number, nombre?: string): void {
    this.pesv.archivoPlantilla(codigo, this.vigencia(), version).subscribe({
      next: (blob) => this.bajar(blob, nombre || 'documento-pesv'),
      error: () => {
        this.error.set(true);
        this.msg.set('No se pudo descargar el archivo.');
      },
    });
  }

  fecha(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  }
}
