import { CommonModule } from '@angular/common';

import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';



import { AuthService } from '../../core/services/auth.service';
import { PermisoService } from '../../core/services/permiso.service';
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
import { Tercero, TerceroService } from '../../core/services/tercero.service';
import { NominaService, PeriodoNomina } from '../../core/services/nomina.service';
import { ReciboService } from '../../core/services/recibo.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { CajaAperturaAlertService } from '../../core/services/caja-apertura-alert.service';
import { CajaEstadoService } from '../../core/services/caja-estado.service';
import { ComprobanteHoyAlertService } from '../../core/services/comprobante-hoy-alert.service';
import {
  tieneSoporteEgreso,
  tituloSoporteEgreso,
} from '../../core/utils/egreso-soporte.helpers';
import { PagoSoporteFieldComponent } from '../../shared/pago-soporte-field/pago-soporte-field.component';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
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

  imports: [CommonModule, FormsModule, RouterLink,
    ArgoDateInputComponent,
    PagoSoporteFieldComponent,
    CatalogoEnumBuscarComponent,
  ],

  templateUrl: './egresos-admin.component.html',

  styleUrls: ['./egresos-admin.component.scss'],

})

export class EgresosAdminComponent implements OnInit {

  private svc = inject(EgresoService);

  private nominaSvc = inject(NominaService);

  private empSvc = inject(EmpleadoService);
  private terSvc = inject(TerceroService);

  private catSvc = inject(CatalogoService);

  private route = inject(ActivatedRoute);

  private router = inject(Router);

  private auth = inject(AuthService);
  private permisos = inject(PermisoService);

  private reciboSvc = inject(ReciboService);

  private confirm = inject(ConfirmDialogService);
  private cajaSvc = inject(CajaSesionService);
  private cajaAlert = inject(CajaAperturaAlertService);
  private cajaEstado = inject(CajaEstadoService);
  private comprobanteAlertSvc = inject(ComprobanteHoyAlertService);



  readonly formasPago = FORMAS_PAGO_EGRESO;



  egresos = signal<Egreso[]>([]);

  empleados = signal<Empleado[]>([]);
  terceros = signal<Tercero[]>([]);
  terceroSelId = signal<string | null>(null);
  terceroTexto = signal('');
  empleadoTexto = signal('');
  tipoEgresoTexto = signal('');
  formaPagoTexto = signal('');
  cuentaOrigenTexto = signal('');
  bancoDestinoTexto = signal('');
  periodoTexto = signal('');

  periodosNomina = signal<PeriodoNomina[]>([]);

  tiposEgreso = signal<TipoEgresoCat[]>([]);

  cuentasBancarias = signal<any[]>([]);

  bancos = signal<any[]>([]);



  loading = signal(false);

  saving = signal(false);

  msg = signal<string | null>(null);
  msgError = signal(false);

  busqueda = signal('');

  filtroNumeroDocumento = signal<string | null>(null);

  empleadoSelId = signal<number | null>(null);

  /** true = empleado RRHH; false = tercero (tienda, proveedor, etc.) */

  beneficiarioEmpleado = signal(false);

  editando = signal<Egreso | null>(null);

  mostrarForm = signal(false);
  /** Ruta /caja/egresos/nuevo — solo formulario, vuelve a lista de sesión */
  modoSoloForm = signal(false);
  returnUrl = signal<string | null>(null);

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
  obsCierreGeneral = signal('');
  filtroHistDesde = signal(new Date().toISOString().slice(0, 10));
  filtroHistHasta = signal(new Date().toISOString().slice(0, 10));



  /** Cajero editando: solo forma de pago, consignación y soporte (sin auth admin). */
  modoComplementoCajero = computed(() => !!this.editando() && !this.isAdmin());

  requiereRefBancaria = computed(() => {

    const f = this.form().formaPago || '';

    return f !== 'Efectivo' && f !== '';

  });

  /** En egresos el pantallazo puede ir después; solo se exige el Nº de consignación. */
  mensajePagoIntangible = computed(() => {
    if (!this.requiereRefBancaria()) return null;
    if (String(this.form().numTransferencia || '').trim()) return null;
    return 'Indique el número de comprobante o consignación (el soporte puede adjuntarlo después).';
  });

  /** Tras pulsar Guardar: se marcan en rojo los obligatorios vacíos. */
  intentoGuardar = signal(false);

