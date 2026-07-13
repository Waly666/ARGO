import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  InformeContratoAlcance,
  InformeDashboardChartItem,
  InformeDashboardDto,
  JornadaCapService,
} from '../../core/services/jornada-cap.service';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';

@Component({
  selector: 'argo-contrato-informes-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CatalogoEnumBuscarComponent],
  templateUrl: './contrato-informes-dashboard.component.html',
  styleUrls: ['./contrato-informes-dashboard.component.scss'],
})
export class ContratoInformesDashboardComponent implements OnChanges {
  private jornadaSvc = inject(JornadaCapService);

  @Input() idContrato = '';

  loading = signal(false);
  exportando = signal(false);
  exportandoAlcance = signal<string | null>(null);
  error = signal<string | null>(null);
  msg = signal<string | null>(null);
  data = signal<InformeDashboardDto | null>(null);

  filtroJornadaId = signal('');
  filtroJornadaTexto = signal('');
  filtroClaseId = signal('');
  filtroClaseTexto = signal('');
  filtroProgramaId = signal('');
  filtroProgramaTexto = signal('');
  filtroInstructorId = signal('');
  filtroInstructorTexto = signal('');

  kpis = computed(() => this.data()?.kpis || null);
  charts = computed(() => this.data()?.charts || null);
  porJornada = computed(() => this.data()?.porJornada || []);
  porClase = computed(() => this.data()?.porClase || []);
  porPrograma = computed(() => this.data()?.porPrograma || []);
  porInstructor = computed(() => this.data()?.porInstructor || []);
  contrato = computed(() => this.data()?.contrato || null);

  opcionesJornada = computed<EnumBuscarOption[]>(() =>
    (this.data()?.opciones?.jornadas || []).map((o) => ({ value: o.value, label: o.label })),
  );
  opcionesClase = computed<EnumBuscarOption[]>(() => {
    const jid = this.filtroJornadaId();
    return (this.data()?.opciones?.clases || [])
      .filter((o) => !jid || o.idJornada === jid)
      .map((o) => ({ value: o.value, label: o.label }));
  });
  opcionesPrograma = computed<EnumBuscarOption[]>(() =>
    (this.data()?.opciones?.programas || []).map((o) => ({ value: o.value, label: o.label })),
  );
  opcionesInstructor = computed<EnumBuscarOption[]>(() =>
    (this.data()?.opciones?.instructores || []).map((o) => ({ value: o.value, label: o.label })),
  );

  /** Barras: alumnos por jornada */
  chartBarrasJornada = computed(() => this.buildBarras(this.charts()?.alumnosPorJornada || [], 'sky'));
  /** Torta: clases por estado */
  chartTortaEstado = computed(() => this.buildTorta(this.charts()?.clasesPorEstado || [], 'estado'));
  /** Torta: alumnos por programa */
  chartTortaPrograma = computed(() => this.buildTorta(this.charts()?.alumnosPorPrograma || [], 'programa'));
  /** Barras: clases por instructor */
  chartBarrasInstructor = computed(() => this.buildBarras(this.charts()?.clasesPorInstructor || [], 'teal'));

  private readonly palette = [
    '#38bdf8',
    '#34d399',
    '#a78bfa',
    '#fbbf24',
    '#fb7185',
    '#2dd4bf',
    '#60a5fa',
    '#c084fc',
    '#f472b6',
    '#4ade80',
  ];

