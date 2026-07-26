import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Egreso, EgresoService } from '../../core/services/egreso.service';
import { CajaSesionService } from '../../core/services/caja-sesion.service';
import { PermisoService } from '../../core/services/permiso.service';
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
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { SoporteViewerModalComponent } from '../../shared/soporte-viewer-modal/soporte-viewer-modal.component';
import { ReciboService } from '../../core/services/recibo.service';

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
  private cajaSvc = inject(CajaSesionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirm = inject(ConfirmDialogService);
  private reciboSvc = inject(ReciboService);
  private permisos = inject(PermisoService);

  @ViewChild(SoporteViewerModalComponent) soporteModal?: SoporteViewerModalComponent;

  private readonly vistaKey = 'argo-caja-egresos-todos-vista';

  vista = signal<VistaLista>(readVistaLista(this.vistaKey));
  items = signal<Egreso[]>([]);
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
  mostrarAuthAnular = signal(false);
  authAdminUser = signal('');
  authAdminPass = signal('');
  egresoPendienteAnular = signal<Egreso | null>(null);

  sortCol = signal<SortColEgreso>('fecha');
  sortDir = signal<SortDir>('desc');

  itemsOrdenados = computed(() => {
    const list = [...this.items()];
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
    this.items().filter((e) => !this.esAnulado(e) && !tieneSoporteEgreso(e)),
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
        },
        error: (e) => {
          this.loading.set(false);
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
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.cargar();
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

  requiereAuthSupervisor(e: Egreso): boolean {
    if (this.permisos.tiene(['caja.admin', 'contabilidad'])) return false;
    const abierta = this.sesionAbiertaId();
    if (abierta == null) return true;
    if (e.idSesion == null) return true;
    return Number(e.idSesion) !== Number(abierta);
  }

  async anularEgreso(e: Egreso): Promise<void> {
    const id = e.idEgreso;
    if (!id) return;
    const ok = await this.confirm.open({
      title: 'Anular egreso',
      message: `¿Anular el egreso ${e.numRecibo || id}? Si pertenece a un cierre con descuadre, recalcule el cuadre desde el detalle del cierre.`,
      confirmLabel: 'Anular',
      variant: 'danger',
    });
    if (!ok) return;

    if (this.requiereAuthSupervisor(e)) {
      this.egresoPendienteAnular.set(e);
      this.authAdminUser.set('');
      this.authAdminPass.set('');
      this.mostrarAuthAnular.set(true);
      return;
    }
    this.ejecutarAnularEgreso(e);
  }

  confirmarAnularSupervisor(): void {
    const e = this.egresoPendienteAnular();
    if (!e) return;
    const u = this.authAdminUser().trim();
    const p = this.authAdminPass();
    if (!u || !p) {
      this.inform('Ingrese usuario y contraseña de un administrador');
      return;
    }
    this.ejecutarAnularEgreso(e, { autorizadoUsername: u, autorizadoPassword: p });
  }

  cancelarAnularSupervisor(): void {
    this.mostrarAuthAnular.set(false);
    this.egresoPendienteAnular.set(null);
    this.authAdminUser.set('');
    this.authAdminPass.set('');
  }

  private ejecutarAnularEgreso(
    e: Egreso,
    auth?: { autorizadoUsername: string; autorizadoPassword: string },
  ): void {
    const id = e.idEgreso;
    if (!id) return;
    this.egresoSvc.eliminar(id, auth).subscribe({
      next: () => {
        this.cancelarAnularSupervisor();
        this.inform('Egreso anulado');
        this.cargar();
      },
      error: (err) => {
        if (err?.error?.code === 'SUPERVISOR_AUTH_REQUIRED') {
          this.mostrarAuthAnular.set(true);
        }
        this.inform(err?.error?.message || 'No se pudo anular');
      },
    });
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
