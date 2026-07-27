import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ClaseJornadaDto, JornadaCapService } from '../../core/services/jornada-cap.service';
import { PermisoService } from '../../core/services/permiso.service';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
import { fmtFechaCalendario, ymdLocal } from './jornada-calendario.util';
import {
  capCarpa,
  capCodContrato,
  capFechaJor,
  capHoraJor,
  capInstructor,
  capPrograma,
  estadoClaseLiveClass,
  isoAHoraInput,
  labelCarpaClase,
  labelEstadoClaseAmigable,
  labelInstructorClase,
  rowClaseClass,
} from './jornada-ui.util';

@Component({
  selector: 'argo-jornada-instructor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ArgoDateInputComponent,
    CatalogoEnumBuscarComponent,
  ],
  templateUrl: './jornada-instructor.component.html',
  styleUrls: ['./jornada-instructor.component.scss'],
})
export class JornadaInstructorComponent implements OnInit {
  private jornadaSvc = inject(JornadaCapService);
  private permisoSvc = inject(PermisoService);
  private router = inject(Router);

  loading = signal(false);
  msg = signal<string | null>(null);
  clases = signal<ClaseJornadaDto[]>([]);

  filtroFecha = signal('');
  filtroPrograma = signal('');
  filtroContrato = signal('');
  filtroInstructor = signal('');
  filtroEstado = signal('');
  filtroHoraInicio = signal('');
  filtroHoraFin = signal('');

  capCarpa = capCarpa;
  capCodContrato = capCodContrato;
  capFechaJor = capFechaJor;
  capHoraJor = capHoraJor;
  capInstructor = capInstructor;
  capPrograma = capPrograma;
  estadoClaseLiveClass = estadoClaseLiveClass;
  labelCarpaClase = labelCarpaClase;
  labelEstadoClaseAmigable = labelEstadoClaseAmigable;
  labelInstructorClase = labelInstructorClase;
  rowClaseClass = rowClaseClass;

  puedeGestionar = computed(() => this.permisoSvc.tiene('jornadas.gestionar'));
  puedeOperar = computed(
    () => this.permisoSvc.tiene('jornadas.operar') || this.puedeGestionar(),
  );

  opcionesPrograma = computed<EnumBuscarOption[]>(() => {
    const map = new Map<string, string>();
    for (const c of this.clases()) {
      const id = String(c.idPrograma || '').trim();
      if (!id) continue;
      const label = String(c.programaNombre || id).trim() || id;
      if (!map.has(id)) map.set(id, label);
    }
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  });

  opcionesContrato = computed<EnumBuscarOption[]>(() => {
    const map = new Map<string, string>();
    for (const c of this.clases()) {
      const id = String(c.idContrato || '').trim();
      if (!id) continue;
      const label = String(c.contratoLabel || c.codContrato || id).trim() || id;
      if (!map.has(id)) map.set(id, label);
    }
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  });

  opcionesInstructor = computed<EnumBuscarOption[]>(() => {
    const map = new Map<string, string>();
    for (const c of this.clases()) {
      const label = labelInstructorClase(c);
      if (!label || label === '—') continue;
      const key =
        c.idEmpleadoInstructor != null
          ? `emp:${c.idEmpleadoInstructor}`
          : `nom:${label.toLowerCase()}`;
      if (!map.has(key)) map.set(key, label);
    }
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  });

  opcionesEstado = computed<EnumBuscarOption[]>(() => {
    const set = new Set<string>();
    for (const c of this.clases()) {
      const e = String(c.estado || '').trim().toUpperCase();
      if (e) set.add(e);
    }
    return [...set]
      .sort()
      .map((value) => ({ value, label: labelEstadoClaseAmigable(value) }));
  });