  /** Mapa campo → mensaje de error (solo campos aplicables al modo actual). */
  erroresFormulario = computed(() => {
    const f = this.form();
    const err: Record<string, string> = {};

    if (this.modoComplementoCajero()) {
      if (!String(f.formaPago || '').trim()) {
        err['formaPago'] = 'Seleccione la forma de pago.';
      }
      if (this.requiereRefBancaria() && !String(f.numTransferencia || '').trim()) {
        err['numTransferencia'] = 'Indique el número de comprobante o consignación.';
      }
      return err;
    }

    if (!String(f.fechaEgreso || '').trim()) {
      err['fechaEgreso'] = 'La fecha del egreso es obligatoria.';
    }
    if (!(Number(f.valorEgreso) > 0)) {
      err['valorEgreso'] = 'Indique un valor mayor a cero.';
    }
    if (!f.tipoEgreso) {
      err['tipoEgreso'] = 'Seleccione el tipo de egreso.';
    }
    if (this.obligaVehiculo()) {
      if (!String(f.placa || '').trim()) {
        err['placa'] = 'Indique la placa del vehículo.';
      } else if (this.placaVehiculoError()) {
        err['placa'] = this.placaVehiculoError() || 'Placa no válida.';
      } else if (!this.placaVehiculoInfo()) {
        err['placa'] = 'Verifique la placa: debe existir en Vehículos.';
      }
    }
    if (!this.esRetiroCaja() && (this.obligaEmpleado() || this.beneficiarioEmpleado())) {
      if (!this.empleadoSelId()) {
        err['empleado'] = 'Seleccione el empleado de RRHH.';
      }
    }
    if (!this.esRetiroCaja() && !this.obligaEmpleado() && !this.beneficiarioEmpleado()) {
      if (!this.terceroSelId() || !f.idTercero) {
        err['tercero'] = 'Seleccione el tercero del catálogo.';
      }
    }
    if (!String(f.numeroDocumento || '').trim()) {
      err['numeroDocumento'] = 'Indique el número de identificación del beneficiario.';
    }
    if (!String(f.pagueA || '').trim()) {
      err['pagueA'] = 'Indique el nombre del beneficiario.';
    }
    if (!String(f.concepto || '').trim()) {
      err['concepto'] = 'El concepto es obligatorio.';
    }
    if (this.requiereRefBancaria() && !String(f.numTransferencia || '').trim()) {
      err['numTransferencia'] = 'Indique el número de comprobante o consignación.';
    }
    if (this.requiereAutorizacionSupervisor()) {
      if (!this.authAdminUser().trim()) {
        err['authAdminUser'] = 'Usuario administrador obligatorio.';
      }
      if (!this.authAdminPass()) {
        err['authAdminPass'] = 'Contraseña de administrador obligatoria.';
      }
    }
    return err;
  });

  listaErroresFormulario = computed(() => Object.values(this.erroresFormulario()));

  invalido(campo: string): boolean {
    return this.intentoGuardar() && !!this.erroresFormulario()[campo];
  }

  msgCampo(campo: string): string | null {
    if (!this.intentoGuardar()) return null;
    return this.erroresFormulario()[campo] || null;
  }

  puedeGuardarEgreso = computed(() => Object.keys(this.erroresFormulario()).length === 0);

  opcionesTipoEgreso = computed<EnumBuscarOption[]>(() =>
    this.tiposEgreso().map((t) => ({
      value: String(t.idTipoEgreso),
      label: this.labelTipoEgreso(t),
    })),
  );

  opcionesEmpleado = computed<EnumBuscarOption[]>(() =>
    this.empleados().map((e) => ({
      value: e.idEmpleado,
      label: `${e.nombreCompleto || ''} — ${e.numeroDocumento || ''}`.trim(),
      hint: e.cargoNombre || undefined,
    })),
  );

  opcionesTercero = computed<EnumBuscarOption[]>(() =>
    this.terceros().map((t) => ({
      value: String(t._id),
      label: this.labelTercero(t),
      hint: t.correo || t.telefono || undefined,
    })),
  );

  opcionesFormaPago = computed<EnumBuscarOption[]>(() =>
    this.formasPago.map((fp) => ({ value: fp, label: fp })),
  );

  opcionesCuentaOrigen = computed<EnumBuscarOption[]>(() =>
    this.cuentasBancarias().map((c) => ({
      value: String(c.idCuentaBancaria ?? ''),
      label: this.labelCuenta(c),
    })),
  );

  opcionesBanco = computed<EnumBuscarOption[]>(() =>
    this.bancos().map((b) => ({
      value: String(b.idBanco || b.idbanco || ''),
      label: this.labelBanco(b),
    })),
  );

  opcionesPeriodo = computed<EnumBuscarOption[]>(() => [
    { value: '', label: '— Automático (período abierto) —' },
    ...this.periodosAbiertos().map((p) => ({
      value: p.idPeriodo,
      label: `${p.nombre} (${p.estado})`,
    })),
  ]);

  contactoVisible = computed(() => {
    const f = this.form();
    return !!(f.correoBeneficiario || f.direccionBeneficiario || f.telefonoBeneficiario);
  });

