import { CommonModule } from '@angular/common';

import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';



import { AuthService } from '../../core/services/auth.service';

import { CatalogoService } from '../../core/services/catalogo.service';

import {

  Egreso,

  EgresoDto,

  EgresoService,

  FORMAS_PAGO_EGRESO,

  TipoEgresoCat,

  configTipoEgreso,

  esRetiroCajaTipo,

} from '../../core/services/egreso.service';

import { Empleado, EmpleadoService } from '../../core/services/empleado.service';

import { NominaService, PeriodoNomina } from '../../core/services/nomina.service';

import { ReciboService } from '../../core/services/recibo.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import {
  tieneSoporteEgreso,
  tituloSoporteEgreso,
} from '../../core/utils/egreso-soporte.helpers';
import {
  CajaActivaResponse,
  CajaAbiertaItem,
  CajaCierreGeneral,
  CajaSesion,
  CajaSesionService,
  CierreCajaResponse,
  ResumenCaja,
  ResumenCierreGeneral,
} from '../../core/services/caja-sesion.service';



@Component({

  selector: 'argo-egresos-admin',

  standalone: true,

  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],

  templateUrl: './egresos-admin.component.html',

  styleUrls: ['./egresos-admin.component.scss'],

})

export class EgresosAdminComponent implements OnInit {

  private svc = inject(EgresoService);

  private nominaSvc = inject(NominaService);

  private empSvc = inject(EmpleadoService);

  private catSvc = inject(CatalogoService);

  private route = inject(ActivatedRoute);

  private router = inject(Router);

  private auth = inject(AuthService);

  private reciboSvc = inject(ReciboService);

  private confirm = inject(ConfirmDialogService);
  private cajaSvc = inject(CajaSesionService);



  readonly formasPago = FORMAS_PAGO_EGRESO;



  egresos = signal<Egreso[]>([]);

  empleados = signal<Empleado[]>([]);

  periodosNomina = signal<PeriodoNomina[]>([]);

  tiposEgreso = signal<TipoEgresoCat[]>([]);

  cuentasBancarias = signal<any[]>([]);

  bancos = signal<any[]>([]);



  loading = signal(false);

  saving = signal(false);

  msg = signal<string | null>(null);

  busqueda = signal('');

  filtroNumeroDocumento = signal<string | null>(null);

  empleadoSelId = signal<number | null>(null);

  /** true = empleado RRHH; false = tercero (tienda, proveedor, etc.) */

  beneficiarioEmpleado = signal(true);

  editando = signal<Egreso | null>(null);

  mostrarForm = signal(false);
  /** Ruta /caja/egresos/nuevo — solo formulario, vuelve a lista de sesión */
  modoSoloForm = signal(false);

  archivoSoporte = signal<File | null>(null);

  previewSoporte = signal<string | null>(null);



  isAdmin = signal(false);

  cajaAbierta = signal(false);
  sesionCaja = signal<CajaActivaResponse['sesion']>(null);
  resumenParcial = signal<ResumenCaja | null>(null);
  mostrarApertura = signal(false);
  mostrarCierre = signal(false);
  resumenCierre = signal<CierreCajaResponse | null>(null);
  saldoInicialApertura = signal(0);
  obsApertura = signal('');
  obsCierre = signal('');
  cajaLoading = signal(false);

  /** Admin: mi | todas | general */
  panelCaja = signal<'mi' | 'todas' | 'general'>('mi');
  cajasAbiertasTodas = signal<CajaAbiertaItem[]>([]);
  historialCajas = signal<CajaSesion[]>([]);
  previewGeneral = signal<ResumenCierreGeneral | null>(null);
  cierresGenerales = signal<CajaCierreGeneral[]>([]);
  fechaGenDesde = signal(new Date().toISOString().slice(0, 10));
  fechaGenHasta = signal(new Date().toISOString().slice(0, 10));
  obsCierreGeneral = signal('');
  filtroHistDesde = signal(new Date().toISOString().slice(0, 10));
  filtroHistHasta = signal(new Date().toISOString().slice(0, 10));



  requiereRefBancaria = computed(() => {

    const f = this.form().formaPago || '';

    return f !== 'Efectivo' && f !== '';

  });



