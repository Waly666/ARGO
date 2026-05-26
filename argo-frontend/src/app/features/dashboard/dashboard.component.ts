import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';
import { buildMetodosPagoCards, MetodoPagoCard } from '../../core/utils/metodo-pago.util';
import {
  ChartSlice,
  DonutSegment,
  colorAt,
  donutSegmentPaths,
  maxEnSerie,
  slicesFromRows,
} from './dashboard-chart.helpers';

interface KpiCard {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  tone: string;
  link?: string;
}

interface NavChip {
  label: string;
  path: string;
  tone: string;
}


@Component({
  selector: 'argo-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboardSvc = inject(DashboardService);

  readonly donutSize = 260;
  readonly donutSizeSm = 200;
  readonly donutThickness = 44;
  readonly donutThicknessSm = 36;

  loading = signal(true);
  error = signal<string | null>(null);
  stats = signal<DashboardStats | null>(null);
  fechaDesde = signal('');
  fechaHasta = signal('');

  filtroActivo = computed(() => !!(this.fechaDesde() || this.fechaHasta()));

  periodoLabel = computed(() => {
    const d = this.fechaDesde();
    const h = this.fechaHasta();
    if (d && h) return `${d} — ${h}`;
    if (d) return `desde ${d}`;
    if (h) return `hasta ${h}`;
    return 'este mes';
  });

  nombre = computed(() => {
    const u = this.auth.user();
    if (!u) return '';
    return u.nombres?.split(' ')[0] || u.username;
  });

  colores = computed(() => this.stats()?.colores ?? []);

  kpiCards = computed((): KpiCard[] => {
    const k = this.stats()?.kpis;
    const filtro = this.filtroActivo();
    if (!k) return [];
    const ingLabel = filtro ? 'Ingresos (período)' : 'Ingresos del mes';
    const egrLabel = filtro ? 'Egresos (período)' : 'Egresos del mes';
    const ingSub = filtro ? undefined : `Histórico ${this.fmt(k.ingresosTotal)}`;
    const egrSub = filtro ? undefined : k.egresosTotal != null ? `Histórico ${this.fmt(k.egresosTotal)}` : undefined;
    return [
      { icon: '👥', label: 'Alumnos registrados', value: k.alumnos, tone: 'teal', link: '/app/alumnos' },
      {
        icon: '📋',
        label: 'Matrículas',
        value: k.matriculas,
        sub: k.matriculasActivas != null ? `${k.matriculasActivas} activas` : undefined,
        tone: 'blue',
        link: '/app/alumnos',
      },
      { icon: '🎓', label: 'Programas', value: k.programas, tone: 'purple', link: '/app/programas' },
      { icon: '⚙', label: 'Servicios catálogo', value: k.servicios, tone: 'cyan', link: '/app/servicios' },
      {
        icon: '📑',
        label: 'Liquidaciones',
        value: k.liquidaciones ?? 0,
        sub: k.promedioLiquidacion ? `Prom. ${this.fmt(k.promedioLiquidacion)}` : undefined,
        tone: 'indigo',
        link: '/app/cobros-pendientes',
      },
      {
        icon: '💵',
        label: 'Recibos de caja',
        value: k.recibosTotal ?? 0,
        sub: k.ticketPromedio ? `Ticket prom. ${this.fmt(k.ticketPromedio)}` : undefined,
        tone: 'emerald',
        link: '/app/caja/ingresos-todos',
      },
      {
        icon: '💰',
        label: ingLabel,
        value: k.ingresosMes,
        sub: ingSub,
        tone: 'emerald',
        link: '/app/caja/ingresos-todos',
      },
      {
        icon: '📤',
        label: egrLabel,
        value: k.egresosMes,
        sub: egrSub,
        tone: 'red',
        link: '/app/caja/egresos-todos',
      },
      {
        icon: '📜',
        label: 'Certificados',
        value: k.certificados,
        sub: `+${k.certificadosMes} este mes`,
        tone: 'pink',
      },
      {
        icon: '⏳',
        label: 'Cartera por cobrar',
        value: k.carteraPendiente ?? 0,
        sub: k.valorLiquidado ? `Facturado ${this.fmt(k.valorLiquidado)}` : undefined,
        tone: 'amber',
        link: '/app/cobros-pendientes',
      },
      {
        icon: '🏦',
        label: 'Cajas cerradas',
        value: k.cajasCerradas,
        sub: k.cajasAbiertas ? `${k.cajasAbiertas} abierta(s)` : 'Sin cajas abiertas',
        tone: 'indigo',
        link: '/app/cierres',
      },
      {
        icon: '⚠',
        label: 'Descuadres pendientes',
        value: k.descuadresPendientes,
        sub: 'Requieren gestión',
        tone: k.descuadresPendientes > 0 ? 'amber' : 'emerald',
        link: '/app/caja/descuadres',
      },
    ];
  });

  isMoneyKpi(label: string): boolean {
    return /ingreso|egreso|cartera|factur|prom|ticket/i.test(label);
  }

  navChips = computed((): NavChip[] => [
    { label: 'Alumnos', path: '/app/alumnos', tone: 'teal' },
    { label: 'Cobros', path: '/app/cobros-pendientes', tone: 'blue' },
    { label: 'Caja', path: '/app/caja', tone: 'emerald' },
    { label: 'Cierres', path: '/app/cierres', tone: 'indigo' },
    { label: 'Programas', path: '/app/programas', tone: 'purple' },
    { label: 'Servicios', path: '/app/servicios', tone: 'cyan' },
    { label: 'Cierre general', path: '/app/caja/cierre-general', tone: 'orange' },
    { label: 'Egresos', path: '/app/caja/egresos-todos', tone: 'red' },
  ]);

  slicesLiq = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return slicesFromRows(s.liquidacionesPorEstado, (r) => r.label, (r) => r.cantidad, s.colores);
  });

  slicesPago = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return slicesFromRows(
      s.matriculasPorPago,
      (r) => r.estado || r.label,
      (r) => r.cantidad,
      s.colores,
    );
  });

  slicesFormaPago = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return slicesFromRows(s.ingresosPorFormaPago, (r) => r.forma, (r) => r.total, s.colores);
  });

  metodosPago = computed((): MetodoPagoCard[] =>
    buildMetodosPagoCards(this.stats()?.ingresosPorFormaPago ?? []),
  );

  totalFormaPago = computed(() =>
    this.metodosPago().reduce((a, r) => a + (r.total || 0), 0),
  );

  pathsLiq = computed(() => donutSegmentPaths(this.slicesLiq(), this.donutSizeSm, this.donutThicknessSm));
  pathsPago = computed(() => donutSegmentPaths(this.slicesPago(), this.donutSizeSm, this.donutThicknessSm));
  pathsForma = computed(() => donutSegmentPaths(this.slicesFormaPago(), this.donutSize, this.donutThickness));

  maxIngresosMes = computed(() =>
    maxEnSerie((this.stats()?.ingresosPorMes ?? []).map((m) => m.total ?? 0)),
  );

  maxCertMes = computed(() =>
    maxEnSerie((this.stats()?.certificadosPorMes ?? []).map((m) => m.cantidad)),
  );

  maxServiciosCant = computed(() =>
    maxEnSerie((this.stats()?.serviciosTodos ?? []).map((s) => s.cantidad)),
  );

  totalServiciosValor = computed(() =>
    (this.stats()?.serviciosTodos ?? []).reduce((a, s) => a + (s.total ?? 0), 0),
  );

  totalServiciosCant = computed(() =>
    (this.stats()?.serviciosTodos ?? []).reduce((a, s) => a + (s.cantidad ?? 0), 0),
  );

  maxIngresosTipo = computed(() =>
    maxEnSerie((this.stats()?.ingresosPorTipo ?? []).map((t) => t.total)),
  );

  maxEgresosTipo = computed(() =>
    maxEnSerie((this.stats()?.egresosPorTipo ?? []).map((t) => t.total)),
  );

  slicesIngresosTipo = computed(() => {
    const s = this.stats();
    if (!s?.ingresosPorTipo?.length) return [];
    return slicesFromRows(s.ingresosPorTipo, (r) => r.tipo, (r) => r.total, s.colores);
  });

  slicesEgresosTipo = computed(() => {
    const s = this.stats();
    if (!s?.egresosPorTipo?.length) return [];
    return slicesFromRows(s.egresosPorTipo, (r) => r.tipo, (r) => r.total, s.colores);
  });

  pathsIngresosTipo = computed(() =>
    donutSegmentPaths(this.slicesIngresosTipo(), this.donutSizeSm, this.donutThicknessSm),
  );

  pathsEgresosTipo = computed(() =>
    donutSegmentPaths(this.slicesEgresosTipo(), this.donutSizeSm, this.donutThicknessSm),
  );

  ngOnInit(): void {
    this.aplicarPresetMesActual();
    this.cargar();
  }

  private fmtFechaLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  aplicarPresetMesActual(): void {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaDesde.set(this.fmtFechaLocal(inicio));
    this.fechaHasta.set(this.fmtFechaLocal(hoy));
  }

  presetUltimos30(): void {
    const hoy = new Date();
    const d = new Date(hoy);
    d.setDate(d.getDate() - 30);
    this.fechaDesde.set(this.fmtFechaLocal(d));
    this.fechaHasta.set(this.fmtFechaLocal(hoy));
    this.cargar();
  }

  presetMesAnterior(): void {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    this.fechaDesde.set(this.fmtFechaLocal(inicio));
    this.fechaHasta.set(this.fmtFechaLocal(fin));
    this.cargar();
  }

  presetAnioActual(): void {
    const hoy = new Date();
    this.fechaDesde.set(`${hoy.getFullYear()}-01-01`);
    this.fechaHasta.set(this.fmtFechaLocal(hoy));
    this.cargar();
  }

  limpiarFiltro(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    const desde = this.fechaDesde().trim() || undefined;
    const hasta = this.fechaHasta().trim() || undefined;
    this.dashboardSvc.estadisticas({ desde, hasta }).subscribe({
      next: (r) => {
        this.stats.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message || 'No se pudieron cargar las estadísticas');
      },
    });
  }

  barHeight(value: number, max: number): number {
    if (!max || !value) return 6;
    return Math.max(10, Math.round((value / max) * 100));
  }

  pctServicio(total: number): number {
    const base = this.totalServiciosValor();
    if (!base || !total) return 0;
    return Math.round((total / base) * 1000) / 10;
  }

  fmtMoney(n: number | undefined | null): string {
    if (n == null) return '—';
    return this.fmt(Number(n));
  }

  barColor(i: number): string {
    return colorAt(i, this.colores());
  }

  trackSlice(_i: number, s: ChartSlice): string {
    return s.label;
  }

  trackPath(_i: number, p: DonutSegment): string {
    return p.d + p.color;
  }

  private fmt(n: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n);
  }

}
