import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ClaseJornadaDto, JornadaCapService } from '../../core/services/jornada-cap.service';
import { PermisoService } from '../../core/services/permiso.service';
import { fmtFechaCalendario, ymdLocal } from './jornada-calendario.util';
import {
  capCodContrato,
  capInstructor,
  capMunicipioJor,
  capUbicacionClase,
  estadoClaseLiveClass,
  isoAHoraInput,
  rowClaseClass,
} from './jornada-ui.util';

@Component({
  selector: 'argo-clases-hoy-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clases-hoy-lista.component.html',
  styleUrls: ['./clases-hoy-lista.component.scss'],
})
export class ClasesHoyListaComponent implements OnInit, OnDestroy {
  private jornadaSvc = inject(JornadaCapService);
  private permisoSvc = inject(PermisoService);
  private router = inject(Router);

  loading = signal(false);
  clases = signal<ClaseJornadaDto[]>([]);
  query = signal('');
  msg = signal<string | null>(null);

  hoyLabel = computed(() => fmtFechaCalendario(new Date()));
  enProcesoCount = computed(() => this.clases().filter((c) => c.estado === 'EN PROCESO').length);
  programadasCount = computed(() => this.clases().filter((c) => c.estado === 'PROGRAMADA').length);
  finalizadasCount = computed(() => this.clases().filter((c) => c.estado === 'FINALIZADO').length);

  puedeGestionar = computed(() => this.permisoSvc.tiene('jornadas.gestionar'));
  /** Instructor (operar sin gestionar): ve solo sus clases en esta pantalla. */
  esInstructorSolo = computed(
    () => this.permisoSvc.tiene('jornadas.operar') && !this.puedeGestionar(),
  );
  puedeOperar = computed(() => this.permisoSvc.tiene('jornadas.operar') || this.puedeGestionar());

  filtradas = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.clases();
    return this.clases().filter((c) => {
      const campos = [
        c.codContrato,
        c.contratoLabel,
        c.programaNombre,
        c.instructorNombre,
        c.ubicacion,
        c.municipioJornada,
        c.direccionJornada,
        c.estado,
      ];
      return campos.some((v) => String(v || '').toLowerCase().includes(q));
    });
  });

  total = computed(() => this.clases().length);

  capCodContrato = capCodContrato;
  capInstructor = capInstructor;
  capMunicipioJor = capMunicipioJor;
  capUbicacionClase = capUbicacionClase;
  estadoClaseLiveClass = estadoClaseLiveClass;
  rowClaseClass = rowClaseClass;

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.cargar();
    this.refreshTimer = setInterval(() => this.cargar(true), 15_000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  cargar(silencioso = false) {
    if (!silencioso) this.loading.set(true);
    this.jornadaSvc.listarClasesDelDia(ymdLocal(new Date())).subscribe({
      next: (rows) => {
        this.clases.set(rows || []);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.msg.set(e?.error?.message || 'No se pudieron cargar las clases de hoy.');
      },
    });
  }

  cerrarMsg() {
    this.msg.set(null);
  }

  labelInstructorClase(c: ClaseJornadaDto): string {
    return (c.instructorNombre || c.idinstructor || '—').trim() || '—';
  }

  fmtHora(iso?: string | null): string {
    const h = isoAHoraInput(iso);
    return h || '—';
  }

  gestionarJornada(c: ClaseJornadaDto) {
    if (!c.idContrato || !c.idJornada) return;
    void this.router.navigate(['/app/jornadas'], {
      queryParams: {
        contrato: c.idContrato,
        tab: 'jornadas',
        jornada: c.idJornada,
      },
    });
  }

  editarClase(c: ClaseJornadaDto) {
    if (!c.idContrato || !c.idJornada || !c._id) return;
    void this.router.navigate(['/app/jornadas'], {
      queryParams: {
        contrato: c.idContrato,
        tab: 'clases',
        jornada: c.idJornada,
        clase: c._id,
      },
    });
  }

  operarClase(c: ClaseJornadaDto) {
    void this.router.navigate(['/app/jornadas/instructor'], {
      queryParams: { clase: c._id, jornada: c.idJornada, fecha: ymdLocal(new Date()) },
    });
  }

  iniciarYOperar(c: ClaseJornadaDto) {
    if (!c._id) return;
    this.jornadaSvc.iniciarClase(c._id).subscribe({
      next: () => this.operarClase(c),
      error: (e) => this.msg.set(e?.error?.message || 'No se pudo iniciar la clase.'),
    });
  }
}