  tipoSeleccionado = computed(() => {

    const id = this.form().tipoEgreso;

    if (!id) return null;

    return this.tiposEgreso().find((t) => String(t.idTipoEgreso) === String(id)) ?? null;

  });



  cfgTipoSel = computed(() => configTipoEgreso(this.tipoSeleccionado()));



  obligaEmpleado = computed(() => this.cfgTipoSel().requiereEmpleado);



  esAnticipoNomina = computed(() => this.cfgTipoSel().generaDeduccion);

  esRetiroCaja = computed(() => esRetiroCajaTipo(this.tipoSeleccionado()));

  requiereAutorizacionSupervisor = computed(() => {
    if (this.auth.isAdmin()) return false;
    if (this.editando()) return true;
    return this.esRetiroCaja() && !this.editando();
  });

  egresoPendienteAnular = signal<Egreso | null>(null);
  mostrarAuthAnular = signal(false);

  egresosSinSoporte = computed(() =>
    this.egresos().filter((e) => !this.tieneSoporte(e)),
  );

  cantSinSoporte = computed(() => this.egresosSinSoporte().length);

  authAdminUser = signal('');
  authAdminPass = signal('');

  periodosAbiertos = computed(() =>

    this.periodosNomina()

      .filter((p) => !['cerrado', 'pagado'].includes(p.estado))

      .sort((a, b) => b.ano - a.ano || b.mes - a.mes),

  );



  form = signal<EgresoDto>(this.formVacio());



  ngOnInit(): void {

    const r = String(this.auth.user()?.rol || '').toLowerCase();

    this.isAdmin.set(r.includes('admin'));

    this.empSvc.listar({ activos: true }).subscribe({

      next: (e) => this.empleados.set((e || []).filter((x) => x.numeroDocumento)),

    });

    this.catSvc.list('tipoEgreso', { refresh: true }).subscribe({

      next: (r) => this.tiposEgreso.set((r || []) as TipoEgresoCat[]),

    });

    this.catSvc.list('cuentasBancarias', { refresh: true }).subscribe({

      next: (r) => this.cuentasBancarias.set(r || []),

    });

    this.catSvc.list('bancos', { refresh: true }).subscribe({ next: (r) => this.bancos.set(r || []) });

    this.nominaSvc.listarPeriodos().subscribe({

      next: (p) => this.periodosNomina.set(p || []),

    });



    this.route.queryParamMap.subscribe((qp) => {

      const nd = qp.get('numeroDocumento') || qp.get('numDoc');

      this.filtroNumeroDocumento.set(nd ? String(nd) : null);

      this.cargar();

    });

    this.cargarEstadoCaja();
    if (this.router.url.includes('/egresos/nuevo')) {
      this.modoSoloForm.set(true);
      this.mostrarForm.set(true);
      this.nuevo();
      return;
    }
    const editId = this.route.snapshot.paramMap.get('id');
    if (editId && this.router.url.includes('/egresos/editar/')) {
      this.modoSoloForm.set(true);
      this.svc.obtener(editId).subscribe({
        next: (e) => this.editar(e),
        error: (err) => {
          this.msg.set(err?.error?.message || 'No se pudo cargar el egreso');
          void this.router.navigate(['/app/caja/egresos']);
        },
      });
    }
  }

  cambiarPanelCaja(p: 'mi' | 'todas' | 'general'): void {
    this.panelCaja.set(p);
    if (p === 'todas') {
      this.cargarCajasAbiertasAdmin();
      this.cargarHistorialCajas();
    }
    if (p === 'general') {
      this.cargarPreviewGeneral();
      this.cargarCierresGenerales();
    }
  }

  cargarCajasAbiertasAdmin(): void {
    if (!this.isAdmin()) return;
    this.cajaSvc.listarAbiertas().subscribe({
      next: (r) => this.cajasAbiertasTodas.set(r || []),
      error: () => this.cajasAbiertasTodas.set([]),
    });
  }

  cargarHistorialCajas(): void {
    if (!this.isAdmin()) return;
    this.cajaSvc
      .listar({
        todas: true,
        desde: this.filtroHistDesde(),
        hasta: this.filtroHistHasta(),
        limit: 50,
      })
      .subscribe({
        next: (r) => this.historialCajas.set(r || []),
      });
  }

