import { CommonModule, DatePipe } from '@angular/common';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import {
  ActividadService,
  FiltrosHistorialActividad,
  MonitorRecursosResponse,
  RegistroActividadHttp,
  UsuarioActivo,
} from '../../core/services/actividad.service';
import {
  AuditoriaService,
  FiltrosAuditoria,
  RegistroAuditoria,
} from '../../core/services/auditoria.service';
import { readVistaLista, saveVistaLista, VistaLista } from '../../core/utils/vista-lista.helpers';

type TabMonitoreo = 'ops' | 'enLinea' | 'historial' | 'cambios';

type OpsEventKind = 'http' | 'db' | 'agent';
type OpsSeverity = 'info' | 'warn' | 'critical' | 'success';

interface OpsEvent {
  id: string;
  ts: Date;
  kind: OpsEventKind;
  severity: OpsSeverity;
  actor: string;
  headline: string;
  detail: string;
  code?: string;
  isNew?: boolean;
}

const REFRESH_MS = 3000;
const OPS_REFRESH_MS = 2000;
const OPS_MAX_EVENTS = 72;

@Component({
  selector: 'argo-auditoria-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe,
    ArgoDateInputComponent,
  ],
  templateUrl: './auditoria-admin.component.html',
  styleUrls: ['./auditoria-admin.component.scss'],
})
export class AuditoriaAdminComponent implements OnInit, OnDestroy, AfterViewInit {
  private auditoriaSvc = inject(AuditoriaService);
  private actividadSvc = inject(ActividadService);

  @ViewChild('matrixCanvas') matrixCanvas?: ElementRef<HTMLCanvasElement>;

  tab = signal<TabMonitoreo>('ops');
  autoRefresh = signal(true);
  ultimaActualizacion = signal<Date | null>(null);
  actualizando = signal(false);
  opsFullscreen = signal(false);
  opsEvents = signal<OpsEvent[]>([]);
  opsMonitor = signal<MonitorRecursosResponse | null>(null);
  opsAgents = signal<UsuarioActivo[]>([]);
  opsClock = signal('');
  opsGlitch = signal(false);

  activos = signal<UsuarioActivo[]>([]);
  ventanaMinutos = signal(10);
  cargandoActivos = signal(false);

  historialItems = signal<RegistroActividadHttp[]>([]);
  historialTotal = signal(0);
  historialPage = signal(1);
  historialPages = signal(1);
  cargandoHistorial = signal(false);
  filtrosHistorial: FiltrosHistorialActividad = { limit: 80, page: 1 };

  items = signal<RegistroAuditoria[]>([]);
  total = signal(0);
  page = signal(1);
  pages = signal(1);
  cargando = signal(false);
  detalle = signal<RegistroAuditoria | null>(null);
  vista = signal<VistaLista>(readVistaLista('argo-auditoria-vista'));

  filtros: FiltrosAuditoria = { limit: 50, page: 1 };

  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private clockTimer: ReturnType<typeof setInterval> | null = null;
  private matrixAnim: number | null = null;
  private matrixResize?: () => void;
  private knownOpsIds = new Set<string>();

  ngOnInit(): void {
    this.cargarTab();
    this.iniciarAutoRefresh();
    this.iniciarRelojOps();
  }

  ngAfterViewInit(): void {
    this.iniciarMatrixSiOps();
  }

  ngOnDestroy(): void {
    this.detenerAutoRefresh();
    this.detenerRelojOps();
    this.detenerMatrix();
  }

  setTab(t: TabMonitoreo): void {
    this.tab.set(t);
    this.cargarTab();
    this.iniciarAutoRefresh();
    queueMicrotask(() => this.iniciarMatrixSiOps());
  }

  toggleOpsFullscreen(): void {
    this.opsFullscreen.update((v) => !v);
    queueMicrotask(() => this.iniciarMatrixSiOps());
  }

  toggleAutoRefresh(): void {
    this.autoRefresh.update((v) => !v);
    this.iniciarAutoRefresh();
  }

