import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { TIPOS_CERTIFICADO } from '../../core/constants/tipos-certificado';
import { Gestor, GestorService } from '../../core/services/gestor.service';
import {
  ReferidorChartItem,
  ReferidorComercialService,
  ReferidorInformeDashboard,
} from '../../core/services/referidor-comercial.service';
import { ProgramaService } from '../../core/services/programa.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import { catEtiqueta } from '../alumnos/catalogo.helpers';
import {
  ChartSlice,
  donutSegmentPaths,
  slicesFromRows,
} from '../dashboard/dashboard-chart.helpers';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import { ConfigRecibo, ConfigService } from '../../core/services/config.service';
import { imprimirReferidorInforme } from './referidor-informe-print.util';

type TabDetalle = 'resumen' | 'pagos' | 'certificados' | 'matriculas';

@Component({
  selector: 'argo-caja-referidor-informe',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    CatalogoEnumBuscarComponent,
    ArgoDateInputComponent,
  ],
  templateUrl: './caja-referidor-informe.component.html',
  styleUrls: ['./caja-referidor-informe.component.scss'],
})
export class CajaReferidorInformeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(ReferidorComercialService);
  private gestorSvc = inject(GestorService);
  private progSvc = inject(ProgramaService);
  private catSvc = inject(CatalogoService);
  private configSvc = inject(ConfigService);

  empresaConfig = signal<ConfigRecibo | null>(null);
  printMsg = signal<string | null>(null);

  tipo = signal<'gestor'>('gestor');
  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<ReferidorInformeDashboard | null>(null);
  tab = signal<TabDetalle>('resumen');

  desde = signal('');
  hasta = signal('');
  idPrograma = signal('');
  programaTexto = signal('');
  idTipCap = signal('');
  tipCapTexto = signal('');
  tipoFormatoCert = signal('');
  referidorId = signal('');
  referidorTexto = signal('');

  readonly tiposCert = TIPOS_CERTIFICADO.filter((t) => t.id !== 'jornada_capacitacion');

  titulo = computed(() => 'Informe de gestores');
  catalogoLink = computed(() => '/app/caja/gestores');
  kpis = computed(() => this.data()?.kpis || null);
  resumen = computed(() => this.data()?.resumen || []);
  detallePagos = computed(() => this.data()?.detalle?.pagos || []);
  detalleCerts = computed(() => this.data()?.detalle?.certificados || []);
  detalleMats = computed(() => this.data()?.detalle?.matriculas || []);

  chartPagosMes = computed(() => this.buildSlices(this.data()?.charts?.pagosPorMes || []));
  chartCertsMes = computed(() => this.buildSlices(this.data()?.charts?.certificadosPorMes || []));
  chartPagosProg = computed(() => this.buildSlices(this.data()?.charts?.pagosPorPrograma || []));
  chartCertsProg = computed(() => this.buildSlices(this.data()?.charts?.certificadosPorPrograma || []));
  pagosPorMesItems = computed(() => this.data()?.charts?.pagosPorMes ?? []);
  certificadosPorMesItems = computed(() => this.data()?.charts?.certificadosPorMes ?? []);

  donutPagosProg = computed(() => donutSegmentPaths(this.chartPagosProg()));
  donutCertsProg = computed(() => donutSegmentPaths(this.chartCertsProg()));

  opcionesPrograma = signal<EnumBuscarOption[]>([]);
  opcionesTipCap = signal<EnumBuscarOption[]>([]);
  opcionesReferidor = signal<EnumBuscarOption[]>([]);

  ngOnInit(): void {
    this.tipo.set('gestor');
    this.presetMesActual();
    this.cargarCatalogos();
    this.cargarEmpresa();
    this.cargar();
  }

  private cargarEmpresa(): void {
    this.configSvc.obtenerReciboEncabezado().subscribe({
      next: (c) => this.empresaConfig.set(c),
      error: () => this.empresaConfig.set(null),
    });
  }

  private cargarCatalogos(): void {
    this.progSvc.listar({ activos: false, catalogo: true }).subscribe({
      next: (rows) => {
        this.opcionesPrograma.set(
          (rows || []).map((p) => ({
            value: String(p.idPrograma ?? ''),
            label: p.codigoProg ? `${p.codigoProg} — ${p.nombreProg}` : String(p.nombreProg || ''),
          })),
        );
      },
      error: () => this.opcionesPrograma.set([]),
    });
    this.catSvc.list<Record<string, unknown>>('catTipoCapacitacion').subscribe({
      next: (rows) => {
        this.opcionesTipCap.set(
          (rows || [])
            .map((r): EnumBuscarOption | null => {
              const idRaw = r['idTipCap'] ?? r['id'];
              if (idRaw == null || idRaw === '') return null;
              const label = catEtiqueta(r) || String(r['tipoCap'] ?? r['descripcion'] ?? idRaw).trim();
              return { value: String(idRaw), label: label || String(idRaw) };
            })
            .filter((o): o is EnumBuscarOption => o != null),
        );
      },
      error: () => this.opcionesTipCap.set([]),
    });
    this.gestorSvc.listar().subscribe({
      next: (rows) => this.opcionesReferidor.set(this.mapGestores(rows)),
      error: () => this.opcionesReferidor.set([]),
    });
  }

  private mapGestores(rows: Gestor[]): EnumBuscarOption[] {
    return (rows || []).map((g) => ({
      value: String(g._id || ''),
      label:
        g.seudonimo?.trim() ||
        g.nombreCompleto?.trim() ||
        [g.nombres, g.apellidos].filter(Boolean).join(' ').trim() ||
        String(g.numero || ''),
    }));
  }

  presetMesActual(): void {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const desde = new Date(y, m, 1);
    const hasta = new Date(y, m + 1, 0);
    this.desde.set(this.fmt(desde));
    this.hasta.set(this.fmt(hasta));
  }

  presetUltimos30(): void {
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - 29);
    this.desde.set(this.fmt(desde));
    this.hasta.set(this.fmt(hasta));
    this.cargar();
  }

  private fmt(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .dashboard({
        tipo: this.tipo(),
        desde: this.desde() || undefined,
        hasta: this.hasta() || undefined,
        idPrograma: this.idPrograma() || undefined,
        idTipCap: this.idTipCap() || undefined,
        tipoFormatoCert: this.tipoFormatoCert() || undefined,
        referidorId: this.referidorId() || undefined,
      })
      .subscribe({
        next: (d) => {
          this.data.set(d);
          this.loading.set(false);
        },
        error: (e) => {
          this.data.set(null);
          this.loading.set(false);
          this.error.set(e?.error?.message || 'No se pudo cargar el informe.');
        },
      });
  }

  barWidth(value: number, items: ReferidorChartItem[]): number {
    const max = Math.max(...items.map((i) => i.value), 1);
    return Math.max(4, Math.round((value / max) * 100));
  }

  private buildSlices(items: ReferidorChartItem[]): ChartSlice[] {
    return slicesFromRows(items, (r) => r.label, (r) => r.value);
  }

  setTab(t: TabDetalle): void {
    this.tab.set(t);
  }

  onPrograma(opt: EnumBuscarOption): void {
    this.idPrograma.set(String(opt.value || ''));
    this.programaTexto.set(opt.label || '');
  }

  onTipCap(opt: EnumBuscarOption): void {
    this.idTipCap.set(String(opt.value || ''));
    this.tipCapTexto.set(opt.label || '');
  }

  onReferidor(opt: EnumBuscarOption): void {
    this.referidorId.set(String(opt.value || ''));
    this.referidorTexto.set(opt.label || '');
  }

  labelTipoCertificado(): string {
    const id = this.tipoFormatoCert();
    if (!id) return 'Todos';
    return this.tiposCert.find((t) => t.id === id)?.label || id;
  }

  imprimirInforme(): void {
    const d = this.data();
    if (!d) {
      this.printMsg.set('Genere el informe antes de imprimir.');
      return;
    }
    const ok = imprimirReferidorInforme({
      tipo: this.tipo(),
      data: d,
      empresa: this.empresaConfig(),
      filtros: {
        desde: this.desde(),
        hasta: this.hasta(),
        programa: this.programaTexto() || 'Todos',
        tipoCapacitacion: this.tipCapTexto() || 'Todos',
        tipoCertificado: this.labelTipoCertificado(),
        referidor: this.referidorTexto() || 'Todos los gestores',
      },
    });
    if (!ok) {
      this.printMsg.set('Permita ventanas emergentes para ver o imprimir el informe.');
      return;
    }
    this.printMsg.set(null);
  }
}
