import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Egreso, EgresoService } from '../../core/services/egreso.service';
import { ConfigService } from '../../core/services/config.service';
import { ConfigPaginasInformesService } from '../../core/services/config-paginas-informes.service';
import { AccionPermisoService } from '../../core/services/accion-permiso.service';
import { EliminacionOperacionService } from '../../core/services/eliminacion-operacion.service';
import {
  capBeneficiario,
  capPlaca,
  capConceptoCaja,
  capDoc,
  capFecha,
  capFormaPago,
  capRecibo,
  capTipoEgreso,
  capValorEgreso,
} from '../../core/utils/capsule.util';
import {
  tieneSoporteEgreso,
  tituloSoporteEgreso,
} from '../../core/utils/egreso-soporte.helpers';
import { readVistaLista, saveVistaLista, VistaLista } from '../../core/utils/vista-lista.helpers';
import { CajaDescuadresBannerComponent } from './caja-descuadres-banner.component';
import { SoporteViewerModalComponent } from '../../shared/soporte-viewer-modal/soporte-viewer-modal.component';
import { ReciboService } from '../../core/services/recibo.service';
import { descargarBlob, mensajeErrorBlob } from '../../core/utils/descargar-blob';
import {
  abrirInformeMovimientosCaja,
  buildInformeMovimientosCajaHtml,
} from './caja-movimientos-informe-document';

import {
  SortDir,
  cmpDate,
  cmpNum,
  cmpText,
  readSortPrefs,
  saveSortPrefs,
} from './caja-listados-sort.helpers';

type SortColEgreso =
  | 'fecha'
  | 'recibo'
  | 'sesion'
  | 'beneficiario'
  | 'documento'
  | 'concepto'
  | 'tipo'
  | 'placa'
  | 'formaPago'
  | 'valor';

const SORT_KEY = 'argo-caja-egresos-todos-sort';
const SORT_COLS: SortColEgreso[] = [
  'fecha',
  'recibo',
  'sesion',
  'beneficiario',
  'documento',
  'concepto',
  'tipo',
  'placa',
  'formaPago',
  'valor',
];

