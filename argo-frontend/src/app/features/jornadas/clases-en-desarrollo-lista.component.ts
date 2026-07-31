import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ClaseJornadaDto, JornadaCapService } from '../../core/services/jornada-cap.service';
import { JornadaLiveSyncService } from '../../core/services/jornada-live-sync.service';
import { AuthService } from '../../core/services/auth.service';
import { PermisoService } from '../../core/services/permiso.service';
import { esInstructorJornadasRestringido } from './jornadas-acceso.util';
import { fmtFechaCalendario } from './jornada-calendario.util';
import {
  estadoClaseLiveClass,
  isoAHoraInput,
  labelInstructorClase,
} from './jornada-ui.util';

type VistaModo = 'cards' | 'lista';

const ORIGEN_LABELS: Record<string, string> = {
  colegio: 'Institución educativa',
  estamento: 'Estamento',
  empresa: 'Empresa',
  operativo: 'Operativo',
};

/** Poll corto: tablero en vivo de carpa. */
const POLL_MS = 4000;

function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

function formatCronometro(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

@Component({
  selector: 'argo-clases-en-desarrollo-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './clases-en-desarrollo-lista.component.html',
  styleUrls: ['./clases-en-desarrollo-lista.component.scss'],
})
export class ClasesEnDesarrolloListaComponent implements OnInit, OnDestroy {
  private jornadaSvc = inject(JornadaCapService);
  private liveSync = inject(JornadaLiveSyncService);
  private permisoSvc = inject(PermisoService);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  msg = signal<string | null>(null);
  clases = signal<ClaseJornadaDto[]>([]);
  query = signal('');
  vista = signal<VistaModo>('cards');
  /** Tick 1s para cronómetros en vivo. */
  ahora = signal(Date.now());

  estadoClaseLiveClass = estadoClaseLiveClass;
  labelInstructorClase = labelInstructorClase;
  isoAHoraInput = isoAHoraInput;

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private lastRefreshTick = -1;
  private cargarSub: Subscription | null = null;
  private onVisibility = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      this.cargar({ silencioso: true });
    }
  };

  puedeGestionar = computed(() => this.permisoSvc.tiene('jornadas.gestionar'));
  puedeOperar = computed(
    () => this.permisoSvc.tiene('jornadas.operar') || this.puedeGestionar(),
  );
  esInstructorSolo = computed(() =>
    esInstructorJornadasRestringido((k) => this.permisoSvc.tiene(k), this.auth.user()?.rol),
  );
  hubJornadasLink = computed(() =>
    this.esInstructorSolo() ? '/app/jornadas/clases-hoy' : '/app/jornadas',
  );

  hoyLabel = computed(() => fmtFechaCalendario(new Date()));

  filtradas = computed(() => {
    const q = this.query().trim().toLowerCase();
    const rows = this.clases();
    if (!q) return rows;
    return rows.filter((c) => {
      const campos = [
        c.codContrato,
        c.contratoLabel,
        c.clienteNombre,
        c.programaNombre,
        c.instructorNombre,
        c.municipioJornada,
        c.ubicacion,
        this.labelOrigenes(c),
      ];
      return campos.some((x) => String(x || '').toLowerCase().includes(q));
    });
  });

  total = computed(() => this.clases().length);
  totalAlumnos = computed(() =>
    this.filtradas().reduce((acc, c) => acc + (Number(c.alumnosInscritos) || 0), 0),
  );

  constructor() {
    effect(() => {
      const tick = this.liveSync.refreshTick();
      if (this.lastRefreshTick < 0) {
        this.lastRefreshTick = tick;
        return;
      }
      if (tick !== this.lastRefreshTick) {
        this.lastRefreshTick = tick;
        this.cargar({ silencioso: true });
      }
    });
  }

  ngOnInit(): void {
    this.cargar();
    this.pollTimer = setInterval(() => this.cargar({ silencioso: true }), POLL_MS);
    this.tickTimer = setInterval(() => this.ahora.set(Date.now()), 1000);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibility);
    }
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.cargarSub?.unsubscribe();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibility);
    }
  }

  cargar(opts?: { silencioso?: boolean }): void {
    if (!opts?.silencioso) this.loading.set(true);
    this.cargarSub?.unsubscribe();
    this.cargarSub = this.jornadaSvc
      .listarClasesContratosEnEjecucion({ estado: 'EN PROCESO' })
      .subscribe({
        next: (rows) => {
          const enProceso = (rows || []).filter(
            (c) => String(c.estado || '').toUpperCase() === 'EN PROCESO',
          );
          enProceso.sort((a, b) => {
            const ta = a.horaInicio ? new Date(a.horaInicio).getTime() : 0;
            const tb = b.horaInicio ? new Date(b.horaInicio).getTime() : 0;
            return tb - ta;
          });
          this.clases.set(enProceso);
          this.loading.set(false);
          this.msg.set(null);
        },
        error: (e) => {
          this.loading.set(false);
          if (!opts?.silencioso) {
            this.msg.set(e?.error?.message || 'No se pudieron cargar las clases en desarrollo.');
          }
        },
      });
  }

  cerrarMsg(): void {
    this.msg.set(null);
  }

  setVista(v: VistaModo): void {
    this.vista.set(v);
  }

  cronometro(c: ClaseJornadaDto): string {
    void this.ahora();
    const ini = c.horaInicio ? new Date(c.horaInicio).getTime() : NaN;
    if (!Number.isFinite(ini)) return '—';
    return formatCronometro(Date.now() - ini);
  }

  labelOrigenes(c: ClaseJornadaDto): string {
    // Un solo origen: el de operación de la clase (o el inferido de los inscritos).
    const k = String(c.origenOperacion || '')
      .trim()
      .toLowerCase();
    if (!k) return '—';
    return ORIGEN_LABELS[k] || k;
  }

  labelJornada(c: ClaseJornadaDto): string {
    const fecha = c.fechaJornada || c.fechaClase;
    const f = fecha ? fmtFechaCalendario(new Date(fecha)) : '';
    const mun = String(c.municipioJornada || '').trim();
    const parts = [f, mun].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Jornada';
  }

  abrirClase(c: ClaseJornadaDto): void {
    if (!c?._id) return;
    if (this.puedeOperar()) {
      void this.router.navigate(['/app/jornadas/clases-hoy'], { queryParams: { clase: c._id } });
      return;
    }
    void this.router.navigate(['/app/jornadas/instructor'], { queryParams: { clase: c._id } });
  }
}
