import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import { Gestor, GestorCatalogos, GestorService } from '../../core/services/gestor.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { CelularInputComponent } from '../../shared/celular-input/celular-input.component';
import { CorreoInputComponent } from '../../shared/correo-input/correo-input.component';
import { mensajeErrorCelularAlmacenado } from '../../core/utils/celular.util';
import { mensajeErrorCorreoAlmacenado } from '../../core/utils/correo.util';

@Component({
  selector: 'argo-caja-gestores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CelularInputComponent, CorreoInputComponent],
  templateUrl: './caja-gestores.component.html',
  styleUrls: ['./caja-gestores.component.scss', '../config/config-clientes.component.scss'],
})
export class CajaGestoresComponent implements OnInit {
  private svc = inject(GestorService);
  private confirm = inject(ConfirmDialogService);
  private uploads = environment.uploadsUrl;

  @ViewChild('formPanel') formPanel?: ElementRef<HTMLElement>;
  @ViewChild('pageHead') pageHead?: ElementRef<HTMLElement>;

  loading = signal(true);
  saving = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);

  gestores = signal<Gestor[]>([]);
  filtro = signal('');
  catalogos = signal<GestorCatalogos | null>(null);

  formAbierto = signal(false);
  editId = signal<string | null>(null);
  form = signal<Gestor>(this.vacio());
  fotoFile = signal<File | null>(null);
  fotoPreview = signal<string | null>(null);

  private vacio(): Gestor {
    return {
      nombres: '',
      apellidos: '',
      tipoDoc: 'CC',
      numero: '',
      correo: '',
      celular: '',
      direccion: '',
      seudonimo: '',
      foto: '',
      activo: true,
    };
  }

  ngOnInit(): void {
    this.svc.catalogos().subscribe({
      next: (c) => this.catalogos.set(c),
      error: () => this.catalogos.set(null),
    });
    this.recargar();
  }

  recargar(): void {
    this.loading.set(true);
    this.svc.listar(this.filtro()).subscribe({
      next: (rows) => {
        this.gestores.set(rows || []);
        this.loading.set(false);
      },
      error: () => {
        this.gestores.set([]);
        this.loading.set(false);
      },
    });
  }

  patch(p: Partial<Gestor>): void {
    this.form.set({ ...this.form(), ...p });
  }

  nuevo(): void {
    this.editId.set(null);
    this.form.set(this.vacio());
    this.fotoFile.set(null);
    this.fotoPreview.set(null);
    this.msg.set(null);
    this.formAbierto.set(true);
    this.scrollAlFormulario();
  }

  editar(g: Gestor): void {
    this.editId.set(g._id || null);
    this.form.set({ ...this.vacio(), ...g });
    this.fotoFile.set(null);
    this.fotoPreview.set(this.fotoUrl(g.foto));
    this.msg.set(null);
    this.formAbierto.set(true);
    this.scrollAlFormulario();
  }

  cerrar(): void {
    this.formAbierto.set(false);
  }

  private scrollAlFormulario(): void {
    queueMicrotask(() => {
      const el = this.formPanel?.nativeElement ?? this.pageHead?.nativeElement;
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  onFotoChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.fotoFile.set(file);
    if (!file) {
      this.fotoPreview.set(this.fotoUrl(this.form().foto));
      return;
    }
    const r = new FileReader();
    r.onload = () => this.fotoPreview.set(r.result as string);
    r.readAsDataURL(file);
  }

  fotoUrl(f?: string): string | null {
    if (!f) return null;
    if (f.startsWith('http')) return f;
    return `${this.uploads}/${f}`;
  }

  nombreCompleto(g: Gestor): string {
    return g.nombreCompleto || [g.nombres, g.apellidos].filter(Boolean).join(' ').trim();
  }

  iniciales(g: Gestor): string {
    const n = String(g.nombres || '').trim()[0] || '';
    const a = String(g.apellidos || '').trim()[0] || '';
    return (n + a).toUpperCase() || '?';
  }

  guardar(): void {
    const f = this.form();
    if (!String(f.nombres || '').trim()) {
      this.msgError.set(true);
      this.msg.set('Los nombres son obligatorios.');
      return;
    }
    if (!String(f.apellidos || '').trim()) {
      this.msgError.set(true);
      this.msg.set('Los apellidos son obligatorios.');
      return;
    }
    if (!String(f.numero || '').trim()) {
      this.msgError.set(true);
      this.msg.set('El número de documento es obligatorio.');
      return;
    }
    const errCorreo = mensajeErrorCorreoAlmacenado(f.correo);
    if (errCorreo) {
      this.msgError.set(true);
      this.msg.set(errCorreo);
      return;
    }
    const errCel = mensajeErrorCelularAlmacenado(f.celular, 'celular');
    if (errCel) {
      this.msgError.set(true);
      this.msg.set(errCel);
      return;
    }
    this.saving.set(true);
    const files = this.fotoFile() ? { foto: this.fotoFile()! } : undefined;
    const obs = this.editId()
      ? this.svc.actualizar(this.editId()!, f, files)
      : this.svc.crear(f, files);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.formAbierto.set(false);
        this.msgError.set(false);
        this.msg.set('Gestor guardado');
        this.fotoFile.set(null);
        this.recargar();
      },
      error: (e) => {
        this.saving.set(false);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo guardar el gestor');
      },
    });
  }

  async eliminar(g: Gestor): Promise<void> {
    if (!g._id) return;
    const ok = await this.confirm.open({
      title: 'Eliminar gestor',
      message: `¿Eliminar «${this.nombreCompleto(g)}»?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.eliminar(g._id).subscribe({
      next: () => {
        this.msgError.set(false);
        this.msg.set('Gestor eliminado');
        this.recargar();
      },
      error: (e) => {
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo eliminar el gestor');
      },
    });
  }
}
