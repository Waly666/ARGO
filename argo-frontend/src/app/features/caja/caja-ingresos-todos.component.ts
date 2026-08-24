import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ConfigService } from '../../core/services/config.service';
import { IngresoService } from '../../core/services/ingreso.service';
import { ReciboService, idIngreso } from '../../core/services/recibo.service';
import { CajaSesionService } from '../../core/services/caja-sesion.service';
import { AccionPermisoService } from '../../core/services/accion-permiso.service';
import { EliminacionOperacionService } from '../../core/services/eliminacion-operacion.service';
import {
  capConceptoCaja,
  capCuentaBancaria,
  capDoc,
  capFecha,
  capFormaPago,
  capRecibo,
  capTipoAbono,
  capTipoIngreso,
  capValorIngreso,
  capBeneficiario,
  capRefComprobante,
} from '../../core/utils/capsule.util';
import { readVistaLista, saveVistaLista, VistaLista } from '../../core/utils/vista-lista.helpers';
import { resolverFormaPagoIngreso } from '../../core/utils/caja-forma-pago.util';
import { CajaDescuadresBannerComponent } from './caja-descuadres-banner.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { SoporteViewerModalComponent } from '../../shared/soporte-viewer-modal/soporte-viewer-modal.component';
import { tieneSoporteAdjunto } from '../../core/utils/pago-soporte.helpers';
import {
  SortDir,
  cmpDate,
  cmpNum,
  cmpText,
  readSortPrefs,
  saveSortPrefs,
} from './caja-listados-sort.helpers';

type SortColIngreso =
  | 'fecha'
  | 'recibo'
  | 'sesion'
  | 'pagador'
  | 'tipo'
  | 'concepto'
  | 'formaPago'
  | 'valor';

const SORT_KEY = 'argo-caja-ingresos-todos-sort';
const SORT_COLS: SortColIngreso[] = [
  'fecha',
  'recibo',
  'sesion',
  'pagador',
  'tipo',
  'concepto',
  'formaPago',
  'valor',
];

@Component({
  selector: 'argo-caja-ingresos-todos',
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
  templateUrl: './caja-ingresos-todos.component.html',
  styleUrls: ['./caja-listados-admin.scss'],
})
export class CajaIngresosTodosComponent implements OnInit {
  private ingSvc = inject(IngresoService);
  private reciboSvc = inject(ReciboService);
  private configSvc = inject(ConfigService);
  private cajaSvc = inject(CajaSesionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirm = inject(ConfirmDialogService);
  accionPermiso = inject(AccionPermisoService);
  private eliminacionOps = inject(EliminacionOperacionService);

  @ViewChild(SoporteViewerModalComponent) soporteModal?: SoporteViewerModalComponent;

  private readonly vistaKey = 'argo-caja-ingresos-todos-vista';

  vista = signal<VistaLista>(readVistaLista(this.vistaKey));
  items = signal<any[]>([]);
  total = signal(0);
  totalValor = signal(0);
  loading = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);

  q = signal('');
  numDoc = signal('');
  desde = signal('');
  hasta = signal('');
  idSesion = signal('');

  sesionAbiertaId = signal<number | null>(null);

  puedeAnularIngreso = computed(() => this.accionPermiso.mostrarAccionEliminar('ingresos'));
  etiquetaAnularIngreso = computed(() =>
    this.accionPermiso.puedeEliminar('ingresos') ? 'Anular' : 'Solicitar anulación',
  );

  sortCol = signal<SortColIngreso>('fecha');
  sortDir = signal<SortDir>('desc');

  itemsOrdenados = computed(() => {
    const list = [...this.items()];
    const col = this.sortCol();
    const dir = this.sortDir();
    list.sort((a, b) => {
      switch (col) {
        case 'fecha':
          return cmpDate(a.fecha || a.createdAt, b.fecha || b.createdAt, dir);
        case 'recibo':
          return cmpText(a.numRecibo, b.numRecibo, dir);
        case 'sesion':
          return cmpNum(a.idSesion, b.idSesion, dir);
        case 'pagador':
          return cmpText(this.pagadorLabel(a), this.pagadorLabel(b), dir);
        case 'tipo':
          return cmpText(a.tipoIngresoDescr, b.tipoIngresoDescr, dir);
        case 'concepto':
          return cmpText(this.conceptoLabel(a), this.conceptoLabel(b), dir);
        case 'formaPago':
          return cmpText(this.formaPagoLabel(a), this.formaPagoLabel(b), dir);
        case 'valor':
          return cmpNum(a.valor, b.valor, dir);
        default:
          return 0;
      }
    });
    return list;
  });

  capFecha = capFecha;
  capRecibo = capRecibo;
  capDoc = capDoc;
  capTipoIngreso = capTipoIngreso;
  capTipoAbono = capTipoAbono;
  capConceptoCaja = capConceptoCaja;
  capFormaPago = capFormaPago;
  capCuentaBancaria = capCuentaBancaria;
  capValorIngreso = capValorIngreso;
  capBeneficiario = capBeneficiario;
  capRefComprobante = capRefComprobante;

  ngOnInit(): void {
    const prefs = readSortPrefs<SortColIngreso>(SORT_KEY, 'fecha', 'desc');
    if (SORT_COLS.includes(prefs.col)) {
      this.sortCol.set(prefs.col);
      this.sortDir.set(prefs.dir);
    }
    this.configSvc.obtenerReciboEncabezado().subscribe({
      next: (c) => this.reciboSvc.registrarFormatoIngreso(c.formatoComprobanteIngreso),
      error: () => undefined,
    });
    this.cajaSvc.activa().subscribe({
      next: (r) => this.sesionAbiertaId.set(r.sesion?.idSesion ?? null),
      error: () => this.sesionAbiertaId.set(null),
    });
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

  toggleSort(col: SortColIngreso): void {
    if (this.sortCol() === col) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortCol.set(col);
      this.sortDir.set(col === 'fecha' || col === 'valor' ? 'desc' : 'asc');
    }
    saveSortPrefs(SORT_KEY, this.sortCol(), this.sortDir());
  }