  cerrarCajaAjena(item: CajaAbiertaItem): void {
    if (!this.isAdmin() || !item.sesion?.idSesion) return;
    if (!confirm(`¿Cerrar la caja de ${item.sesion.usuario} (sesión #${item.sesion.idSesion})?`)) return;
    this.cajaLoading.set(true);
    this.cajaSvc.cerrar(item.sesion.idSesion, { observaciones: 'Cierre por administrador' }).subscribe({
      next: () => {
        this.cajaLoading.set(false);
        this.msg.set(`Caja #${item.sesion.idSesion} cerrada`);
        this.cargarCajasAbiertasAdmin();
        this.cargarHistorialCajas();
        this.cargarEstadoCaja();
      },
      error: (e) => {
        this.cajaLoading.set(false);
        this.msg.set(e?.error?.message || 'No se pudo cerrar');
      },
    });
  }

  cargarPreviewGeneral(): void {
    if (!this.isAdmin()) return;
    this.cajaSvc.previewCierreGeneral(this.fechaGenDesde(), this.fechaGenHasta()).subscribe({
      next: (r) => this.previewGeneral.set(r),
      error: (e) => this.msg.set(e?.error?.message || 'Error al calcular cierre'),
    });
  }

  confirmarCierreGeneral(forzar = false): void {
    if (!this.isAdmin()) return;
    this.cajaLoading.set(true);
    this.cajaSvc
      .registrarCierreGeneral({
        desde: this.fechaGenDesde(),
        hasta: this.fechaGenHasta(),
        observaciones: this.obsCierreGeneral() || undefined,
        forzar,
      })
      .subscribe({
        next: (r) => {
          this.previewGeneral.set(r.resumen);
          this.cajaLoading.set(false);
          this.msg.set(`Cierre general #${r.cierre.idCierreGeneral} registrado`);
          this.cargarCierresGenerales();
        },
        error: (e) => {
          this.cajaLoading.set(false);
          const abiertas = e?.error?.cajasAbiertas?.length;
          if (e?.status === 409 && abiertas && confirm(`${e.error.message}\n\n¿Registrar igualmente?`)) {
            this.confirmarCierreGeneral(true);
            return;
          }
          this.msg.set(e?.error?.message || 'No se pudo registrar el cierre general');
        },
      });
  }

  cargarCierresGenerales(): void {
    if (!this.isAdmin()) return;
    this.cajaSvc.listarCierresGenerales().subscribe({
      next: (r) => this.cierresGenerales.set(r || []),
    });
  }

  cargarEstadoCaja(): void {
    this.cajaSvc.activa().subscribe({
      next: (r) => {
        this.cajaAbierta.set(!!r.abierta);
        this.sesionCaja.set(r.sesion);
        this.resumenParcial.set(r.resumenParcial ?? null);
      },
      error: () => {
        this.cajaAbierta.set(false);
        this.sesionCaja.set(null);
      },
    });
  }

  abrirModalApertura(): void {
    this.saldoInicialApertura.set(0);
    this.obsApertura.set('');
    this.mostrarApertura.set(true);
  }

  confirmarApertura(): void {
    this.cajaLoading.set(true);
    this.cajaSvc.abrir(this.saldoInicialApertura(), this.obsApertura() || undefined).subscribe({
      next: () => {
        this.mostrarApertura.set(false);
        this.cajaLoading.set(false);
        this.msg.set('Caja abierta correctamente');
        this.cargarEstadoCaja();
      },
      error: (e) => {
        this.cajaLoading.set(false);
        this.msg.set(e?.error?.message || 'No se pudo abrir la caja');
      },
    });
  }

  abrirModalCierre(): void {
    if (!this.sesionCaja()?.idSesion) return;
    this.obsCierre.set('');
    this.resumenCierre.set(null);
    this.mostrarCierre.set(true);
  }

  confirmarCierre(): void {
    const id = this.sesionCaja()?.idSesion;
    if (!id) return;
    this.cajaLoading.set(true);
    this.cajaSvc.cerrar(id, { observaciones: this.obsCierre() || undefined }).subscribe({
      next: (r) => {
        this.resumenCierre.set(r);
        this.cajaLoading.set(false);
        this.cajaAbierta.set(false);
        this.sesionCaja.set(null);
        this.resumenParcial.set(null);
      },
      error: (e) => {
        this.cajaLoading.set(false);
        this.msg.set(e?.error?.message || 'No se pudo cerrar la caja');
      },
    });
  }

