import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Combo, ComboService } from '../../core/services/combo.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import { CatalogoEnumBuscarComponent, EnumBuscarOption } from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';

type Modo = 'lista' | 'form';

@Component({
  selector: 'argo-combos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, CatalogoEnumBuscarComponent],
  templateUrl: './combos-admin.component.html',
  styleUrls: ['./combos-admin.component.scss'],
})
export class CombosAdminComponent implements OnInit {
  private svc = inject(ComboService);
  private catSvc = inject(CatalogoService);

  modo = signal<Modo>('lista');
  combos = signal<Combo[]>([]);
  loading = signal(false);
  guardando = signal(false);
  msg = signal<string | null>(null);
  esError = signal(false);

  programas = signal<any[]>([]);
  editandoId: string | null = null;

  form = {
    nombre: '',
    descripcion: '',
    activo: true,
    programasSeleccionados: [] as string[],
  };

  opcionesProgramas = computed<EnumBuscarOption[]>(() =>
    [...this.programas()]
      .sort((a, b) => {
        const ca = String(a.codigoProg || a.idPrograma || '').trim();
        const cb = String(b.codigoProg || b.idPrograma || '').trim();
        return ca.localeCompare(cb, 'es', { sensitivity: 'base', numeric: true });
      })
      .map((p) => {
        const id = String(p.idPrograma ?? p._id);
        const nombre = String(p.nombreProg || p.descripcion || '').trim();
        const cod = String(p.codigoProg || '').trim();
        return { value: id, label: cod ? `${nombre} (${cod})` : nombre };
      }),
  );

  opcionesProgramasDisponibles = computed<EnumBuscarOption[]>(() =>
    this.opcionesProgramas().filter(
      (o) => !this.form.programasSeleccionados.includes(String(o.value)),
    ),
  );

  programasSeleccionadosDetalle = computed(() =>
    this.form.programasSeleccionados.map((id) => {
      const prog = this.programas().find((p) => String(p.idPrograma ?? p._id) === id);
      if (!prog) return { id, nombre: id };
      const cod = String(prog.codigoProg || '').trim();
      const nombre = String(prog.nombreProg || prog.descripcion || id).trim();
      return { id, nombre: cod ? `${nombre} (${cod})` : nombre };
    }),
  );

  ngOnInit() {
    this.catSvc.list('programas').subscribe((d) => this.programas.set(d || []));
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.svc.listarTodos().subscribe({
      next: (list) => { this.combos.set(list); this.loading.set(false); },
      error: () => { this.toast('No se pudo cargar combos', true); this.loading.set(false); },
    });
  }

  nuevoCombo() {
    this.editandoId = null;
    this.form = { nombre: '', descripcion: '', activo: true, programasSeleccionados: [] };
    this.msg.set(null);
    this.modo.set('form');
  }

  editarCombo(c: Combo) {
    this.editandoId = c.id;
    this.form = {
      nombre: c.nombre,
      descripcion: c.descripcion || '',
      activo: c.activo,
      programasSeleccionados: [...(c.programas || [])],
    };
    this.msg.set(null);
    this.modo.set('form');
  }

  cancelar() {
    this.modo.set('lista');
    this.editandoId = null;
    this.msg.set(null);
  }

  onProgramaAdd(opt: EnumBuscarOption) {
    const id = String(opt.value);
    if (!this.form.programasSeleccionados.includes(id)) {
      this.form.programasSeleccionados = [...this.form.programasSeleccionados, id];
    }
  }

  quitarPrograma(id: string) {
    this.form.programasSeleccionados = this.form.programasSeleccionados.filter((p) => p !== id);
  }

  guardar() {
    const nombre = this.form.nombre.trim();
    if (!nombre) { this.toast('El nombre del combo es obligatorio', true); return; }
    if (this.form.programasSeleccionados.length < 2) {
      this.toast('Seleccione al menos 2 programas para el combo', true);
      return;
    }
    if (this.guardando()) return;
    this.guardando.set(true);
    this.msg.set(null);

    const body = {
      nombre,
      descripcion: this.form.descripcion.trim(),
      programas: this.form.programasSeleccionados,
      activo: this.form.activo,
    };

    const req$ = this.editandoId
      ? this.svc.actualizar(this.editandoId, body)
      : this.svc.crear(body);

    req$.subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.toast(res.message);
        this.cargar();
        this.modo.set('lista');
      },
      error: (e) => {
        this.guardando.set(false);
        this.toast(e?.error?.message || 'Error al guardar', true);
      },
    });
  }

  eliminarCombo(c: Combo) {
    if (!confirm(`¿Eliminar el combo "${c.nombre}"?\nEsta acción no se puede deshacer.`)) return;
    this.svc.eliminar(c.id).subscribe({
      next: (r) => { this.toast(r.message); this.cargar(); },
      error: (e) => this.toast(e?.error?.message || 'No se pudo eliminar', true),
    });
  }

  toggleActivo(c: Combo) {
    this.svc.actualizar(c.id, { activo: !c.activo }).subscribe({
      next: () => this.cargar(),
      error: (e) => this.toast(e?.error?.message || 'Error', true),
    });
  }

  private toast(text: string, err = false) {
    this.msg.set(text);
    this.esError.set(err);
  }
}