  private readonly paletteEstado: Record<string, string> = {
    Finalizadas: '#34d399',
    'En proceso': '#38bdf8',
    Programadas: '#fbbf24',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idContrato']) {
      this.limpiarFiltros(false);
      this.cargar();
    }
  }

  private filtrosApi() {
    return {
      idJornada: this.filtroJornadaId() || undefined,
      idClase: this.filtroClaseId() || undefined,
      idPrograma: this.filtroProgramaId() || undefined,
      idInstructor: this.filtroInstructorId() || undefined,
    };
  }

  cargar(): void {
    const id = (this.idContrato || '').trim();
    if (!id) {
      this.data.set(null);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.jornadaSvc.informeDashboardContrato(id, this.filtrosApi()).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message || 'No se pudo cargar el dashboard de informes.');
      },
    });
  }

  limpiarFiltros(recargar = true): void {
    this.filtroJornadaId.set('');
    this.filtroJornadaTexto.set('');
    this.filtroClaseId.set('');
    this.filtroClaseTexto.set('');
    this.filtroProgramaId.set('');
    this.filtroProgramaTexto.set('');
    this.filtroInstructorId.set('');
    this.filtroInstructorTexto.set('');
    if (recargar) this.cargar();
  }

  onJornadaPick(opt: EnumBuscarOption): void {
    this.filtroJornadaId.set(String(opt.value));
    this.filtroJornadaTexto.set(opt.label);
    this.filtroClaseId.set('');
    this.filtroClaseTexto.set('');
    this.cargar();
  }
  onJornadaLimpiar(): void {
    this.filtroJornadaId.set('');
    this.filtroJornadaTexto.set('');
    this.cargar();
  }
  onClasePick(opt: EnumBuscarOption): void {
    this.filtroClaseId.set(String(opt.value));
    this.filtroClaseTexto.set(opt.label);
    this.cargar();
  }
  onClaseLimpiar(): void {
    this.filtroClaseId.set('');
    this.filtroClaseTexto.set('');
    this.cargar();
  }
  onProgramaPick(opt: EnumBuscarOption): void {
    this.filtroProgramaId.set(String(opt.value));
    this.filtroProgramaTexto.set(opt.label);
    this.cargar();
  }
  onProgramaLimpiar(): void {
    this.filtroProgramaId.set('');
    this.filtroProgramaTexto.set('');
    this.cargar();
  }
  onInstructorPick(opt: EnumBuscarOption): void {
    this.filtroInstructorId.set(String(opt.value));
    this.filtroInstructorTexto.set(opt.label);
    this.cargar();
  }
  onInstructorLimpiar(): void {
    this.filtroInstructorId.set('');
    this.filtroInstructorTexto.set('');
    this.cargar();
  }

  buildBarras(
    items: InformeDashboardChartItem[],
    tone: 'sky' | 'teal' = 'sky',
  ): Array<InformeDashboardChartItem & { pct: number; color: string }> {
    const list = (items || []).filter((x) => Number(x.value) >= 0).slice(0, 10);
    const max = Math.max(1, ...list.map((x) => Number(x.value) || 0));
    return list.map((it, i) => ({
      ...it,
      pct: Math.max(4, Math.round(((Number(it.value) || 0) / max) * 100)),
      color:
        tone === 'teal'
          ? this.palette[(i + 4) % this.palette.length]
          : this.palette[i % this.palette.length],
    }));
  }

  buildTorta(
    items: InformeDashboardChartItem[],
    kind: 'estado' | 'programa' = 'programa',
  ): {
    total: number;
    slices: Array<{
      label: string;
      value: number;
      pct: number;
      color: string;
      path: string;
    }>;
  } {
    const list = (items || []).filter((x) => Number(x.value) > 0).slice(0, 8);
    const total = list.reduce((s, x) => s + (Number(x.value) || 0), 0) || 1;
    const cx = 50;
    const cy = 50;
    const r = 36;
    const rInner = 20;
    let angle = -Math.PI / 2;
    const slices = list.map((it, i) => {
      const value = Number(it.value) || 0;
      const pct = Math.round((value / total) * 1000) / 10;
      const sweep = (value / total) * Math.PI * 2;
      const a0 = angle;
      const a1 = angle + sweep;
      angle = a1;
      const color =
        kind === 'estado'
          ? this.paletteEstado[it.label] || this.palette[i % this.palette.length]
          : this.palette[i % this.palette.length];
      return {
        label: it.label,
        value,
        pct,
        color,
        path: this.donutSlicePath(cx, cy, r, rInner, a0, a1),
      };
    });
    return { total: list.reduce((s, x) => s + (Number(x.value) || 0), 0), slices };
  }

  private donutSlicePath(
    cx: number,
    cy: number,
    r: number,
    rInner: number,
    a0: number,
    a1: number,
  ): string {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const xi0 = cx + rInner * Math.cos(a1);
    const yi0 = cy + rInner * Math.sin(a1);
    const xi1 = cx + rInner * Math.cos(a0);
    const yi1 = cy + rInner * Math.sin(a0);
    if (Math.abs(a1 - a0) >= Math.PI * 2 - 1e-6) {
      const mid = a0 + Math.PI;
      const xm = cx + r * Math.cos(mid);
      const ym = cy + r * Math.sin(mid);
      const xim = cx + rInner * Math.cos(mid);
      const yim = cy + rInner * Math.sin(mid);
      return [
        `M ${x0} ${y0}`,
        `A ${r} ${r} 0 1 1 ${xm} ${ym}`,
        `A ${r} ${r} 0 1 1 ${x0} ${y0}`,
        `L ${xi1} ${yi1}`,
        `A ${rInner} ${rInner} 0 1 0 ${xim} ${yim}`,
        `A ${rInner} ${rInner} 0 1 0 ${xi1} ${yi1}`,
        'Z',
      ].join(' ');
    }
    return [
      `M ${x0} ${y0}`,
      `A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`,
      `L ${xi0} ${yi0}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${xi1} ${yi1}`,
      'Z',
    ].join(' ');
  }

  exportarPdf(
    alcance: InformeContratoAlcance,
    opts?: {
      idJornada?: string;
      idClase?: string;
      idPrograma?: string;
      idInstructor?: string | number | null;
    },
  ): void {
    const id = (this.idContrato || '').trim();
    if (!id) return;

    const f = this.filtrosApi();
    const idJornada = opts?.idJornada ?? f.idJornada;
    const idClase = opts?.idClase ?? f.idClase;
    const idPrograma = opts?.idPrograma ?? f.idPrograma;
    const idInstructor =
      opts?.idInstructor !== undefined ? opts.idInstructor : f.idInstructor;

    if (alcance === 'jornada' && !idJornada) {
      this.msg.set('Elija una jornada (filtro o fila) para generar ese PDF.');
      return;
    }
    if (alcance === 'clase' && !idClase) {
      this.msg.set('Elija una clase (filtro o fila) para generar ese PDF.');
      return;
    }
    if (alcance === 'programa' && !idPrograma) {
      this.msg.set('Elija un programa (filtro o fila) para generar ese PDF.');
      return;
    }
    if (alcance === 'instructor' && (idInstructor == null || idInstructor === '')) {
      this.msg.set('Elija un instructor (filtro o fila) para generar ese PDF.');
      return;
    }

    const key = [
      alcance,
      idJornada || '',
      idClase || '',
      idPrograma || '',
      idInstructor ?? '',
    ].join(':');
    this.exportando.set(true);
    this.exportandoAlcance.set(key);
    this.msg.set(null);

    this.jornadaSvc
      .descargarInformeContratoPdf(id, {
        alcance,
        idJornada: idJornada || undefined,
        idClase: idClase || undefined,
        idPrograma: idPrograma || undefined,
        idInstructor: idInstructor ?? undefined,
      })
      .subscribe({
        next: (blob) => {
          this.exportando.set(false);
          this.exportandoAlcance.set(null);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `informe_${alcance}_${new Date().toISOString().slice(0, 10)}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          this.msg.set(`PDF de ${alcance} descargado.`);
        },
        error: async (e) => {
          this.exportando.set(false);
          this.exportandoAlcance.set(null);
          let texto = 'No se pudo generar el PDF.';
          try {
            const t = await e?.error?.text?.();
            if (t) {
              const j = JSON.parse(t);
              if (j?.message) texto = j.message;
            }
          } catch {
            /* ignore */
          }
          this.msg.set(e?.error?.message || texto);
        },
      });
  }

  exportandoEsta(key: string): boolean {
    return this.exportando() && this.exportandoAlcance() === key;
  }
}