@Component({
  selector: 'argo-caja-egresos-todos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    CajaDescuadresBannerComponent,
    ArgoDateInputComponent,
    SoporteViewerModalComponent,
  ],
  templateUrl: './caja-egresos-todos.component.html',
  styleUrls: ['./caja-listados-admin.scss'],
})
export class CajaEgresosTodosComponent implements OnInit {
  private egresoSvc = inject(EgresoService);
  private configSvc = inject(ConfigService);
  private paginasSvc = inject(ConfigPaginasInformesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private reciboSvc = inject(ReciboService);
  accionPermiso = inject(AccionPermisoService);
  private eliminacionOps = inject(EliminacionOperacionService);

  @ViewChild(SoporteViewerModalComponent) soporteModal?: SoporteViewerModalComponent;

  private readonly vistaKey = 'argo-caja-egresos-todos-vista';

  vista = signal<VistaLista>(readVistaLista(this.vistaKey));
  items = signal<Egreso[]>([]);
  total = signal(0);
  totalValor = signal(0);
  loading = signal(false);
  exportando = signal(false);
  private pendientePdf = false;
  msg = signal<string | null>(null);
  msgError = signal(false);

  q = signal('');
  numDoc = signal('');
  desde = signal('');
  hasta = signal('');
  idSesion = signal('');
  tipoFiltro = signal('');
  conceptoFiltro = signal('');

  puedeAnularEgreso = computed(() => this.accionPermiso.mostrarAccionEliminar('egresos'));
  etiquetaAnular = computed(() =>
    this.accionPermiso.puedeEliminar('egresos') ? 'Anular' : 'Solicitar anulación',
  );

  sortCol = signal<SortColEgreso>('fecha');
  sortDir = signal<SortDir>('desc');

  opcionesTipo = computed(() => opcionesUnicas(this.items().map((e) => String(e.tipoEgresoDescr || ''))));
  opcionesConcepto = computed(() => opcionesUnicas(this.items().map((e) => String(e.concepto || ''))));

  itemsFiltrados = computed(() =>
    this.items().filter(
      (e) =>
        coincideOpcion(String(e.tipoEgresoDescr || ''), this.tipoFiltro()) &&
        coincideOpcion(String(e.concepto || ''), this.conceptoFiltro()),
    ),
  );

  itemsOrdenados = computed(() => {
    const list = [...this.itemsFiltrados()];
    const col = this.sortCol();
    const dir = this.sortDir();
    list.sort((a, b) => {
      switch (col) {
        case 'fecha':
          return cmpDate(a.fechaEgreso, b.fechaEgreso, dir);
        case 'recibo':
          return cmpText(a.numRecibo, b.numRecibo, dir);
        case 'sesion':
          return cmpNum(a.idSesion, b.idSesion, dir);
        case 'beneficiario':
          return cmpText(a.pagueA, b.pagueA, dir);
        case 'documento':
          return cmpText(a.numeroDocumento, b.numeroDocumento, dir);
        case 'concepto':
          return cmpText(a.concepto, b.concepto, dir);
        case 'tipo':
          return cmpText(a.tipoEgresoDescr, b.tipoEgresoDescr, dir);
        case 'placa':
          return cmpText(a.placa, b.placa, dir);
        case 'formaPago':
          return cmpText(a.formaPago, b.formaPago, dir);
        case 'valor':
          return cmpNum(a.valorEgreso, b.valorEgreso, dir);
        default:
          return 0;
      }
    });
    return list;
  });

  totalFiltrado = computed(() =>
    this.itemsOrdenados()
      .filter((e) => !this.esAnulado(e))
      .reduce((a, e) => a + Number(e.valorEgreso || 0), 0),
  );

  capFecha = capFecha;
  capRecibo = capRecibo;
  capDoc = capDoc;
  capBeneficiario = capBeneficiario;
  capPlaca = capPlaca;
  capConceptoCaja = capConceptoCaja;
  capTipoEgreso = capTipoEgreso;
  capFormaPago = capFormaPago;
  capValorEgreso = capValorEgreso;

  egresosSinSoporte = computed(() =>
    this.itemsOrdenados().filter((e) => !this.esAnulado(e) && !tieneSoporteEgreso(e)),
  );
  cantSinSoporte = computed(() => this.egresosSinSoporte().length);
  tieneSoporte = tieneSoporteEgreso;
  tituloSoporte = tituloSoporteEgreso;

  ngOnInit(): void {
    const prefs = readSortPrefs<SortColEgreso>(SORT_KEY, 'fecha', 'desc');
    if (SORT_COLS.includes(prefs.col)) {
      this.sortCol.set(prefs.col);
      this.sortDir.set(prefs.dir);
    }
    this.route.queryParamMap.subscribe((p) => {
      const sid = p.get('idSesion');
      if (sid) this.idSesion.set(sid);
      this.cargar();
    });
  }

  setVista(v: VistaLista): void {
    this.vista.set(v);
    saveVistaLista(this.vistaKey, v);
  }

  toggleSort(col: SortColEgreso): void {
    if (this.sortCol() === col) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortCol.set(col);
      this.sortDir.set(col === 'fecha' || col === 'valor' ? 'desc' : 'asc');
    }
    saveSortPrefs(SORT_KEY, this.sortCol(), this.sortDir());
  }

  sortIcon(col: SortColEgreso): string {
    if (this.sortCol() !== col) return '↕';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  sortAria(col: SortColEgreso): string | null {
    if (this.sortCol() !== col) return null;
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  esAnulado(e: Egreso): boolean {
    if (e?.anulado === true) return true;
    return String(e?.estado || '').trim().toUpperCase() === 'ANULADO';
  }

  tituloAnulado(e: Egreso): string {
    const partes: string[] = [];
    if (e?.anuladoPor) partes.push(`Anuló: ${e.anuladoPor}`);
    if (e?.autorizadoPor) partes.push(`Autorizó: ${e.autorizadoPor}`);
    if (e?.anuladoEn) {
      try {
        const d = new Date(e.anuladoEn);
        if (!Number.isNaN(d.getTime())) {
          partes.push(d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }));
        }
      } catch {
        /* ignore */
      }
    }
    return partes.join(' · ') || 'Egreso anulado';
  }

  cargar(): void {
    this.loading.set(true);
    this.inform(null);
    this.fetchPaginas(0, []);
  }

  private fetchPaginas(skip: number, acumulado: Egreso[]): void {
    const sid = this.idSesion().trim();
    this.egresoSvc
      .listarTodosAdmin({
        q: this.q().trim() || undefined,
        numeroDocumento: this.numDoc().trim() || undefined,
        desde: this.desde() || undefined,
        hasta: this.hasta() || undefined,
        idSesion: sid ? Number(sid) : undefined,
        skip,
        limit: 500,
      })
      .subscribe({
        next: (r) => {
          const pagina = r.items || [];
          const merged = [...acumulado, ...pagina];
          const total = r.total || merged.length;
          if (merged.length < total && pagina.length > 0) {
            this.fetchPaginas(merged.length, merged);
            return;
          }
          this.items.set(merged);
          this.total.set(total);
          this.totalValor.set(r.totalValor || merged.reduce((a, e) => a + Number(e.valorEgreso || 0), 0));
          this.loading.set(false);
          if (this.pendientePdf) {
            this.pendientePdf = false;
            this.emitirInformePdf();
          }
        },
        error: (e) => {
          this.loading.set(false);
          this.pendientePdf = false;
          this.inform(e?.error?.message || 'Error cargando egresos.');
        },
      });
  }

