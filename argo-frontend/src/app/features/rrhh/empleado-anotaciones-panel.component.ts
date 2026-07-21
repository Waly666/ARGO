import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { AuthService } from '../../core/services/auth.service';
import { EmpleadoAnotacionDto, EmpleadoService } from '../../core/services/empleado.service';

const CATEGORIAS_POS = [
  { value: 'reconocimiento', label: 'Reconocimiento' },
  { value: 'logro', label: 'Logro / resultado' },
  { value: 'felicitacion', label: 'Felicitación' },
  { value: 'otro', label: 'Otro (positivo)' },
];

const CATEGORIAS_NEG = [
  { value: 'llamado_atencion', label: 'Llamado de atención' },
  { value: 'falta', label: 'Falta / incumplimiento' },
  { value: 'queja', label: 'Queja / reclamo' },
  { value: 'otro', label: 'Otro (negativo)' },
];

const CAT_LABEL: Record<string, string> = {
  reconocimiento: 'Reconocimiento',
  logro: 'Logro / resultado',
  felicitacion: 'Felicitación',
  llamado_atencion: 'Llamado de atención',
  falta: 'Falta / incumplimiento',
  queja: 'Queja / reclamo',
  otro: 'Otro',
};

@Component({
  selector: 'argo-empleado-anotaciones-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ArgoDateInputComponent],
  templateUrl: './empleado-anotaciones-panel.component.html',
  styleUrls: ['./empleado-anotaciones-panel.component.scss'],
})
export class EmpleadoAnotacionesPanelComponent implements OnChanges {
  private svc = inject(EmpleadoService);
  private confirm = inject(ConfirmDialogService);
  private auth = inject(AuthService);

  @Input({ required: true }) idEmpleado!: number;

  loading = signal(false);
  saving = signal(false);
  err = signal<string | null>(null);
  msg = signal<string | null>(null);
  rows = signal<EmpleadoAnotacionDto[]>([]);
  editando = signal<EmpleadoAnotacionDto | null>(null);
  form = signal<Partial<EmpleadoAnotacionDto>>({});
  mostrarForm = signal(false);
  filtro = signal<'todas' | 'positivo' | 'negativo'>('todas');

  filtradas = computed(() => {
    const f = this.filtro();
    const list = this.rows();
    if (f === 'todas') return list;
    return list.filter((r) => r.tipo === f);
  });

  conteoPos = computed(() => this.rows().filter((r) => r.tipo === 'positivo').length);
  conteoNeg = computed(() => this.rows().filter((r) => r.tipo === 'negativo').length);

  categoriasForm = computed(() =>
    this.form().tipo === 'negativo' ? CATEGORIAS_NEG : CATEGORIAS_POS,
  );

  puedeGestionar = () =>
    this.auth.tienePermiso(['rrhh.anotaciones.gestionar', 'rrhh', '*']);

  labelCategoria(c?: string): string {
    return CAT_LABEL[String(c || 'otro')] || String(c || 'Otro');
  }

  ngOnChanges(): void {
    if (this.idEmpleado) this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.err.set(null);
    this.svc.listarAnotaciones(this.idEmpleado).subscribe({
      next: (r) => {
        this.rows.set(r || []);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.err.set(e?.error?.message || 'No se pudieron cargar las anotaciones');
        this.rows.set([]);
      },
    });
  }

  nueva(): void {
    if (!this.puedeGestionar()) return;
    this.editando.set(null);
    this.form.set({
      fecha: new Date().toISOString().slice(0, 10),
      tipo: 'positivo',
      categoria: 'reconocimiento',
      titulo: '',
      descripcion: '',
    });
    this.mostrarForm.set(true);
    this.msg.set(null);
    this.err.set(null);
  }

  editar(row: EmpleadoAnotacionDto): void {
    if (!this.puedeGestionar()) return;
    this.editando.set(row);
    this.form.set({
      fecha: row.fecha || '',
      tipo: row.tipo === 'negativo' ? 'negativo' : 'positivo',
      categoria: row.categoria || 'otro',
      titulo: row.titulo || '',
      descripcion: row.descripcion || '',
    });
    this.mostrarForm.set(true);
    this.msg.set(null);
    this.err.set(null);
  }

  cancelar(): void {
    this.mostrarForm.set(false);
    this.editando.set(null);
  }

  patch<K extends keyof EmpleadoAnotacionDto>(k: K, v: EmpleadoAnotacionDto[K]): void {
    this.form.update((f) => {
      const next = { ...f, [k]: v };
      if (k === 'tipo') {
        const tipo = v === 'negativo' ? 'negativo' : 'positivo';
        const cats = tipo === 'negativo' ? CATEGORIAS_NEG : CATEGORIAS_POS;
        if (!cats.some((c) => c.value === next.categoria)) {
          next.categoria = cats[0].value;
        }
      }
      return next;
    });
  }

  guardar(): void {
    if (!this.puedeGestionar()) return;
    const f = this.form();
    if (!f.fecha) {
      this.err.set('La fecha es obligatoria.');
      return;
    }
    if (f.tipo !== 'positivo' && f.tipo !== 'negativo') {
      this.err.set('Seleccione si es positiva o negativa.');
      return;
    }
    if (!String(f.descripcion || '').trim()) {
      this.err.set('La descripción es obligatoria.');
      return;
    }
    this.saving.set(true);
    this.err.set(null);
    const payload: Partial<EmpleadoAnotacionDto> = {
      fecha: f.fecha,
      tipo: f.tipo,
      categoria: f.categoria || 'otro',
      titulo: String(f.titulo || '').trim(),
      descripcion: String(f.descripcion || '').trim(),
    };
    const ed = this.editando();
    const req = ed?._id
      ? this.svc.actualizarAnotacion(this.idEmpleado, ed._id, payload)
      : this.svc.crearAnotacion(this.idEmpleado, payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.mostrarForm.set(false);
        this.editando.set(null);
        this.msg.set(ed ? 'Anotación actualizada.' : 'Anotación registrada.');
        this.cargar();
      },
      error: (e) => {
        this.saving.set(false);
        this.err.set(e?.error?.message || 'No se pudo guardar');
      },
    });
  }

  async eliminar(row: EmpleadoAnotacionDto): Promise<void> {
    if (!this.puedeGestionar() || !row._id) return;
    const ok = await this.confirm.open({
      title: 'Eliminar anotación',
      message: `¿Eliminar la anotación del ${row.fecha || 'registro'}?`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;
    this.svc.eliminarAnotacion(this.idEmpleado, row._id).subscribe({
      next: () => {
        this.msg.set('Anotación eliminada.');
        this.cargar();
      },
      error: (e) => this.err.set(e?.error?.message || 'No se pudo eliminar'),
    });
  }
}