  cerrarModalCierre(): void {
    this.mostrarCierre.set(false);
    this.resumenCierre.set(null);
    this.cargarEstadoCaja();
  }



  private formVacio(): EgresoDto {

    return {

      fechaEgreso: new Date().toISOString().slice(0, 10),

      valorEgreso: 0,

      pagueA: '',

      numeroDocumento: '',

      concepto: '',

      tipoEgreso: '',

      formaPago: 'Efectivo',

      numTransferencia: '',

      fechaTransferencia: '',

      cuentaOrigen: '',

      cuentaDestino: '',

      bancoDestino: '',

      idPeriodo: '',

    };

  }



  cargar() {

    this.loading.set(true);

    const q = this.busqueda().trim();

    const nd = this.filtroNumeroDocumento();

    this.svc

      .listar({

        q: q.length >= 2 ? q : undefined,

        numeroDocumento: nd || undefined,

      })

      .subscribe({

        next: (r) => {

          this.egresos.set(r || []);

          this.loading.set(false);

        },

        error: (e) => {

          this.loading.set(false);

          this.msg.set(e?.error?.message || 'Error cargando egresos');

        },

      });

  }



  limpiarFiltro() {

    this.filtroNumeroDocumento.set(null);

    this.cargar();

  }



  nuevo() {

    this.editando.set(null);

    const nd = this.filtroNumeroDocumento();

    const emp = nd ? this.empleados().find((e) => e.numeroDocumento === nd) : null;

    const abiertos = this.periodosAbiertos();

    this.beneficiarioEmpleado.set(!!emp);

    this.empleadoSelId.set(emp?.idEmpleado ?? null);

    this.form.set({

      ...this.formVacio(),

      numeroDocumento: emp?.numeroDocumento ?? '',

      pagueA: emp?.nombreCompleto || '',

      idPeriodo: abiertos[0]?.idPeriodo ?? '',

    });

    this.archivoSoporte.set(null);

    this.previewSoporte.set(null);

    this.limpiarAutorizacionRetiro();

    this.mostrarForm.set(true);

    this.msg.set(null);

  }



  editar(e: Egreso) {

    if (!this.puedeGestionarEgreso(e)) {

      this.msg.set('Solo puede editar egresos de su sesión de caja actual.');

      return;

    }

    this.limpiarAutorizacionRetiro();

    this.editando.set(e);

    const emp = e.numeroDocumento

      ? this.empleados().find((x) => x.numeroDocumento === e.numeroDocumento)

      : null;

    this.beneficiarioEmpleado.set(!!e.numeroDocumento);

    this.empleadoSelId.set(emp?.idEmpleado ?? null);

    this.form.set({

      fechaEgreso: e.fechaEgreso ? String(e.fechaEgreso).slice(0, 10) : new Date().toISOString().slice(0, 10),

      valorEgreso: e.valorEgreso || 0,

      pagueA: e.pagueA || e.empleadoNombre || '',

      numeroDocumento: e.numeroDocumento ?? '',

      concepto: e.concepto || '',

      tipoEgreso: e.tipoEgreso ? String(e.tipoEgreso) : '',

      formaPago: e.formaPago || 'Efectivo',

      numTransferencia: e.numTransferencia || '',

      fechaTransferencia: e.fechaTransferencia || '',

      cuentaOrigen: e.cuentaOrigen ? String(e.cuentaOrigen) : '',

      cuentaDestino: e.cuentaDestino || '',

      bancoDestino: e.bancoDestino ? String(e.bancoDestino) : '',

      idPeriodo: e.idPeriodo ?? '',

    });

    this.archivoSoporte.set(null);

    this.previewSoporte.set(this.svc.urlArchivo(e.urlSoporte));

    this.mostrarForm.set(true);

    this.msg.set(null);

  }



  cancelar() {

    this.mostrarForm.set(false);

    this.editando.set(null);

    this.archivoSoporte.set(null);

    this.limpiarAutorizacionRetiro();

    if (this.modoSoloForm()) {
      void this.router.navigate(['/app/caja/egresos']);
    }

  }



  limpiarAutorizacionRetiro() {

    this.authAdminUser.set('');

    this.authAdminPass.set('');

  }