  sortIcon(col: SortColIngreso): string {
    if (this.sortCol() !== col) return '↕';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  sortAria(col: SortColIngreso): string | null {
    if (this.sortCol() !== col) return null;
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  esAnulado(i: { estado?: string; anulado?: boolean }): boolean {
    if (i?.anulado === true) return true;
    return String(i?.estado || '').trim().toUpperCase() === 'ANULADO';
  }

  tituloAnulado(i: { anuladoPor?: string; autorizadoPor?: string; anuladoEn?: string }): string {
    const partes: string[] = [];
    if (i?.anuladoPor) partes.push(`Anuló: ${i.anuladoPor}`);
    if (i?.autorizadoPor) partes.push(`Autorizó: ${i.autorizadoPor}`);
    if (i?.anuladoEn) {
      try {
        const d = new Date(i.anuladoEn);
        if (!Number.isNaN(d.getTime())) {
          partes.push(d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }));
        }
      } catch {
        /* ignore */
      }
    }
    return partes.join(' · ') || 'Ingreso anulado';
  }

  cargar(): void {
    this.loading.set(true);
    this.inform(null);
    this.fetchPaginas(0, []);
  }

  private fetchPaginas(skip: number, acumulado: any[]): void {
    const sid = this.idSesion().trim();
    this.ingSvc
      .listarTodosAdmin({
        q: this.q().trim() || undefined,
        numDoc: this.numDoc().trim() || undefined,
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
          this.totalValor.set(r.totalValor || merged.reduce((a, i) => a + Number(i.valor || 0), 0));
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.inform(e?.error?.message || 'Error cargando ingresos.');
        },
      });
  }

  limpiarFiltros(): void {
    this.q.set('');
    this.numDoc.set('');
    this.desde.set('');
    this.hasta.set('');
    this.idSesion.set('');
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.cargar();
  }

  pagadorLabel(i: any): string {
    if (i.esIngresoCaja) return i.pagadorDescr || i.recibidoDe || 'Tercero';
    return i.alumnoNombre || i.pagadorDescr || (i.numDoc != null ? String(i.numDoc) : '—');
  }

  docLabel(i: any): string {
    const d = i?.numDoc ?? i?.documentoTercero;
    return d != null && String(d).trim() ? String(d).trim() : '—';
  }

  conceptoLabel(i: any): string {
    return i.conceptoLabel || i.liquidacionDescr || i.concepto || '—';
  }

  conceptoCorto(i: any, max = 24): string {
    const full = this.conceptoLabel(i);
    if (full === '—' || full.length <= max) return full;
    return `${full.slice(0, max - 1).trimEnd()}…`;
  }

  formaPagoLabel(i: any): string {
    return resolverFormaPagoIngreso(i);
  }

  refComprobante(i: any): string {
    return String(i.numTransferencia || i.numComprobante || '').trim();
  }

  tieneSoporte = tieneSoporteAdjunto;

  urlSoporte(i: { urlSoporte?: string | null }): string | null {
    return this.ingSvc.urlArchivo(i.urlSoporte);
  }

  abrirSoporte(i: { urlSoporte?: string | null }): void {
    const url = this.urlSoporte(i);
    if (!url) {
      this.inform('Este movimiento no tiene soporte adjunto.');
      return;
    }
    this.soporteModal?.abrir(url, 'Soporte de ingreso');
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

  verRecibo(ing: { _id?: unknown }): void {
    this.abrirComprobanteIngreso(ing);
  }

  imprimirRecibo(ing: { _id?: unknown }): void {
    this.abrirComprobanteIngreso(ing);
  }

  private abrirComprobanteIngreso(ing: { _id?: unknown }): void {
    const id = idIngreso(ing);
    if (!id) return;
    if (!this.reciboSvc.abrirHtml(id, (m) => this.inform(m))) {
      this.inform('Permita ventanas emergentes para ver o imprimir el comprobante.', true);
    }
  }

  async anularIngreso(ing: { _id?: unknown; numRecibo?: string; idSesion?: number | null }): Promise<void> {
    const id = idIngreso(ing);
    if (!id || !this.puedeAnularIngreso()) return;
    const ref = ing.numRecibo ? ` «${ing.numRecibo}»` : '';
    const resumen = `Ingreso${ref || ` ${id}`}`;
    try {
      const resultado = await this.eliminacionOps.ejecutarEliminacionOSolicitar({
        modulo: 'ingresos',
        idEntidad: id,
        resumen,
        tituloConfirm: 'Anular ingreso',
        mensajeConfirm: `¿Anular el ingreso ${ing.numRecibo || id}? Si pertenece a un cierre con descuadre, recalcule el cuadre desde el detalle del cierre.`,
        confirmLabel: this.accionPermiso.puedeEliminar('ingresos') ? 'Anular' : 'Enviar solicitud',
        ejecutar: () => this.ingSvc.eliminar(id),
      });
      if (resultado === 'eliminado') {
        this.inform('Ingreso anulado');
        this.cargar();
      } else if (resultado === 'solicitado') {
        this.inform('Solicitud de anulación enviada a Configuración.');
      }
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.inform(err?.error?.message || 'No se pudo anular', true);
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