  private iniciarRelojOps(): void {
    this.detenerRelojOps();
    const tick = () => {
      const now = new Date();
      this.opsClock.set(
        now.toLocaleString('es-CO', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
      );
    };
    tick();
    this.clockTimer = setInterval(tick, 1000);
  }

  private detenerRelojOps(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  }

  private iniciarAutoRefresh(): void {
    this.detenerAutoRefresh();
    if (!this.autoRefresh()) return;
    const ms = this.tab() === 'ops' ? OPS_REFRESH_MS : REFRESH_MS;
    this.refreshTimer = setInterval(() => this.tickTiempoReal(), ms);
  }

  private tickTiempoReal(): void {
    const t = this.tab();
    if (t === 'ops') this.cargarOps(true);
    else if (t === 'enLinea') this.cargarActivos(true);
    else if (t === 'historial' && this.historialPage() === 1) this.cargarHistorial(true);
  }

  private detenerAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  cargarTab(): void {
    if (this.tab() === 'ops') this.cargarOps();
    else if (this.tab() === 'enLinea') this.cargarActivos();
    else if (this.tab() === 'historial') this.cargarHistorial();
    else this.cargar();
  }

  cargarOps(silent = false): void {
    if (!silent) this.actualizando.set(true);
    else this.actualizando.set(true);

    forkJoin({
      monitor: this.actividadSvc.monitor(10),
      historial: this.actividadSvc.historial({ limit: 30, page: 1 }),
      auditoria: this.auditoriaSvc.listar({ limit: 30, page: 1 }),
    }).subscribe({
      next: ({ monitor, historial, auditoria }) => {
        this.opsMonitor.set(monitor);
        this.opsAgents.set(monitor.usuarios || []);
        this.fusionarOpsEvents(historial.items || [], auditoria.items || []);
        this.ultimaActualizacion.set(new Date());
        this.actualizando.set(false);
        if (Math.random() < 0.08) {
          this.opsGlitch.set(true);
          setTimeout(() => this.opsGlitch.set(false), 180);
        }
      },
      error: () => this.actualizando.set(false),
    });
  }

  private fusionarOpsEvents(http: RegistroActividadHttp[], db: RegistroAuditoria[]): void {
    const incoming: OpsEvent[] = [];

    for (const r of http) {
      const id = `http-${r.idActividad}`;
      incoming.push({
        id,
        ts: new Date(r.fecha),
        kind: 'http',
        severity: this.severidadHttp(r.codigoHttp),
        actor: r.nombreUsuario || r.usuario || 'ANÓNIMO',
        headline: r.actividad || `${r.metodo} ${r.rutaBase || r.ruta}`,
        detail: `${r.metodo || '—'} ${r.rutaBase || r.ruta || ''}`.trim(),
        code: r.codigoHttp ? String(r.codigoHttp) : undefined,
        isNew: !this.knownOpsIds.has(id),
      });
    }

    for (const r of db) {
      const id = `db-${r.idAuditoria}`;
      incoming.push({
        id,
        ts: new Date(r.fecha),
        kind: 'db',
        severity: this.severidadDb(r.accion),
        actor: r.usuario || 'SISTEMA',
        headline: `${String(r.accion || 'evento').toUpperCase()} · ${r.entidad || 'dato'}`,
        detail: r.resumen || r.rutaBase || r.ruta || 'Cambio en base de datos',
        code: r.idEntidad ? `#${r.idEntidad}` : undefined,
        isNew: !this.knownOpsIds.has(id),
      });
    }

    incoming.sort((a, b) => b.ts.getTime() - a.ts.getTime());
    const merged = incoming.slice(0, OPS_MAX_EVENTS);
    for (const e of merged) this.knownOpsIds.add(e.id);
    this.opsEvents.set(merged);
    setTimeout(() => {
      this.opsEvents.update((rows) => rows.map((e) => ({ ...e, isNew: false })));
    }, 1400);
  }

  private severidadHttp(code?: number): OpsSeverity {
    if (!code) return 'info';
    if (code >= 500) return 'critical';
    if (code >= 400) return 'warn';
    if (code >= 200 && code < 300) return 'success';
    return 'info';
  }

  private severidadDb(accion?: string): OpsSeverity {
    const a = String(accion || '').toLowerCase();
    if (a === 'eliminar') return 'critical';
    if (a === 'modificar' || a === 'migracion_importar') return 'warn';
    if (a === 'crear' || a === 'apertura_caja') return 'success';
    return 'info';
  }

  opsKindLabel(kind: OpsEventKind): string {
    if (kind === 'http') return 'NET';
    if (kind === 'db') return 'DB';
    return 'AGENT';
  }

  formatOpsTime(d: Date): string {
    return d.toLocaleTimeString('es-CO', { hour12: false });
  }

  private iniciarMatrixSiOps(): void {
    this.detenerMatrix();
    if (this.tab() !== 'ops') return;
    const canvas = this.matrixCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    this.matrixResize = resize;
    window.addEventListener('resize', resize);

    const chars = 'ARGO01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const fontSize = 14;
    const columns = Math.max(8, Math.floor(canvas.width / fontSize));
    const drops = Array.from({ length: columns }, () => Math.random() * -40);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 8, 4, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff9c';
      ctx.font = `${fontSize}px "Consolas", "Courier New", monospace`;

      for (let i = 0; i < drops.length; i += 1) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillText(ch, x, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }
      this.matrixAnim = requestAnimationFrame(draw);
    };
    draw();
  }

