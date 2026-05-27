import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { PermisoService } from '../../core/services/permiso.service';
import {
  ClaseProgramadaCeaDto,
  ProgramacionCeaService,
  labelTipoClaseCea,
} from '../../core/services/programacion-cea.service';
import { fmtFechaCalendario, ymdLocal } from '../jornadas/jornada-calendario.util';
import { estadoClaseLiveClass, rowClaseClass } from '../jornadas/jornada-ui.util';

@Component({
  selector: 'argo-programacion-cea-clases-hoy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './programacion-cea-clases-hoy.component.html',
  styleUrls: ['./programacion-cea-clases-hoy.component.scss'],
})
export class ProgramacionCeaClasesHoyComponent implements OnInit, OnDestroy {
  private svc = inject(ProgramacionCeaService);
  private permisos = inject(PermisoService);
  private router = inject(Router);

  loading = signal(false);
  clases = signal<ClaseProgramadaCeaDto[]>([]);
  query = signal('');
  msg = signal<string | null>(null);

  hoyLabel = computed(() => fmtFechaCalendario(new Date()));
  enProcesoCount = computed(() => this.clases().filter((c) => c.estado === 'EN PROCESO').length);
  programadasCount = computed(() => this.clases().filter((c) => c.estado === 'PROGRAMADA').length);
  finalizadasCount = computed(() => this.clases().filter((c) => c.estado === 'FINALIZADO').length);

  puedeGestionar = computed(() => this.permisos.tiene('programacion_cea.gestionar'));
  esInstructorSolo = computed(
    () => this.permisos.tiene('programacion_cea.operar') && !this.puedeGestionar(),
  );
  puedeOperar = computed(
    () => this.permisos.tiene(['programacion_cea.operar', 'programacion_cea.gestionar']),
  );

  filtradas = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.clases();
    return this.clases().filter((c) => {
      const campos = [
        c.programaLabel,
        c.idProg,
        c.instructorNombre,
        c.temaNombre,
        c.aulaNombre,
        c.tallerNombre,
        c.idVehiculo,
        c.tipoClase,
        c.estado,
        c.horaDesde,
        c.horaHasta,
      ];
      return campos.some((v) => String(v || '').toLowerCase().includes(q));
    });
  });

  total = computed(() => this.clases().length);

  labelTipoClase = labelTipoClaseCea;
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
    this.svc.listarClasesDelDia(ymdLocal(new Date())).subscribe({
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

  ubicacionClase(c: ClaseProgramadaCeaDto): string {
    if (c.tipoClase === 'teoria') return c.aulaNombre || c.idAula || '—';
    if (c.tipoClase === 'taller') return c.tallerNombre || c.idTaller || '—';
    return c.idVehiculo || '—';
  }

  irHubClase(c: ClaseProgramadaCeaDto) {
    void this.router.navigate(['/app/programacion-cea'], {
      queryParams: {
        tab: 'clases',
        clase: c._id,
        fecha: ymdLocal(new Date()),
      },
    });
  }

  iniciarYOperar(c: ClaseProgramadaCeaDto) {
    if (!c._id || !this.puedeOperar()) return;
    this.svc.iniciarClase(c._id).subscribe({
      next: () => this.irHubClase(c),
      error: (e) => this.msg.set(e?.error?.message || 'No se pudo iniciar la clase.'),
    });
  }
}
