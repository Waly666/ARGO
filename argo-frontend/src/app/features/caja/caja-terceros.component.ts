import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CatalogoService, MunicipioDivipola } from '../../core/services/catalogo.service';
import { Tercero, TerceroCatalogos, TerceroService } from '../../core/services/tercero.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { MunicipioBuscarComponent } from '../alumnos/municipio-buscar.component';
import { CelularInputComponent } from '../../shared/celular-input/celular-input.component';
import { mensajeErrorCelularAlmacenado } from '../../core/utils/celular.util';

@Component({
  selector: 'argo-caja-terceros',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MunicipioBuscarComponent, CelularInputComponent],
  templateUrl: './caja-terceros.component.html',
  styleUrls: ['./caja-terceros.component.scss', '../config/config-clientes.component.scss'],
})
export class CajaTercerosComponent implements OnInit {
  private svc = inject(TerceroService);
  private catSvc = inject(CatalogoService);
  private confirm = inject(ConfirmDialogService);

  @ViewChild('formPanel') formPanel?: ElementRef<HTMLElement>;
  @ViewChild('pageHead') pageHead?: ElementRef<HTMLElement>;

  loading = signal(true);
  saving = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);

  terceros = signal<Tercero[]>([]);
  filtro = signal('');
  catalogos = signal<TerceroCatalogos | null>(null);

  formAbierto = signal(false);
  editId = signal<string | null>(null);
  form = signal<Tercero>(this.vacio());
  municipioTexto = signal('');

  private vacio(): Tercero {
    return {
      identificationDocumentCode: '13',
      identificacion: '',
      dv: '',
      legalOrganizationCode: '2',
      razonSocial: '',
      nombreComercial: '',
      nombres: '',
      tributeCode: 'ZZ',
      responsabilidadFiscal: 'R-99-PN',
      direccion: '',
      correo: '',
      telefono: '',
      municipioCodigo: '',
      municipioNombre: '',
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
        this.terceros.set(rows || []);
        this.loading.set(false);
      },
      error: () => {
        this.terceros.set([]);
        this.loading.set(false);
      },
    });
  }

  patch(p: Partial<Tercero>): void {
    this.form.set({ ...this.form(), ...p });
  }

  nuevo(): void {
    this.editId.set(null);
    this.form.set(this.vacio());
    this.municipioTexto.set('');
    this.msg.set(null);
    this.formAbierto.set(true);
    this.scrollAlFormulario();
  }

  editar(t: Tercero): void {
    this.editId.set(t._id || null);
    this.form.set({ ...this.vacio(), ...t });
    this.municipioTexto.set(t.municipioNombre || '');
    this.normalizarMunicipio(t);
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

  onMunicipio(m: MunicipioDivipola): void {
    this.municipioTexto.set(m.label || m.nombreMunicipio);
    this.patch({
      municipioCodigo: m.codMunicipio,
      municipioNombre: m.nombreMunicipio,
    });
  }

  onMunicipioLimpiado(): void {
    this.municipioTexto.set('');
    this.patch({ municipioCodigo: '', municipioNombre: '' });
  }

  onMunicipioTexto(v: string): void {
    this.municipioTexto.set(v);
    if (!v.trim()) {
      this.patch({ municipioCodigo: '', municipioNombre: '' });
    }
  }

  private normalizarMunicipio(t: Tercero): void {
    const cod = String(t.municipioCodigo || '').trim();
    if (cod && /^\d{5}$/.test(cod) && !t.municipioNombre) {
      this.catSvc.municipioPorCodigo(cod).subscribe({
        next: (m) => {
          if (!m) return;
          this.municipioTexto.set(m.label || m.nombreMunicipio);
          this.patch({ municipioNombre: m.nombreMunicipio });
        },
      });
    }
  }

  onTipoIdentificacion(code: string): void {
    this.patch({ identificationDocumentCode: code });
    if (code !== '31') this.patch({ dv: '' });
  }

  onOrganizacion(code: string): void {
    this.patch({ legalOrganizationCode: code });
    if (code === '1') {
      this.patch({ nombres: '' });
      if (!this.form().identificationDocumentCode || this.form().identificationDocumentCode === '13') {
        this.patch({ identificationDocumentCode: '31' });
      }
    } else {
      this.patch({ razonSocial: '', nombreComercial: '' });
      if (this.form().identificationDocumentCode === '31') {
        this.patch({ identificationDocumentCode: '13', dv: '' });
      }
    }
  }

  guardar(): void {
    const f = this.form();
    if (!String(f.identificacion || '').trim()) {
      this.msgError.set(true);
      this.msg.set('La identificación es obligatoria.');
      return;
    }
    const nombre = this.esJuridica()
      ? String(f.razonSocial || '').trim()
      : String(f.nombres || '').trim();
    if (!nombre) {
      this.msgError.set(true);
      this.msg.set(this.esJuridica() ? 'Indique la razón social.' : 'Indique nombres y apellidos.');
      return;
    }
    const errTel = mensajeErrorCelularAlmacenado(f.telefono, 'telefono');
    if (errTel) {
      this.msgError.set(true);
      this.msg.set(errTel);
      return;
    }
    this.saving.set(true);
    const obs = this.editId() ? this.svc.actualizar(this.editId()!, f) : this.svc.crear(f);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.formAbierto.set(false);
        this.msgError.set(false);
        this.msg.set('Tercero guardado');
        this.recargar();
      },
      error: (e) => {
        this.saving.set(false);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo guardar el tercero');
      },
    });
  }

  async eliminar(t: Tercero): Promise<void> {
    if (!t._id) return;
    const ok = await this.confirm.open({
      title: 'Desactivar tercero',
      message: `¿Desactivar «${t.nombre || t.identificacion}»?`,
      confirmLabel: 'Desactivar',
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.eliminar(t._id).subscribe({ next: () => this.recargar() });
  }

  esJuridica(): boolean {
    return String(this.form().legalOrganizationCode || '2') === '1';
  }

  esNit(): boolean {
    return String(this.form().identificationDocumentCode || '') === '31';
  }
}