  private detenerMatrix(): void {
    if (this.matrixAnim != null) {
      cancelAnimationFrame(this.matrixAnim);
      this.matrixAnim = null;
    }
    if (this.matrixResize) {
      window.removeEventListener('resize', this.matrixResize);
      this.matrixResize = undefined;
    }
  }

  cargarActivos(silent = false): void {
    const primeraVez = !this.activos().length;
    if (!silent || primeraVez) this.cargandoActivos.set(true);
    else this.actualizando.set(true);

    this.actividadSvc.activos(this.ventanaMinutos()).subscribe({
      next: (r) => {
        this.activos.set(r.usuarios);
        this.ultimaActualizacion.set(new Date());
        this.cargandoActivos.set(false);
        this.actualizando.set(false);
      },
      error: () => {
        this.cargandoActivos.set(false);
        this.actualizando.set(false);
      },
    });
  }

  cargarHistorial(silent = false): void {
    const primeraVez = !this.historialItems().length;
    if (!silent || primeraVez) this.cargandoHistorial.set(true);
    else this.actualizando.set(true);

    this.filtrosHistorial.page = this.historialPage();
    this.actividadSvc.historial(this.filtrosHistorial).subscribe({
      next: (r) => {
        this.historialItems.set(r.items);
        this.historialTotal.set(r.total);
        this.historialPages.set(r.pages);
        this.ultimaActualizacion.set(new Date());
        this.cargandoHistorial.set(false);
        this.actualizando.set(false);
      },
      error: () => {
        this.cargandoHistorial.set(false);
        this.actualizando.set(false);
      },
    });
  }

  historialAnterior(): void {
    if (this.historialPage() <= 1) return;
    this.historialPage.update((p) => p - 1);
    this.cargarHistorial();
  }

  historialSiguiente(): void {
    if (this.historialPage() >= this.historialPages()) return;
    this.historialPage.update((p) => p + 1);
    this.cargarHistorial();
  }

  buscarHistorial(): void {
    this.historialPage.set(1);
    this.cargarHistorial();
  }

  cargar(): void {
    this.cargando.set(true);
    this.filtros.page = this.page();
    this.auditoriaSvc.listar(this.filtros).subscribe({
      next: (r) => {
        this.items.set(r.items);
        this.total.set(r.total);
        this.pages.set(r.pages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  setVista(v: VistaLista): void {
    this.vista.set(v);
    saveVistaLista('argo-auditoria-vista', v);
  }

  verDetalle(row: RegistroAuditoria): void {
    this.detalle.set(row);
    this.auditoriaSvc.obtener(row.idAuditoria).subscribe({
      next: (d) => this.detalle.set(d),
    });
  }

  cerrarDetalle(): void {
    this.detalle.set(null);
  }

  paginaAnterior(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
    this.cargar();
  }

  paginaSiguiente(): void {
    if (this.page() >= this.pages()) return;
    this.page.update((p) => p + 1);
    this.cargar();
  }

  codigoClase(code?: number): string {
    if (!code) return '';
    if (code >= 500) return 'http-5xx';
    if (code >= 400) return 'http-4xx';
    return 'http-ok';
  }

  json(v: unknown): string {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  }
}