  limpiarFiltros(): void {
    this.q.set('');
    this.numDoc.set('');
    this.desde.set('');
    this.hasta.set('');
    this.idSesion.set('');
    this.tipoFiltro.set('');
    this.conceptoFiltro.set('');
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.cargar();
  }

  informePdf(): void {
    this.pendientePdf = true;
    this.cargar();
  }

  informeExcel(): void {
    if (this.exportando()) return;
    this.exportando.set(true);
    this.inform(null);
    const sid = this.idSesion().trim();
    this.egresoSvc
      .exportarTodosExcel({
        q: this.q().trim() || undefined,
        numeroDocumento: this.numDoc().trim() || undefined,
        desde: this.desde() || undefined,
        hasta: this.hasta() || undefined,
        idSesion: sid ? Number(sid) : undefined,
        tipo: this.tipoFiltro() || undefined,
        concepto: this.conceptoFiltro() || undefined,
      })
      .subscribe({
        next: (blob) => {
          this.exportando.set(false);
          const fecha = new Date().toISOString().slice(0, 10);
          void descargarBlob(blob, `informe-egresos-${fecha}.xlsx`).catch((err: unknown) => {
            this.inform(err instanceof Error ? err.message : 'No se pudo guardar el Excel.', true);
          });
        },
        error: async (e) => {
          this.exportando.set(false);
          this.inform(await mensajeErrorBlob(e, 'No se pudo exportar el Excel.'), true);
        },
      });
  }

  informeZip(): void {
    if (this.exportando()) return;
    this.exportando.set(true);
    this.inform(null);
    const sid = this.idSesion().trim();
    this.egresoSvc
      .exportarTodosZip({
        q: this.q().trim() || undefined,
        numeroDocumento: this.numDoc().trim() || undefined,
        desde: this.desde() || undefined,
        hasta: this.hasta() || undefined,
        idSesion: sid ? Number(sid) : undefined,
        tipo: this.tipoFiltro() || undefined,
        concepto: this.conceptoFiltro() || undefined,
      })
      .subscribe({
        next: (blob) => {
          this.exportando.set(false);
          const fecha = new Date().toISOString().slice(0, 10);
          void descargarBlob(blob, `informe-egresos-${fecha}.zip`).catch((err: unknown) => {
            this.inform(err instanceof Error ? err.message : 'No se pudo guardar el ZIP.', true);
          });
        },
        error: async (e) => {
          this.exportando.set(false);
          this.inform(await mensajeErrorBlob(e, 'No se pudo generar el ZIP.'), true);
        },
      });
  }

  private emitirInformePdf(): void {
    const filas = this.itemsOrdenados();
    if (!filas.length) {
      this.inform('No hay egresos para el informe con los filtros elegidos.', true);
      return;
    }
    const titulo = 'Informe de egresos';
    this.paginasSvc.ensureAndAtPageCss('informe_egresos_caja').subscribe({
      next: (atPageCss) => {
        this.configSvc.obtenerReciboEncabezado().subscribe({
          next: (empresa) => this.abrirInformeEgresos(titulo, filas, empresa, atPageCss),
          error: () => this.abrirInformeEgresos(titulo, filas, null, atPageCss),
        });
      },
      error: () => {
        this.configSvc.obtenerReciboEncabezado().subscribe({
          next: (empresa) => this.abrirInformeEgresos(titulo, filas, empresa),
          error: () => this.abrirInformeEgresos(titulo, filas, null),
        });
      },
    });
  }

  private abrirInformeEgresos(
    titulo: string,
    filas: Egreso[],
    empresa: Parameters<typeof buildInformeMovimientosCajaHtml>[0]['empresa'],
    atPageCss?: string,
  ): void {
    const html = buildInformeMovimientosCajaHtml({
      titulo,
      incluirPlaca: true,
      filtros: {
        desde: this.desde() || undefined,
        hasta: this.hasta() || undefined,
        documento: this.numDoc().trim() || undefined,
        tipo: this.tipoFiltro() || undefined,
        concepto: this.conceptoFiltro() || undefined,
      },
      filas: filas.map((e) => ({
        fecha: fechaInforme(e.fechaEgreso),
        recibo: String(e.numRecibo || '—'),
        sesion: e.idSesion ? `#${e.idSesion}` : '—',
        tercero: String(e.pagueA || '—'),
        documento: String(e.numeroDocumento || '—'),
        tipo: String(e.tipoEgresoDescr || '—'),
        concepto: String(e.concepto || '—'),
        formaPago: String(e.formaPago || '—'),
        placa: String(e.placa || '—'),
        valor: Number(e.valorEgreso || 0),
        anulado: this.esAnulado(e),
      })),
      empresa,
      atPageCss,
    });
    if (!abrirInformeMovimientosCaja(html)) {
      this.inform('Permita ventanas emergentes para ver e imprimir el PDF.', true);
    }
  }

