import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
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

  stats = computed(() => {
    const rows = this.gestores();
    const empresas = rows.filter((g) => this.esEmpresa(g)).length;
    const conCredito = rows.filter((g) => (g.creditoDiario ?? 0) > 0).length;
    return {
      total: rows.length,
      naturales: rows.length - empresas,
      empresas,
      conCredito,
    };
  });

  creditoIlimitado = computed(() => (this.form().creditoDiario ?? 0) <= 0);

  formAbierto = signal(false);
  editId = signal<string | null>(null);
  form = signal<Gestor>(this.vacio());
  fotoFile = signal<File | null>(null);
  fotoPreview = signal<string | null>(null);

  private vacio(): Gestor {
    return {
      tipoGestor: 'persona_natural',
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
      creditoDiario: 0,
    };
  }

  esEmpresa(f: Gestor): boolean {
    return (f.tipoGestor || 'persona_natural') === 'empresa';
  }

  labelTipoGestor(g: Gestor): string {
    return this.esEmpresa(g) ? 'Empresa' : 'Persona natural';
  }

  labelCredito(g: Gestor): string {
    const v = g.creditoDiario ?? 0;
    return v > 0 ? this.formatCredito(v) : 'Ilimitado';
  }

  creditoLimitado(g: Gestor): boolean {
    return (g.creditoDiario ?? 0) > 0;
  }

  formatCredito(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor || 0);
  }

  setCreditoIlimitado(ilimitado: boolean): void {
    this.patch({ creditoDiario: ilimitado ? 0 : 500000 });
  }

  onCreditoDiarioInput(raw: string | number): void {
    const n = Math.max(0, Math.round(Number(raw) || 0));
    this.patch({ creditoDiario: n });
  }

  onTipoGestorChange(tipo: 'persona_natural' | 'empresa'): void {
    const f = this.form();
    this.patch({
      tipoGestor: tipo,
      tipoDoc: tipo === 'empresa' ? 'NIT' : f.tipoDoc === 'NIT' ? 'CC' : f.tipoDoc || 'CC',
      ...(tipo === 'empresa' ? { apellidos: '' } : {}),
    });
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
    if (this.esEmpresa(g)) {
      return String(g.nombres || '').trim().slice(0, 2).toUpperCase() || '?';
    }
    const n = String(g.nombres || '').trim()[0] || '';
    const a = String(g.apellidos || '').trim()[0] || '';
    return (n + a).toUpperCase() || '?';
  }

  guardar(): void {
    const f = this.form();
    const empresa = this.esEmpresa(f);
    if (!String(f.nombres || '').trim()) {
      this.msgError.set(true);
      this.msg.set(empresa ? 'La razón social es obligatoria.' : 'Los nombres son obligatorios.');
      return;
    }
    if (!empresa && !String(f.apellidos || '').trim()) {
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
