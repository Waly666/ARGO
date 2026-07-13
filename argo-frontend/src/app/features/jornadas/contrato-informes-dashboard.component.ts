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

  barPct(item: InformeDashboardChartItem, list: InformeDashboardChartItem[]): number {
    const max = Math.max(1, ...list.map((x) => Number(x.value) || 0));
    return Math.round(((Number(item.value) || 0) / max) * 100);
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