  tipoSeleccionado = computed(() => {
    const id = this.form().tipoEgreso;
    if (!id) return null;
    return this.tiposEgreso().find((t) => String(t.idTipoEgreso) === String(id)) ?? null;
  });

  cfgTipoSel = computed(() => configTipoEgreso(this.tipoSeleccionado()));



  obligaEmpleado = computed(() => this.cfgTipoSel().requiereEmpleado);

  obligaVehiculo = computed(() => this.cfgTipoSel().requiereVehiculo);

  esAnticipoNomina = computed(() => this.cfgTipoSel().generaDeduccion);

  esRetiroCaja = computed(() => esRetiroCajaTipo(this.tipoSeleccionado()));

  requiereAutorizacionSupervisor = computed(() => {
    if (this.auth.isAdmin()) return false;
    // Complemento pago/soporte del cajero: sin autorización de admin.
    if (this.modoComplementoCajero()) return false;
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

  placaVehiculoInfo = signal<{ placa: string; nombreMarca?: string; nombreLinea?: string; claseVehiculo?: string } | null>(null);

  placaVehiculoError = signal<string | null>(null);

  placaVerificando = signal(false);



  ngOnInit(): void {

    const r = String(this.auth.user()?.rol || '').toLowerCase();

    this.isAdmin.set(r.includes('admin'));

    // Empleados / nómina exigen permiso rrhh. El cajero no lo tiene → 403 «Sin permiso».
    if (this.permisos.tiene('rrhh') || this.isAdmin()) {
      this.empSvc.listar({ activos: true }).subscribe({
        next: (e) => this.empleados.set((e || []).filter((x) => x.numeroDocumento)),
        error: () => this.empleados.set([]),
      });
      this.nominaSvc.listarPeriodos().subscribe({
        next: (p) => this.periodosNomina.set(p || []),
        error: () => this.periodosNomina.set([]),
      });
    }

    this.terSvc.listar().subscribe({
      next: (t) => this.terceros.set(t || []),
      error: () => this.terceros.set([]),
    });

    this.catSvc.list('tipoEgreso', { refresh: true }).subscribe({
      next: (rows) => this.tiposEgreso.set((rows || []) as TipoEgresoCat[]),
    });

    this.catSvc.list('cuentasBancarias', { refresh: true }).subscribe({
      next: (rows) => this.cuentasBancarias.set(rows || []),
    });

    this.catSvc.list('bancos', { refresh: true }).subscribe({ next: (rows) => this.bancos.set(rows || []) });

    const enNuevo = this.router.url.includes('/egresos/nuevo');
    const editId = this.route.snapshot.paramMap.get('id');
    const enEditar = !!(editId && this.router.url.includes('/egresos/editar/'));
    if (enNuevo || enEditar) {
      this.modoSoloForm.set(true);
    }

    this.route.queryParamMap.subscribe((qp) => {
      const nd = qp.get('numeroDocumento') || qp.get('numDoc');
      this.filtroNumeroDocumento.set(nd ? String(nd) : null);
      this.returnUrl.set(qp.get('returnUrl'));
      if (!this.modoSoloForm()) {
        this.cargar();
      }
    });

    if (enNuevo) {
      this.cargarEstadoCaja();
      this.mostrarForm.set(true);
      this.nuevo();
      return;
    }

    if (enEditar && editId) {
      // Esperar estado de caja antes de editar (si no, puedeGestionar falla en falso).
      this.cajaSvc.activa().subscribe({
        next: (act) => {
          this.cajaAbierta.set(!!act.abierta);
          this.sesionCaja.set(act.sesion);
          this.resumenParcial.set(act.resumenParcial ?? null);
          this.svc.obtener(editId).subscribe({
            next: (e) => this.editar(e),
            error: (err) => {
              this.inform(err?.error?.message || 'No se pudo cargar el egreso');
              this.volverTrasSoloForm();
            },
          });
        },
        error: () => {
          this.cajaAbierta.set(false);
          this.sesionCaja.set(null);
          this.inform('Debe tener su caja abierta para editar egresos.');
          this.volverTrasSoloForm();
        },
      });
      return;
    }

    this.cargarEstadoCaja();
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

  async cerrarCajaAjena(item: CajaAbiertaItem): Promise<void> {
    if (!this.isAdmin() || !item.sesion?.idSesion) return;
    const ok = await this.confirm.open({
      title: 'Cerrar caja',
      message: `¿Cerrar la caja de ${item.sesion.usuario} (sesión #${item.sesion.idSesion})?`,
      confirmLabel: 'Cerrar caja',
      variant: 'warn',
    });
    if (!ok) return;
    this.cajaLoading.set(true);
    this.cajaSvc.cerrar(item.sesion.idSesion, { observaciones: 'Cierre por administrador' }).subscribe({
      next: () => {
        this.cajaLoading.set(false);
        this.inform(`Caja #${item.sesion.idSesion} cerrada`);
        this.cargarCajasAbiertasAdmin();
        this.cargarHistorialCajas();
        this.cargarEstadoCaja();
      },
      error: (e) => {
        this.cajaLoading.set(false);
        this.inform(e?.error?.message || 'No se pudo cerrar');
      },
    });
  }

  cargarPreviewGeneral(): void {
    if (!this.isAdmin()) return;
    this.cajaSvc.previewCierreGeneral(this.fechaGenDesde()).subscribe({
      next: (r) => this.previewGeneral.set(r),
      error: (e) => this.inform(e?.error?.message || 'Error al calcular cierre'),
    });
  }

  confirmarCierreGeneral(forzar = false): void {
    if (!this.isAdmin()) return;
    this.cajaLoading.set(true);
    this.cajaSvc
      .registrarCierreGeneral({
        fechaDia: this.fechaGenDesde(),
        observaciones: this.obsCierreGeneral() || undefined,
        forzar,
      })
      .subscribe({
        next: (r) => {
          this.previewGeneral.set(r.resumen);
          this.cajaLoading.set(false);
          this.inform(`Cierre general #${r.cierre.idCierreGeneral} registrado`);
          this.cargarCierresGenerales();
        },
        error: async (e) => {
          this.cajaLoading.set(false);
          const abiertas = e?.error?.cajasAbiertas?.length;
          if (e?.status === 409 && abiertas) {
            const ok = await this.confirm.open({
              title: 'Cajas aún abiertas',
              message: `${e.error.message}\n\n¿Registrar el cierre general igualmente?`,
              confirmLabel: 'Registrar igualmente',
              variant: 'warn',
            });
            if (ok) this.confirmarCierreGeneral(true);
            return;
          }
          this.inform(e?.error?.message || 'No se pudo registrar el cierre general');
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
        this.inform('Caja abierta correctamente');
        void this.cajaEstado.refrescar();
        this.cargarEstadoCaja();
      },
      error: (e) => {
        this.cajaLoading.set(false);
        this.inform(e?.error?.message || 'No se pudo abrir la caja');
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
        this.inform(e?.error?.message || 'No se pudo cerrar la caja');
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

      placa: '',

      idTercero: null,

      correoBeneficiario: '',
      direccionBeneficiario: '',
      telefonoBeneficiario: '',

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

          this.inform(e?.error?.message || 'Error cargando egresos');

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
    this.empleadoTexto.set(emp ? `${emp.nombreCompleto || ''} — ${emp.numeroDocumento || ''}`.trim() : '');
    this.terceroSelId.set(null);
    this.terceroTexto.set('');
    this.tipoEgresoTexto.set('');
    this.formaPagoTexto.set('Efectivo');
    this.cuentaOrigenTexto.set('');
    this.bancoDestinoTexto.set('');
    const abiertosTxt = abiertos[0] ? `${abiertos[0].nombre} (${abiertos[0].estado})` : '';
    this.periodoTexto.set(abiertosTxt);

    this.form.set({

      ...this.formVacio(),

      numeroDocumento: emp?.numeroDocumento ?? '',

      pagueA: emp?.nombreCompleto || '',

      idPeriodo: abiertos[0]?.idPeriodo ?? '',

    });

    this.archivoSoporte.set(null);

    this.previewSoporte.set(null);

    this.limpiarAutorizacionRetiro();

    this.placaVehiculoInfo.set(null);

    this.placaVehiculoError.set(null);

    this.intentoGuardar.set(false);

    this.mostrarForm.set(true);

    this.inform(null);

  }



  editar(e: Egreso) {

    if (!this.puedeGestionarEgreso(e)) {

      this.inform('Solo puede editar egresos de su sesión de caja actual.');

      return;

    }

    this.limpiarAutorizacionRetiro();

    this.editando.set(e);

    const emp = e.numeroDocumento

      ? this.empleados().find((x) => x.numeroDocumento === e.numeroDocumento)

      : null;

    const idTer = (e as Egreso & { idTercero?: string }).idTercero
      ? String((e as Egreso & { idTercero?: string }).idTercero)
      : null;
    const ter =
      (idTer ? this.terceros().find((t) => String(t._id) === idTer) : null) ||
      (e.numeroDocumento && !emp
        ? this.terceros().find((t) => t.identificacion === e.numeroDocumento)
        : null);

    this.beneficiarioEmpleado.set(!!emp || this.obligaEmpleado());
    this.empleadoSelId.set(emp?.idEmpleado ?? null);
    this.empleadoTexto.set(emp ? `${emp.nombreCompleto || ''} — ${emp.numeroDocumento || ''}`.trim() : '');
    this.terceroSelId.set(ter?._id ? String(ter._id) : idTer);
    this.terceroTexto.set(
      ter
        ? `${ter.nombre || ter.razonSocial || ter.nombres || ''} — ${ter.identificacion || ''}`.trim()
        : '',
    );

    const tipoRow = e.tipoEgreso
      ? this.tiposEgreso().find((t) => String(t.idTipoEgreso) === String(e.tipoEgreso))
      : null;
    this.tipoEgresoTexto.set(tipoRow ? this.labelTipoEgreso(tipoRow) : (e.tipoEgresoDescr || ''));
    this.formaPagoTexto.set(e.formaPago || 'Efectivo');
    const cuenta = e.cuentaOrigen
      ? this.cuentasBancarias().find((c) => String(c.idCuentaBancaria) === String(e.cuentaOrigen))
      : null;
    this.cuentaOrigenTexto.set(cuenta ? this.labelCuenta(cuenta) : '');
    const banco = e.bancoDestino
      ? this.bancos().find((b) => String(b.idBanco || b.idbanco) === String(e.bancoDestino))
      : null;
    this.bancoDestinoTexto.set(banco ? this.labelBanco(banco) : '');
    const periodo = e.idPeriodo
      ? this.periodosNomina().find((p) => Number(p.idPeriodo) === Number(e.idPeriodo))
      : null;
    this.periodoTexto.set(periodo ? `${periodo.nombre} (${periodo.estado})` : '');

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

      placa: e.placa || '',

      idTercero: ter?._id ? String(ter._id) : idTer,

    });

    this.placaVehiculoInfo.set(
      e.placa
        ? {
            placa: e.placa,
            nombreMarca: e.vehiculoMarca || undefined,
            nombreLinea: e.vehiculoLinea || undefined,
            claseVehiculo: e.vehiculoClase || undefined,
          }
        : null,
    );

    this.placaVehiculoError.set(null);

    if (e.placa) {
      void this.verificarPlacaIngresada(e.placa, false);
    }

    this.archivoSoporte.set(null);

    this.previewSoporte.set(this.svc.urlArchivo(e.urlSoporte));

    this.intentoGuardar.set(false);

    this.mostrarForm.set(true);

    this.inform(null);

  }



  cancelar() {

    this.mostrarForm.set(false);

    this.editando.set(null);

    this.archivoSoporte.set(null);

    this.intentoGuardar.set(false);

    this.limpiarAutorizacionRetiro();

    if (this.modoSoloForm()) {
      this.volverTrasSoloForm();
    }

  }

  private volverTrasSoloForm(): void {
    const url = this.returnUrl();
    if (url) {
      void this.router.navigateByUrl(url);
      return;
    }
    void this.router.navigate(['/app/caja/egresos']);
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

    const tipo = this.tiposEgreso().find((t) => String(t.idTipoEgreso) === String(id)) ?? null;
    this.tipoEgresoTexto.set(tipo ? this.labelTipoEgreso(tipo) : '');

    this.limpiarAutorizacionRetiro();

    const cfg = configTipoEgreso(tipo);

    if (esRetiroCajaTipo(tipo)) {
      this.beneficiarioEmpleado.set(false);
      this.empleadoSelId.set(null);
      this.empleadoTexto.set('');
    } else if (cfg.requiereEmpleado) {
      this.beneficiarioEmpleado.set(true);
      this.terceroSelId.set(null);
      this.terceroTexto.set('');
      this.form.update((f) => ({ ...f, idTercero: null }));
    } else if (this.beneficiarioEmpleado() && !this.empleadoSelId()) {
      // Tipo libre: por defecto tercero (igual que ingresos)
      this.beneficiarioEmpleado.set(false);
    }

    if (!cfg.requiereVehiculo) {
      this.patch('placa', '');
      this.placaVehiculoInfo.set(null);
      this.placaVehiculoError.set(null);
    }

  }

  onTipoEgresoPick(opt: EnumBuscarOption): void {
    this.onTipoEgresoChange(String(opt.value));
  }

  onTipoEgresoLimpiar(): void {
    this.onTipoEgresoChange('');
  }

  onEmpleadoPick(opt: EnumBuscarOption): void {
    const id = Number(opt.value);
    this.empleadoTexto.set(opt.label);
    this.onEmpleadoChange(Number.isFinite(id) ? id : null);
  }

  onEmpleadoLimpiar(): void {
    this.empleadoTexto.set('');
    this.onEmpleadoChange(null);
  }

  onTerceroPick(opt: EnumBuscarOption): void {
    this.terceroTexto.set(opt.label);
    this.onTerceroChange(String(opt.value));
  }

  onTerceroLimpiarPick(): void {
    this.terceroTexto.set('');
    this.onTerceroChange(null);
  }

  onFormaPagoPick(opt: EnumBuscarOption): void {
    this.formaPagoTexto.set(opt.label);
    this.patch('formaPago', String(opt.value));
  }

  onFormaPagoLimpiar(): void {
    this.formaPagoTexto.set('Efectivo');
    this.patch('formaPago', 'Efectivo');
  }

  onCuentaOrigenPick(opt: EnumBuscarOption): void {
    this.cuentaOrigenTexto.set(opt.label);
    this.patch('cuentaOrigen', String(opt.value));
  }

  onCuentaOrigenLimpiar(): void {
    this.cuentaOrigenTexto.set('');
    this.patch('cuentaOrigen', '');
  }

  onBancoPick(opt: EnumBuscarOption): void {
    this.bancoDestinoTexto.set(opt.label);
    this.patch('bancoDestino', String(opt.value));
  }

  onBancoLimpiar(): void {
    this.bancoDestinoTexto.set('');
    this.patch('bancoDestino', '');
  }

  onPeriodoPick(opt: EnumBuscarOption): void {
    this.periodoTexto.set(opt.label);
    const v = opt.value;
    this.patch('idPeriodo', v === '' || v == null ? '' : (Number(v) || ''));
  }

  onPeriodoLimpiar(): void {
    this.periodoTexto.set('');
    this.patch('idPeriodo', '');
  }



  onPlacaChange(raw: string): void {

    const placa = String(raw || '').trim().toUpperCase();

    this.patch('placa', placa);

    this.placaVehiculoInfo.set(null);

    this.placaVehiculoError.set(null);

    if (!placa) return;

    if (placa.length < 5) {

      this.placaVehiculoError.set('Escriba la placa completa del vehículo.');

      return;

    }

    void this.verificarPlacaIngresada(placa, true);

  }



  onPlacaBlur(): void {

    const placa = String(this.form().placa || '').trim().toUpperCase();

    if (!placa || placa.length < 5) return;

    if (this.placaVehiculoInfo()?.placa === placa) return;

    void this.verificarPlacaIngresada(placa, true);

  }



  private verificarPlacaIngresada(placa: string, mostrarCargando: boolean): void {

    const normalizada = String(placa || '').trim().toUpperCase();

    if (!normalizada) return;

    if (mostrarCargando) this.placaVerificando.set(true);

    this.svc.verificarPlacaVehiculo(normalizada).subscribe({

      next: (r) => {

        this.placaVerificando.set(false);

        if (r.existe && r.vehiculo) {

          this.patch('placa', r.vehiculo.placa);

          this.placaVehiculoInfo.set({

            placa: r.vehiculo.placa,

            nombreMarca: r.vehiculo.nombreMarca,

            nombreLinea: r.vehiculo.nombreLinea,

            claseVehiculo: r.vehiculo.claseVehiculo,

          });

          this.placaVehiculoError.set(null);

          return;

        }

        this.placaVehiculoInfo.set(null);

        this.placaVehiculoError.set('No hay vehículo registrado con esa placa.');

      },

      error: () => {

        this.placaVerificando.set(false);

        this.placaVehiculoInfo.set(null);

        this.placaVehiculoError.set('No se pudo verificar la placa.');

      },

    });

  }



  setBeneficiarioEmpleado(esEmpleado: boolean) {

    if (this.obligaEmpleado() && !esEmpleado) return;

    this.beneficiarioEmpleado.set(esEmpleado);

    if (esEmpleado) {
      this.terceroSelId.set(null);
      this.terceroTexto.set('');
      this.form.update((f) => ({
        ...f,
        idTercero: null,
        numeroDocumento: '',
        pagueA: '',
        correoBeneficiario: '',
        direccionBeneficiario: '',
        telefonoBeneficiario: '',
      }));
      this.empleadoSelId.set(null);
      this.empleadoTexto.set('');
      return;
    }

    this.empleadoSelId.set(null);
    this.empleadoTexto.set('');
    this.terceroSelId.set(null);
    this.terceroTexto.set('');
    this.form.update((f) => ({
      ...f,
      numeroDocumento: '',
      pagueA: '',
      idTercero: null,
      correoBeneficiario: '',
      direccionBeneficiario: '',
      telefonoBeneficiario: '',
    }));

  }



  onEmpleadoChange(idEmpleado: number | null) {

    this.empleadoSelId.set(idEmpleado);

    if (idEmpleado == null) {
      this.empleadoTexto.set('');
      this.form.update((f) => ({
        ...f,
        numeroDocumento: '',
        idTercero: null,
        correoBeneficiario: '',
        direccionBeneficiario: '',
        telefonoBeneficiario: '',
      }));

      return;

    }

    const emp = this.empleados().find((e) => e.idEmpleado === idEmpleado);

    if (!emp?.numeroDocumento) return;

    this.empleadoTexto.set(`${emp.nombreCompleto || ''} — ${emp.numeroDocumento || ''}`.trim());

    this.form.update((f) => ({

      ...f,

      pagueA: emp.nombreCompleto || '',

      numeroDocumento: emp.numeroDocumento,

      idTercero: null,

      correoBeneficiario: String(emp.correoCorporativo || emp.correoPersonal || '').trim(),
      direccionBeneficiario: String(emp.direccion || '').trim(),
      telefonoBeneficiario: String(emp.celular || emp.telefono || '').trim(),

    }));

  }

  onTerceroChange(idTercero: string | null) {
    this.terceroSelId.set(idTercero);
    this.terceroTexto.set('');
    if (!idTercero) {
      this.form.update((f) => ({
        ...f,
        pagueA: '',
        numeroDocumento: '',
        idTercero: null,
        correoBeneficiario: '',
        direccionBeneficiario: '',
        telefonoBeneficiario: '',
      }));
      return;
    }
    const ter = this.terceros().find((t) => String(t._id) === String(idTercero));
    if (!ter) return;
    this.terceroTexto.set(this.labelTercero(ter));
    this.form.update((f) => ({
      ...f,
      pagueA: ter.nombre || ter.razonSocial || ter.nombres || '',
      numeroDocumento: ter.identificacion || '',
      idTercero: String(ter._id),
      correoBeneficiario: String(ter.correo || '').trim(),
      direccionBeneficiario: String(ter.direccion || '').trim(),
      telefonoBeneficiario: String(ter.telefono || '').trim(),
    }));
  }

  idTerceroOpt(t: Tercero): string | null {
    return t._id ? String(t._id) : null;
  }

  labelTercero(t: Tercero): string {
    const nom = t.nombre || t.razonSocial || t.nombres || 'Sin nombre';
    return `${nom} — ${t.identificacion || ''}`.trim();
  }



  onSoporteArchivo(file: File) {
    if (!file.type.startsWith('image/')) {
      this.inform('Seleccione una imagen (JPG, PNG, etc.).');
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



  async guardar(): Promise<void> {

    this.intentoGuardar.set(true);

    const ed = this.editando();

    const errores = this.erroresFormulario();
    if (Object.keys(errores).length) {
      const primero = Object.values(errores)[0];
      const n = Object.keys(errores).length;
      this.inform(
        n > 1
          ? `${primero} Revise los ${n} campos marcados en rojo.`
          : primero,
      );
      return;
    }

    if (ed && (ed.anticipoNomina || ed.idNovedadGenerada)) {

      this.inform('Los egresos de préstamo/adelanto no se editan; elimine y vuelva a crear si fue un error.');

      return;

    }

    if (ed && !this.puedeGestionarEgreso(ed)) {

      this.inform('Solo puede editar egresos de su sesión de caja actual.');

      return;

    }

    if (!ed) {
      if (!(await this.cajaAlert.ensureAbierta('registrar egresos'))) return;
    }

    if (this.requiereAutorizacionSupervisor()) {
      this.ejecutarGuardar({
        autorizadoUsername: this.authAdminUser().trim(),
        autorizadoPassword: this.authAdminPass(),
      });
      return;
    }

    this.ejecutarGuardar();

  }



  private ejecutarGuardar(auth?: { autorizadoUsername: string; autorizadoPassword: string }) {

    const f = this.form();

    const ed = this.editando();

    let payload: EgresoDto = { ...f };

    // Cajero: solo sección de pago (forma, cuentas, consignación, fechas) + soporte.
    if (ed && this.modoComplementoCajero()) {
      payload = {
        fechaEgreso: f.fechaEgreso,
        valorEgreso: f.valorEgreso,
        concepto: f.concepto,
        formaPago: f.formaPago,
        numTransferencia: f.numTransferencia,
        fechaTransferencia: f.fechaTransferencia,
        cuentaOrigen: f.cuentaOrigen,
        cuentaDestino: f.cuentaDestino,
        bancoDestino: f.bancoDestino,
      };
    } else {
      if (this.beneficiarioEmpleado() || this.obligaEmpleado()) {
        payload.idTercero = null;
      }
      if (!this.esAnticipoNomina()) {
        delete payload.idPeriodo;
      }
    }

    this.saving.set(true);

    this.inform(null);

    const soporte = this.archivoSoporte();

    const req = ed

      ? this.svc.actualizar(ed.idEgreso, payload, soporte, auth)

      : this.svc.crear(payload, soporte, auth);

    req.subscribe({

      next: (res) => {

        this.saving.set(false);

        this.limpiarAutorizacionRetiro();

        this.mostrarForm.set(false);

        let txt = ed ? 'Egreso actualizado.' : 'Egreso registrado.';

        const eg = res as Egreso & { novedadAnticipo?: { idNovedad: number; idPeriodo: number; periodoNombre?: string } };

        const nov = eg?.novedadAnticipo;

        if (nov?.idNovedad) {

          txt += ` Deducción en nómina #${nov.idNovedad} (${nov.periodoNombre || nov.idPeriodo}).`;

        }

        if (eg.numRecibo) txt += ` Comprobante ${eg.numRecibo}.`;

        if (!this.tieneSoporte(eg) && this.requiereRefBancaria()) {
          txt += ' Atención: quedó sin soporte adjunto.';
        }

        this.inform(txt);

        const idRecibo = eg.idEgreso || ed?.idEgreso;
        if (idRecibo) {
          if (!ed) {
            this.comprobanteAlertSvc.notificarDesdeEgreso(eg as unknown as Record<string, unknown>);
          }
          // Abrir comprobante de inmediato para imprimir (firma del beneficiario).
          const abierto = this.reciboSvc.abrirHtmlEgreso(idRecibo, (m) => this.inform(m));
          if (!abierto) {
            this.inform('Permita ventanas emergentes para imprimir el comprobante de egreso.', true);
          }
        }

        if (this.modoSoloForm()) {
          this.volverTrasSoloForm();
          return;
        }

        this.cargar();

      },

      error: (e) => {

        this.saving.set(false);

        this.inform(e?.error?.message || 'Error al guardar');

      },

    });

  }



  async eliminar(e: Egreso) {

    const ok = await this.confirm.open({

      title: 'Anular egreso',

      message: `¿Anular el egreso a ${e.pagueA || e.concepto}? Pasará a estado anulado en cero y conservará su consecutivo.`,

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

      this.inform('Ingrese usuario y contraseña del administrador para anular.');

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

        this.inform('Egreso anulado.');

      },

      error: (err) => this.inform(err?.error?.message || 'No se pudo anular'),

    });

  }



  puedeGestionarEgreso(e: Egreso): boolean {

    if (this.isAdmin()) return true;

    if (!this.cajaAbierta() || this.sesionCaja()?.idSesion == null) return false;

    // Complemento pago/soporte: si el egreso no tiene idSesion (legado), permitir con caja abierta.
    if (e.idSesion == null) return true;

    return Number(e.idSesion) === Number(this.sesionCaja()?.idSesion);

  }

  esAnulado(e: Egreso): boolean {
    if (e?.anulado === true) return true;
    return String(e?.estado || '').trim().toUpperCase() === 'ANULADO';
  }

  tituloAnulado(e: Egreso): string {
    const partes: string[] = [];
    if (e?.anuladoPor) partes.push(`Anuló: ${e.anuladoPor}`);
    if (e?.autorizadoPor) partes.push(`Autorizó: ${e.autorizadoPor}`);
    return partes.join(' · ') || 'Egreso anulado';
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
    if (!this.requiereRefBancaria()) return false;
    if (this.archivoSoporte()) return false;
    const ed = this.editando();
    if (ed?.urlSoporte) return false;
    if (this.previewSoporte() && !this.archivoSoporte()) {
      // preview de soporte ya guardado en edición
      return false;
    }
    return true;
  }

  onAlarmaSoporte(e: Egreso, ev?: Event) {
    ev?.stopPropagation();
    if (this.puedeGestionarEgreso(e)) {
      this.editar(e);
      this.inform('Adjunte el soporte (imagen) en el formulario y guarde.');
      return;
    }
    this.inform(
      `Egreso ${e.numRecibo || e.concepto || ''} sin soporte. Solicite a un administrador que adjunte el comprobante.`,
    );
  }

  imprimirRecibo(e: Egreso) {

    this.reciboSvc.abrirHtmlEgreso(e.idEgreso, (m) => this.inform(m));

  }

  abrirReciboPantalla(e: Egreso) {
    this.reciboSvc.abrirHtmlEgreso(e.idEgreso, (m) => this.inform(m));
  }

  labelTipoEgreso(row: TipoEgresoCat): string {

    const cfg = configTipoEgreso(row);

    const base = row?.tipo || String(row?.idTipoEgreso ?? '');

    if (cfg.generaDeduccion) return `${base} (nómina −)`;

    if (cfg.requiereVehiculo) return `${base} (vehículo)`;

    if (cfg.efectoNomina === 'pago_sueldo') return `${base} (empleado)`;

    return base;

  }



  hintTipoSeleccionado(): string {

    const t = this.tipoSeleccionado();

    if (!t) {
      return 'Elija el tipo según el gasto. Configúrelos en Configuración → Catálogos → Tipos de egreso (requiereEmpleado / requiereVehiculo / efectoNomina).';
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

    if (cfg.requiereVehiculo) {

      return 'Debe indicar la placa de un vehículo registrado en el módulo Vehículos.';

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