  patch<K extends keyof EgresoDto>(k: K, v: EgresoDto[K]) {

    this.form.update((f) => ({ ...f, [k]: v }));

  }



  onTipoEgresoChange(id: string) {

    this.patch('tipoEgreso', id);

    this.limpiarAutorizacionRetiro();

    const tipo = this.tiposEgreso().find((t) => String(t.idTipoEgreso) === String(id)) ?? null;

    const cfg = configTipoEgreso(tipo);

    if (esRetiroCajaTipo(tipo)) {

      this.beneficiarioEmpleado.set(false);

      return;

    }

    if (cfg.requiereEmpleado) {

      this.beneficiarioEmpleado.set(true);

    }

  }



  setBeneficiarioEmpleado(esEmpleado: boolean) {

    if (this.obligaEmpleado() && !esEmpleado) return;

    this.beneficiarioEmpleado.set(esEmpleado);

    if (!esEmpleado) {

      this.empleadoSelId.set(null);

      this.form.update((f) => ({ ...f, numeroDocumento: '' }));

    } else {

      this.form.update((f) => ({ ...f, pagueA: f.pagueA || '' }));

    }

  }



  onEmpleadoChange(idEmpleado: number | null) {

    this.empleadoSelId.set(idEmpleado);

    if (idEmpleado == null) {

      this.form.update((f) => ({ ...f, numeroDocumento: '' }));

      return;

    }

    const emp = this.empleados().find((e) => e.idEmpleado === idEmpleado);

    if (!emp?.numeroDocumento) return;

    this.form.update((f) => ({

      ...f,

      pagueA: emp.nombreCompleto || '',

      numeroDocumento: emp.numeroDocumento,

    }));

  }



  onSoporte(ev: Event) {

    const input = ev.target as HTMLInputElement;

    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {

      this.msg.set('Seleccione una imagen (JPG, PNG, etc.).');

      input.value = '';

      return;

    }

    this.archivoSoporte.set(file);

    const reader = new FileReader();

    reader.onload = () => this.previewSoporte.set(String(reader.result));

    reader.readAsDataURL(file);

  }



  quitarSoporte() {

    this.archivoSoporte.set(null);

    this.previewSoporte.set(null);

  }



  guardar() {

    const f = this.form();

    const ed = this.editando();

    if (!f.concepto?.trim()) {

      this.msg.set('El concepto es obligatorio.');

      return;

    }

    if (!(Number(f.valorEgreso) > 0)) {

      this.msg.set('Indique un valor mayor a cero.');

      return;

    }

    if (!f.pagueA?.trim()) {

      this.msg.set('Indique el beneficiario (a quién se pagó).');

      return;

    }

    if (!f.numeroDocumento?.trim()) {

      this.msg.set('Indique el número de identificación del beneficiario (CC, NIT, etc.).');

      return;

    }

    if (!f.tipoEgreso) {

      this.msg.set('Seleccione el tipo de egreso.');

      return;

    }

    if (!this.esRetiroCaja() && (this.obligaEmpleado() || this.beneficiarioEmpleado())) {

      if (!this.empleados().some((e) => e.numeroDocumento === f.numeroDocumento?.trim())) {

        this.msg.set('Seleccione el empleado de RRHH para este egreso.');

        return;

      }

    }

    if (this.esAnticipoNomina() && !ed) {

      if (!f.idPeriodo) {

        this.msg.set('Seleccione el período de nómina donde se descontará.');

        return;

      }

    }

    if (ed && (ed.anticipoNomina || ed.idNovedadGenerada)) {

      this.msg.set('Los egresos de préstamo/adelanto no se editan; elimine y vuelva a crear si fue un error.');

      return;

    }

    if (ed && !this.puedeGestionarEgreso(ed)) {

      this.msg.set('Solo puede editar egresos de su sesión de caja actual.');

      return;

    }

    if (!ed && !this.cajaAbierta()) {

      this.msg.set('Debe abrir su caja antes de registrar egresos (Resumen del día → Abrir caja).');

      return;

    }

    if (this.requiereAutorizacionSupervisor()) {

      const u = this.authAdminUser().trim();

      const p = this.authAdminPass();

      if (!u || !p) {

        this.msg.set('Ingrese usuario y contraseña de un administrador en el panel de autorización.');

        return;

      }

      this.ejecutarGuardar({ autorizadoUsername: u, autorizadoPassword: p });

      return;

    }

    this.ejecutarGuardar();

  }



