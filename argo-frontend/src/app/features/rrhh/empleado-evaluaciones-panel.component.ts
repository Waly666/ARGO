import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { AuthService } from '../../core/services/auth.service';
import { RrhhCatalogService } from '../../core/services/rrhh-catalog.service';
import {
  CompetenciaDesempenoDto,
  EmpleadoEvaluacionCompetencia,
  EmpleadoEvaluacionDto,
  EmpleadoService,
} from '../../core/services/empleado.service';

type NotaComp = {
  idCompetencia?: number | null;
  codigo?: string;
  nombre?: string;
  puntaje: number | null;
};

@Component({
  selector: 'argo-empleado-evaluaciones-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ArgoDateInputComponent, RouterLink],
  templateUrl: './empleado-evaluaciones-panel.component.html',
  styleUrls: ['./empleado-evaluaciones-panel.component.scss'],
})
export class EmpleadoEvaluacionesPanelComponent implements OnChanges {
  private svc = inject(EmpleadoService);
  private cat = inject(RrhhCatalogService);
  private confirm = inject(ConfirmDialogService);
  private auth = inject(AuthService);

  @Input({ required: true }) idEmpleado!: number;
  /** Cargo del empleado: filtra competencias de ámbito específico. */
  @Input() cargoId: number | null | undefined;

  loading = signal(false);
  saving = signal(false);
  err = signal<string | null>(null);
  msg = signal<string | null>(null);
  rows = signal<EmpleadoEvaluacionDto[]>([]);
  editando = signal<EmpleadoEvaluacionDto | null>(null);
  form = signal<Partial<EmpleadoEvaluacionDto>>({});
  notas = signal<NotaComp[]>([]);
  catalogo = signal<CompetenciaDesempenoDto[]>([]);
  mostrarForm = signal(false);
  detalleId = signal<string | null>(null);