  textoPrograma = computed(() => {
    const id = this.filtroPrograma();
    if (!id) return '';
    return this.opcionesPrograma().find((o) => o.value === id)?.label || id;
  });
  textoContrato = computed(() => {
    const id = this.filtroContrato();
    if (!id) return '';
    return this.opcionesContrato().find((o) => o.value === id)?.label || id;
  });
  textoInstructor = computed(() => {
    const id = this.filtroInstructor();
    if (!id) return '';
    return this.opcionesInstructor().find((o) => o.value === id)?.label || id;
  });
  textoEstado = computed(() => {
    const id = this.filtroEstado();
    if (!id) return '';
    return this.opcionesEstado().find((o) => o.value === id)?.label || id;
  });

  filtradas = computed(() => {
    const fecha = this.filtroFecha().trim();
    const prog = this.filtroPrograma().trim();
    const contrato = this.filtroContrato().trim();
    const instructor = this.filtroInstructor().trim();
    const estado = this.filtroEstado().trim().toUpperCase();
    const hIni = this.filtroHoraInicio().trim();
    const hFin = this.filtroHoraFin().trim();

    return this.clases().filter((c) => {
      if (fecha) {
        const ymd = ymdLocal(c.fechaJornada || c.fechaClase || '');
        if (ymd !== fecha) return false;
      }
      if (prog && String(c.idPrograma || '') !== prog) return false;
      if (contrato && String(c.idContrato || '') !== contrato) return false;
      if (estado && String(c.estado || '').trim().toUpperCase() !== estado) return false;
      if (instructor) {
        const key =
          c.idEmpleadoInstructor != null
            ? `emp:${c.idEmpleadoInstructor}`
            : `nom:${labelInstructorClase(c).toLowerCase()}`;
        if (key !== instructor) return false;
      }
      if (hIni) {
        const hi = isoAHoraInput(c.horaInicio);
        if (!hi || hi < hIni) return false;
      }
      if (hFin) {
        const hf = isoAHoraInput(c.horaFin || c.horaInicio);
        if (!hf || hf > hFin) return false;
      }
      return true;
    });
  });

  totalAlumnosFiltrados = computed(() =>
    this.filtradas().reduce((a, c) => a + (Number(c.alumnosInscritos) || 0), 0),
  );

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.msg.set(null);
    this.jornadaSvc.listarClasesContratosEnEjecucion().subscribe({
      next: (rows) => {
        this.clases.set(rows || []);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.clases.set([]);
        this.msg.set(e?.error?.message || 'No se pudieron cargar las clases.');
      },
    });
  }

  limpiarFiltros(): void {
    this.filtroFecha.set('');
    this.filtroPrograma.set('');
    this.filtroContrato.set('');
    this.filtroInstructor.set('');
    this.filtroEstado.set('');
    this.filtroHoraInicio.set('');
    this.filtroHoraFin.set('');
  }

  onProgramaPick(opt: EnumBuscarOption): void {
    this.filtroPrograma.set(String(opt.value));
  }
  onProgramaLimpiar(): void {
    this.filtroPrograma.set('');
  }
  onContratoPick(opt: EnumBuscarOption): void {
    this.filtroContrato.set(String(opt.value));
  }
  onContratoLimpiar(): void {
    this.filtroContrato.set('');
  }
  onInstructorPick(opt: EnumBuscarOption): void {
    this.filtroInstructor.set(String(opt.value));
  }
  onInstructorLimpiar(): void {
    this.filtroInstructor.set('');
  }
  onEstadoPick(opt: EnumBuscarOption): void {
    this.filtroEstado.set(String(opt.value));
  }
  onEstadoLimpiar(): void {
    this.filtroEstado.set('');
  }

  fmtFecha(v?: string | Date | null): string {
    return fmtFechaCalendario(v);
  }

  fmtHora(v?: string | null): string {
    if (!v) return '—';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  labelContrato(c: ClaseJornadaDto): string {
    return String(c.contratoLabel || c.codContrato || '—').trim() || '—';
  }

  abrirClase(c: ClaseJornadaDto): void {
    if (!c.idContrato || !c._id) return;
    void this.router.navigate(['/app/jornadas'], {
      queryParams: {
        contrato: c.idContrato,
        tab: 'clases',
        jornada: c.idJornada || undefined,
        clase: c._id,
      },
    });
  }

  cerrarMsg(): void {
    this.msg.set(null);
  }
}