  private ejecutarGuardar(auth?: { autorizadoUsername: string; autorizadoPassword: string }) {

    const f = this.form();

    const ed = this.editando();

    const payload: EgresoDto = { ...f };

    if (!this.esAnticipoNomina()) {

      delete payload.idPeriodo;

    }

    this.saving.set(true);

    this.msg.set(null);

    const soporte = this.archivoSoporte();

    const req = ed

      ? this.svc.actualizar(ed.idEgreso, payload, soporte, auth)

      : this.svc.crear(payload, soporte, auth);

    req.subscribe({

      next: (res) => {

        this.saving.set(false);

        this.limpiarAutorizacionRetiro();

        this.mostrarForm.set(false);

        if (this.modoSoloForm()) {
          void this.router.navigate(['/app/caja/egresos']);
          return;
        }

        this.cargar();

        let txt = ed ? 'Egreso actualizado.' : 'Egreso registrado.';

        const eg = res as Egreso & { novedadAnticipo?: { idNovedad: number; idPeriodo: number; periodoNombre?: string } };

        const nov = eg?.novedadAnticipo;

        if (nov?.idNovedad) {

          txt += ` Deducción en nómina #${nov.idNovedad} (${nov.periodoNombre || nov.idPeriodo}).`;

        }

        if (eg.numRecibo) txt += ` Comprobante ${eg.numRecibo}.`;

        if (!this.tieneSoporte(eg)) {
          txt += ' Atención: quedó sin soporte adjunto.';
        }

        this.msg.set(txt);

        if (!ed && eg.idEgreso) {

          void this.preguntarImprimirRecibo(eg.idEgreso, eg.numRecibo);

        }

      },

      error: (e) => {

        this.saving.set(false);

        this.msg.set(e?.error?.message || 'Error al guardar');

      },

    });

  }



  async eliminar(e: Egreso) {

    if (!this.puedeGestionarEgreso(e)) {

      this.msg.set('Solo puede anular egresos de su sesión de caja actual.');

      return;

    }

    const ok = await this.confirm.open({

      title: 'Anular egreso',

      message: `¿Anular el egreso a ${e.pagueA || e.concepto}?`,

      confirmLabel: 'Anular',

      variant: 'danger',

    });

    if (!ok) return;

    if (!this.auth.isAdmin()) {

      this.egresoPendienteAnular.set(e);

      this.limpiarAutorizacionRetiro();

      this.mostrarAuthAnular.set(true);

      return;

    }

    this.ejecutarEliminar(e);

  }



  confirmarAnularConSupervisor() {

    const e = this.egresoPendienteAnular();

    if (!e) return;

    const u = this.authAdminUser().trim();

    const p = this.authAdminPass();

    if (!u || !p) {

      this.msg.set('Ingrese usuario y contraseña del administrador para anular.');

      return;

    }

    this.ejecutarEliminar(e, { autorizadoUsername: u, autorizadoPassword: p });

  }



  cancelarAnularSupervisor() {

    this.mostrarAuthAnular.set(false);

    this.egresoPendienteAnular.set(null);

    this.limpiarAutorizacionRetiro();

  }



  private ejecutarEliminar(

    e: Egreso,

    auth?: { autorizadoUsername: string; autorizadoPassword: string },

  ) {

    this.svc.eliminar(e.idEgreso, auth).subscribe({

      next: () => {

        this.mostrarAuthAnular.set(false);

        this.egresoPendienteAnular.set(null);

        this.limpiarAutorizacionRetiro();

        this.cargar();

        this.msg.set('Egreso anulado.');

      },

      error: (err) => this.msg.set(err?.error?.message || 'No se pudo anular'),

    });

  }



  puedeGestionarEgreso(e: Egreso): boolean {

    if (this.isAdmin()) return true;

    if (!this.cajaAbierta() || this.sesionCaja()?.idSesion == null) return false;

    if (e.idSesion == null) return false;

    return Number(e.idSesion) === Number(this.sesionCaja()?.idSesion);

  }



  tituloAutorizacionSupervisor(): string {

    if (this.mostrarAuthAnular()) return 'Autorización para anular egreso';

    if (this.editando()) return 'Autorización para modificar egreso';

    return 'Autorización de administrador (retiro)';

  }