  promedioForm = computed(() => {
    const vals = this.notas()
      .map((n) => Number(n.puntaje))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 10);
    if (!vals.length) return null;
    return Math.round((vals.reduce((s, n) => s + n, 0) / vals.length) * 10) / 10;
  });

  notasCalificadas = computed(
    () => this.notas().filter((n) => n.puntaje != null && Number(n.puntaje) >= 1).length,
  );

  puedeGestionar = () =>
    this.auth.tienePermiso(['rrhh.evaluaciones.gestionar', '*']);

  tone(p?: number | null): string {
    const n = Number(p);
    if (!Number.isFinite(n)) return 'mute';
    if (n >= 9) return 'excelente';
    if (n >= 7) return 'bueno';
    if (n >= 5) return 'medio';
    return 'bajo';
  }

  barPct(p?: number | null): number {
    const n = Number(p);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(100, Math.round((n / 10) * 100));
  }

  ngOnChanges(): void {
    if (this.idEmpleado) {
      this.cargarCatalogo();
      this.cargar();
    }
  }

  /** Vacío cargosIds = transversal; si hay IDs, debe incluir el cargo del empleado. */
  private aplicaAlCargo(c: CompetenciaDesempenoDto): boolean {
    const ids = Array.isArray(c.cargosIds)
      ? c.cargosIds.map(Number).filter((n) => Number.isFinite(n))
      : [];
    if (!ids.length) {
      // Legacy sin cargosIds: textos instructor/cajero ya migran en backend; si quedan, excluir de transversales.
      const amb = String(c.ambito || 'todos').toLowerCase();
      if (!amb || amb === 'todos' || amb === 'general' || amb === 'cargos') return true;
      return false;
    }
    const cargo = this.cargoId != null ? Number(this.cargoId) : null;
    if (cargo == null || !Number.isFinite(cargo)) return false;
    return ids.some((id) => id === cargo);
  }

  cargarCatalogo(): void {
    this.cat.listar<CompetenciaDesempenoDto>('competencias-desempeno', { activos: true }).subscribe({
      next: (r) => {
        const list = (r || [])
          .filter((c) => String(c.estado || 'activo').toLowerCase() === 'activo')
          .filter((c) => this.aplicaAlCargo(c))
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.nombre.localeCompare(b.nombre, 'es'));
        this.catalogo.set(list);
      },
      error: () => this.catalogo.set([]),
    });
  }

  cargar(): void {
    this.loading.set(true);
    this.err.set(null);
    this.svc.listarEvaluaciones(this.idEmpleado).subscribe({
      next: (r) => {
        this.rows.set(r || []);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.err.set(e?.error?.message || 'No se pudieron cargar las evaluaciones');
        this.rows.set([]);
      },
    });
  }

  private buildNotasFromCatalog(prev?: EmpleadoEvaluacionCompetencia[]): NotaComp[] {
    const prevMap = new Map(
      (prev || []).map((c) => [String(c.idCompetencia ?? c.codigo ?? c.nombre), c.puntaje]),
    );
    const cat = this.catalogo();
    if (!cat.length && prev?.length) {
      return prev.map((c) => ({
        idCompetencia: c.idCompetencia,
        codigo: c.codigo,
        nombre: c.nombre || 'Competencia',
        puntaje: c.puntaje ?? null,
      }));
    }
    return cat.map((c) => {
      const key = String(c.idCompetencia);
      const prevScore = prevMap.get(key);
      return {
        idCompetencia: c.idCompetencia,
        codigo: c.codigo,
        nombre: c.nombre,
        puntaje: prevScore != null ? Number(prevScore) : null,
      };
    });
  }

  nueva(): void {
    if (!this.puedeGestionar()) return;
    if (!this.catalogo().length) {
      this.err.set(
        this.cargoId
          ? 'No hay competencias activas para el cargo de este empleado. Revise RRHH → Catálogos → Competencias.'
          : 'Asigne un cargo al empleado o cree competencias transversales (ámbito «Todos»).',
      );
      return;
    }
    this.editando.set(null);
    this.form.set({
      fecha: new Date().toISOString().slice(0, 10),
      periodo: '',
      tipo: 'desempeño',
      observaciones: '',
    });
    this.notas.set(this.buildNotasFromCatalog());
    this.mostrarForm.set(true);
    this.msg.set(null);
    this.err.set(null);
  }

  editar(ev: EmpleadoEvaluacionDto): void {
    if (!this.puedeGestionar()) return;
    this.editando.set(ev);
    this.form.set({
      fecha: ev.fecha || '',
      periodo: ev.periodo || '',
      tipo: ev.tipo || 'desempeño',
      observaciones: ev.observaciones || '',
    });
    this.notas.set(this.buildNotasFromCatalog(ev.competencias));
    this.mostrarForm.set(true);
    this.msg.set(null);
    this.err.set(null);
  }

  cancelar(): void {
    this.mostrarForm.set(false);
    this.editando.set(null);
  }

  patch<K extends keyof EmpleadoEvaluacionDto>(k: K, v: EmpleadoEvaluacionDto[K]): void {
    this.form.update((f) => ({ ...f, [k]: v }));
  }

  setNota(i: number, raw: number | string): void {
    const n = raw === '' || raw == null ? null : Number(raw);
    this.notas.update((list) =>
      list.map((item, idx) =>
        idx === i ? { ...item, puntaje: Number.isFinite(n as number) ? (n as number) : null } : item,
      ),
    );
  }

  toggleDetalle(id?: string): void {
    if (!id) return;
    this.detalleId.set(this.detalleId() === id ? null : id);
  }

  guardar(): void {
    if (!this.puedeGestionar()) return;
    const f = this.form();
    if (!f.fecha) {
      this.err.set('La fecha es obligatoria.');
      return;
    }
    const comps = this.notas()
      .filter((n) => n.puntaje != null && Number(n.puntaje) >= 1 && Number(n.puntaje) <= 10)
      .map((n) => ({
        idCompetencia: n.idCompetencia,
        codigo: n.codigo || '',
        nombre: n.nombre || '',
        puntaje: Number(n.puntaje),
      }));
    if (!comps.length) {
      this.err.set('Califique al menos una competencia (1 a 10).');
      return;
    }
    const invalida = this.notas().find(
      (n) => n.puntaje != null && (Number(n.puntaje) < 1 || Number(n.puntaje) > 10),
    );
    if (invalida) {
      this.err.set(`Puntaje inválido en «${invalida.nombre}» (use 1–10).`);
      return;
    }
    this.saving.set(true);
    this.err.set(null);
    const payload: Partial<EmpleadoEvaluacionDto> = {
      fecha: f.fecha,
      periodo: f.periodo || '',
      tipo: f.tipo || 'desempeño',
      observaciones: f.observaciones || '',
      competencias: comps,
    };
    const ed = this.editando();
    const req = ed?._id
      ? this.svc.actualizarEvaluacion(this.idEmpleado, ed._id, payload)
      : this.svc.crearEvaluacion(this.idEmpleado, payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.mostrarForm.set(false);
        this.editando.set(null);
        this.msg.set(ed ? 'Evaluación actualizada.' : 'Evaluación registrada.');
        this.cargar();
      },
      error: (e) => {
        this.saving.set(false);
        this.err.set(e?.error?.message || 'No se pudo guardar');
      },
    });
  }

  async eliminar(ev: EmpleadoEvaluacionDto): Promise<void> {
    if (!this.puedeGestionar() || !ev._id) return;
    const ok = await this.confirm.open({
      title: 'Eliminar evaluación',
      message: `¿Eliminar la calificación ${ev.puntaje}/10 del ${ev.fecha || 'registro'}?`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;
    this.svc.eliminarEvaluacion(this.idEmpleado, ev._id).subscribe({
      next: () => {
        this.msg.set('Evaluación eliminada.');
        this.cargar();
      },
      error: (e) => this.err.set(e?.error?.message || 'No se pudo eliminar'),
    });
  }
}