  irAlCierre(idSesion: number | null | undefined): void {
    if (!idSesion) return;
    this.router.navigate(['/app/cierres', idSesion]);
  }

  filtrarPorSesion(idSesion: number | null | undefined): void {
    if (!idSesion) return;
    this.idSesion.set(String(idSesion));
    this.router.navigate([], { relativeTo: this.route, queryParams: { idSesion } });
    this.cargar();
  }

  verRecibo(e: Egreso): void {
    const id = e.idEgreso;
    if (!id) return;
    this.reciboSvc.abrirHtmlEgreso(id, (m) => this.inform(m));
  }

  urlSoporte(e: Egreso): string | null {
    return this.egresoSvc.urlArchivo(e.urlSoporte);
  }

  abrirSoporte(e: Egreso): void {
    const url = this.urlSoporte(e);
    if (!url) {
      this.inform('Este egreso no tiene soporte adjunto.');
      return;
    }
    this.soporteModal?.abrir(url, 'Soporte de egreso');
  }

  puedeEditarEgreso(e: Egreso): boolean {
    if (this.esAnulado(e)) return false;
    if (e.anticipoNomina || e.idNovedadGenerada) return false;
    return !!e.idEgreso;
  }

  editarEgreso(e: Egreso): void {
    const id = e.idEgreso;
    if (!id) return;
    if (!this.puedeEditarEgreso(e)) {
      this.inform('Los egresos de préstamo/adelanto no se editan; anule y vuelva a crear si fue un error.');
      return;
    }
    void this.router.navigate(['/app/caja/egresos/editar', id], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  onAlarmaSoporte(e: Egreso, ev?: Event): void {
    ev?.stopPropagation();
    if (this.puedeEditarEgreso(e)) {
      this.editarEgreso(e);
      this.inform('Adjunte el soporte (imagen) en el formulario y guarde.');
      return;
    }
    this.inform(
      `Egreso ${e.numRecibo || e.concepto || ''} sin soporte. Este movimiento no admite edición desde aquí.`,
    );
  }

  async anularEgreso(e: Egreso): Promise<void> {
    const id = e.idEgreso;
    if (!id || !this.puedeAnularEgreso()) return;
    const ref = e.numRecibo ? ` «${e.numRecibo}»` : '';
    const resumen = `Egreso${ref || ` ${id}`}`;
    try {
      const resultado = await this.eliminacionOps.ejecutarEliminacionOSolicitar({
        modulo: 'egresos',
        idEntidad: id,
        resumen,
        tituloConfirm: 'Anular egreso',
        mensajeConfirm: `¿Anular el egreso${ref}? Si pertenece a un cierre con descuadre, recalcule el cuadre desde el detalle del cierre.`,
        confirmLabel: this.accionPermiso.puedeEliminar('egresos') ? 'Anular' : 'Enviar solicitud',
        ejecutar: () => this.egresoSvc.eliminar(id),
      });
      if (resultado === 'eliminado') {
        this.inform('Egreso anulado');
        this.cargar();
      } else if (resultado === 'solicitado') {
        this.inform('Solicitud de anulación enviada a Configuración.');
      }
    } catch (err: unknown) {
      const error = err as { error?: { message?: string } };
      this.inform(error?.error?.message || 'No se pudo anular');
    }
  }

  private inform(text: string | null, isErr?: boolean): void {
    this.msg.set(text);
    let err = !!isErr;
    if (!err && text) {
      const t = text.toLowerCase();
      err =
        t.includes('error') ||
        t.includes('no se') ||
        t.includes('inválid') ||
        t.includes('obligator') ||
        t.includes('indique') ||
        t.includes('seleccione') ||
        t.includes('ingrese') ||
        t.includes('solo puede') ||
        t.includes('adjunte') ||
        t.includes('verifique');
    }
    this.msgError.set(err);
  }

}

function coincideOpcion(valor: string, filtro: string): boolean {
  const f = filtro.trim().toLocaleLowerCase('es');
  if (!f) return true;
  return valor.trim().toLocaleLowerCase('es') === f;
}

function opcionesUnicas(valores: string[]): string[] {
  const set = new Set<string>();
  for (const raw of valores) {
    const v = String(raw || '').trim();
    if (!v || v === '—') continue;
    set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'));
}

function fechaInforme(value: unknown): string {
  if (!value) return '—';
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}