  urlSoporte(e: Egreso): string | null {

    return this.svc.urlArchivo(e.urlSoporte);

  }

  tieneSoporte = tieneSoporteEgreso;

  tituloSoporte = tituloSoporteEgreso;

  faltaSoporteEnForm(): boolean {
    if (this.archivoSoporte()) return false;
    const ed = this.editando();
    if (ed?.urlSoporte) return false;
    if (this.previewSoporte()) return false;
    return true;
  }

  onAlarmaSoporte(e: Egreso, ev?: Event) {
    ev?.stopPropagation();
    if (this.puedeGestionarEgreso(e)) {
      this.editar(e);
      this.msg.set('Adjunte el soporte (imagen) en el formulario y guarde.');
      return;
    }
    this.msg.set(
      `Egreso ${e.numRecibo || e.concepto || ''} sin soporte. Solicite a un administrador que adjunte el comprobante.`,
    );
  }

  imprimirRecibo(e: Egreso) {

    this.reciboSvc.abrirHtmlEgreso(e.idEgreso, (m) => this.msg.set(m));

  }

  abrirReciboPantalla(e: Egreso) {

    void this.router.navigate(['/recibo-egreso', e.idEgreso]);

  }

  private async preguntarImprimirRecibo(idEgreso: string, numRecibo?: string | null) {

    const ref = numRecibo ? ` (${numRecibo})` : '';

    const ok = await this.confirm.open({

      title: 'Imprimir comprobante de egreso',

      message: `¿Desea imprimir el comprobante de egreso${ref}? Incluye espacio para firma del beneficiario.`,

      confirmLabel: 'Imprimir',

      cancelLabel: 'Después',

      variant: 'primary',

    });

    if (ok) this.reciboSvc.abrirHtmlEgreso(idEgreso, (m) => this.msg.set(m));

  }



  labelTipoEgreso(row: TipoEgresoCat): string {

    const cfg = configTipoEgreso(row);

    const base = row?.tipo || String(row?.idTipoEgreso ?? '');

    if (cfg.generaDeduccion) return `${base} (nómina −)`;

    if (cfg.efectoNomina === 'pago_sueldo') return `${base} (empleado)`;

    return base;

  }



  hintTipoSeleccionado(): string {

    const t = this.tipoSeleccionado();

    if (!t) {
      return 'Elija el tipo según el gasto. Configúrelos en Configuración → Catálogos → Tipos de egreso (requiereEmpleado / efectoNomina).';
    }

    if (this.esRetiroCaja()) {
      return 'Traslado de efectivo (consignación, caja fuerte, etc.). No requiere empleado RRHH; sí autorización de admin si usted es cajero.';
    }

    const cfg = this.cfgTipoSel();

    if (cfg.generaDeduccion) {

      return 'Este tipo desembolsa caja hoy y genera una deducción automática en el período de nómina indicado.';

    }

    if (cfg.efectoNomina === 'pago_sueldo') {

      return 'Pago al empleado (p. ej. liquidación de nómina). Debe vincular empleado.';

    }

    if (cfg.requiereEmpleado) {

      return 'Debe seleccionar un empleado de RRHH.';

    }

    return 'Puede pagar a un tercero (tienda, proveedor, etc.) sin vincular empleado.';

  }



  labelCuenta(c: any): string {

    const b = (c?.banco || '').trim();

    const n = c?.numCuenta ?? '';

    const t = (c?.tipo || '').trim();

    return [b, t, n].filter(Boolean).join(' — ');

  }



  labelBanco(b: any): string {

    return (b?.banco || b?.descripcion || b?.nombre || String(b?.idBanco ?? b?.idbanco ?? '')).trim();

  }



  labelAnticipo(e: Egreso): string {

    const ef = e.tipoEfectoNomina || e.anticipoNomina;

    if (ef === 'prestamo') return 'Préstamo';

    if (ef === 'abono_adelanto') return 'Adelanto';

    return '';

  }



  filtroEmpleadoLabel(): string {

    const nd = this.filtroNumeroDocumento();

    if (!nd) return '';

    const e = this.empleados().find((x) => x.numeroDocumento === nd);

    return e?.nombreCompleto || `Doc. ${nd}`;

  }

}


