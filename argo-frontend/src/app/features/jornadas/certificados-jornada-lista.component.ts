import { CommonModule } from '@angular/common';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CertificadoJornadaAlertService } from '../../core/services/certificado-jornada-alert.service';
import { JornadaCapService } from '../../core/services/jornada-cap.service';
import {
  TIPOS_ALUMNO_DEF,
  TIPO_JORNADAS_CAPACITACION,
  TipoAlumno,
  fechaInput,
  normalizarTipoAlumno,
} from '../alumnos/catalogo.helpers';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { FormModalComponent } from '../../shared/form-modal/form-modal.component';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
import { esFechaHoy, fmtFechaCalendario } from './jornada-calendario.util';
import { coincideBusquedaDocumento, coincideBusquedaTexto } from '../../core/utils/busqueda-alumno.helpers';
import {
  capAlumnoNombre,
  capCertCodigo,
  capCliente,
  capCodContrato,
  capDocAsis,
  capFechaJor,
  capHorasCert,
  capUbicacionJornada,
  rowCertificadoHoyClass,
  ubicacionJornadaLabel,
} from './jornada-ui.util';
import {
  CertZipProgreso,
  CertificadosZipProgresoModalComponent,
} from './certificados-zip-progreso-modal.component';
import { ejecutarExportZipCertificados } from './certificados-zip-export.helper';

export interface CertificadoJornadaItem {
  _id: string;
  codigoCert?: string;
  nombreCompleto?: string;
  numDoc?: number;
  encabezado?: string;
  horasCert?: string;
  fechaEmision?: string;
  fechaVencimiento?: string | null;
  observaciones?: string;
  numActa?: string;
  numFolio?: string;
  numRunt?: string;
  tipoCertificado?: string;
  municipio?: string;
  direccion?: string;
  ubicacionJornada?: string;
  codContrato?: string;
  idContrato?: string;
  idJornada?: string;
  idClase?: string;
  idClaseJornada?: string;
}

@Component({
  selector: 'argo-certificados-jornada-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    FormModalComponent,
    CatalogoEnumBuscarComponent,
    ArgoDateInputComponent,
    CertificadosZipProgresoModalComponent,
  ],
  templateUrl: './certificados-jornada-lista.component.html',
  styleUrls: ['./certificados-jornada-lista.component.scss'],
})
export class CertificadosJornadaListaComponent implements OnInit {
  private jornadaSvc = inject(JornadaCapService);
  private alertSvc = inject(CertificadoJornadaAlertService);
  private confirmSvc = inject(ConfirmDialogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  descargandoZip = signal(false);
  zipProgresoOpen = signal(false);
  zipProgreso = signal<CertZipProgreso>({
    status: 'idle',
    fase: '',
    hecho: 0,
    total: 0,
    porcentaje: 0,
  });
  guardando = signal(false);
  filtro = signal('');
  certificados = signal<CertificadoJornadaItem[]>([]);
  msg = signal<string | null>(null);
  msgError = signal(false);

  contratos = signal<Array<{ _id: string; label: string }>>([]);
  jornadas = signal<Array<{ _id: string; label: string; idContrato?: string }>>([]);
  clases = signal<Array<{ _id: string; label: string; idJornada?: string }>>([]);

  filtroContratoId = signal('');
  filtroContratoTexto = signal('');
  filtroJornadaId = signal('');
  filtroJornadaTexto = signal('');
  filtroClaseId = signal('');
  filtroClaseTexto = signal('');
  filtroDesde = signal('');
  filtroHasta = signal('');

  modalEditar = signal(false);
  editId = signal('');
  editEncabezado = signal('');
  editTipoCertificado = signal<TipoAlumno>(TIPO_JORNADAS_CAPACITACION);
  editNumActa = signal('');
  editNumFolio = signal('');
  editNumRunt = signal('');
  editObservaciones = signal('');
  editFechaEmision = signal('');
  editFechaVencimiento = signal('');

  readonly tiposCertificadoCat = TIPOS_ALUMNO_DEF;

  opcionesTipoCertificado = computed<EnumBuscarOption[]>(() =>
    this.tiposCertificadoCat.map((t) => ({ value: t, label: t })),
  );

  textoTipoCertificadoEdit = computed(() => this.editTipoCertificado() || '');
  readonly capCertCodigo = capCertCodigo;
  readonly capAlumnoNombre = capAlumnoNombre;
  readonly capDocAsis = capDocAsis;
  readonly capCliente = capCliente;
  readonly capCodContrato = capCodContrato;
  readonly capUbicacionJornada = capUbicacionJornada;
  readonly ubicacionJornadaLabel = ubicacionJornadaLabel;
  readonly capHorasCert = capHorasCert;
  readonly capFechaJor = capFechaJor;
  readonly rowCertificadoHoyClass = rowCertificadoHoyClass;
  readonly esFechaHoy = esFechaHoy;

  opcionesContrato = computed<EnumBuscarOption[]>(() =>
    this.contratos().map((c) => ({ value: c._id, label: c.label })),
  );

  opcionesJornada = computed<EnumBuscarOption[]>(() => {
    const cid = this.filtroContratoId();
    return this.jornadas()
      .filter((j) => !cid || String(j.idContrato || '') === cid)
      .map((j) => ({ value: j._id, label: j.label }));
  });

  opcionesClase = computed<EnumBuscarOption[]>(() => {
    const jid = this.filtroJornadaId();
    const cid = this.filtroContratoId();
    return this.clases()
      .filter((c) => {
        if (jid) return String(c.idJornada || '') === jid;
        if (!cid) return true;
        const j = this.jornadas().find((x) => x._id === c.idJornada);
        return j && String(j.idContrato || '') === cid;
      })
      .map((c) => ({ value: c._id, label: c.label }));
  });

  certificadoEdit = computed(() => this.certificados().find((c) => c._id === this.editId()) || null);
  certsHoyCount = computed(
    () => this.certificados().filter((c) => esFechaHoy(c.fechaEmision)).length,
  );

  filtrados = computed(() => {
    const q = this.filtro().trim();
    const list = this.certificados();
    if (!q) return list;
    return list.filter((c) => {
      const enc = String(c.encabezado || '');
      const cod = String(c.codigoCert || '');
      const contrato = String(c.codContrato || '');
      const ubicacion = String(c.ubicacionJornada || ubicacionJornadaLabel(c.municipio, c.direccion));
      return (
        coincideBusquedaTexto(c.nombreCompleto, q) ||
        coincideBusquedaTexto(enc, q) ||
        coincideBusquedaTexto(cod, q) ||
        coincideBusquedaDocumento(c.numDoc, q) ||
        coincideBusquedaTexto(contrato, q) ||
        coincideBusquedaTexto(ubicacion, q)
      );
    });
  });

  ngOnInit() {
    const qContrato = this.route.snapshot.queryParamMap.get('contrato') || '';
    if (qContrato) this.filtroContratoId.set(qContrato);
    this.cargarCatalogos();
    this.cargar();
  }

  private cargarCatalogos() {
    this.jornadaSvc.listarContratos().subscribe({
      next: (rows) => {
        this.contratos.set(
          (rows || []).map((c: any) => ({
            _id: String(c._id),
            label:
              [c.codContrato, c.nombreComercial || c.razoSocial || c.clienteNombre]
                .filter(Boolean)
                .join(' — ') || String(c._id),
          })),
        );
        const cid = this.filtroContratoId();
        if (cid) {
          const hit = this.contratos().find((c) => c._id === cid);
          if (hit) this.filtroContratoTexto.set(hit.label);
        }
      },
    });
    this.jornadaSvc.listarJornadas().subscribe({
      next: (rows) => {
        this.jornadas.set(
          (rows || []).map((j: any) => ({
            _id: String(j._id),
            idContrato: j.idContrato ? String(j.idContrato) : '',
            label: `${fmtFechaCalendario(j.fechaProgramacion)} · ${j.municipio || 'Sin municipio'} · ${j.estado || ''}`.trim(),
          })),
        );
      },
    });
    this.jornadaSvc.listarClases().subscribe({
      next: (rows) => {
        this.clases.set(
          (rows || []).map((c: any) => ({
            _id: String(c._id),
            idJornada: c.idJornada ? String(c.idJornada) : '',
            label: [
              fmtFechaCalendario(c.fechaJornada || c.fechaClase),
              c.programaNombre || c.idPrograma || 'Sin programa',
              c.carpaNombre || '',
            ]
              .filter(Boolean)
              .join(' · '),
          })),
        );
      },
    });
  }

  private filtrosApi() {
    return {
      idContrato: this.filtroContratoId() || undefined,
      idJornada: this.filtroJornadaId() || undefined,
      idClase: this.filtroClaseId() || undefined,
      desde: this.filtroDesde() || undefined,
      hasta: this.filtroHasta() || undefined,
    };
  }

  cargar() {
    this.loading.set(true);
    this.jornadaSvc.listarCertificadosJornada(this.filtrosApi()).subscribe({
      next: (rows) => {
        this.certificados.set(rows || []);
        this.alertSvc.marcarConocidos((rows || []).map((c) => String(c._id)));
        this.loading.set(false);
        const id = this.route.snapshot.queryParamMap.get('editar');
        if (id) this.abrirEditar(id);
      },
      error: (e) => {
        this.loading.set(false);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo cargar los certificados.');
      },
    });
  }

  limpiarFiltros() {
    this.filtroContratoId.set('');
    this.filtroContratoTexto.set('');
    this.filtroJornadaId.set('');
    this.filtroJornadaTexto.set('');
    this.filtroClaseId.set('');
    this.filtroClaseTexto.set('');
    this.filtroDesde.set('');
    this.filtroHasta.set('');
    this.filtro.set('');
    this.cargar();
  }

  onContratoFiltroPick(opt: EnumBuscarOption): void {
    this.filtroContratoId.set(String(opt.value));
    this.filtroContratoTexto.set(opt.label);
    this.filtroJornadaId.set('');
    this.filtroJornadaTexto.set('');
    this.filtroClaseId.set('');
    this.filtroClaseTexto.set('');
    this.cargar();
  }

  onContratoFiltroLimpiar(): void {
    this.filtroContratoId.set('');
    this.filtroContratoTexto.set('');
    this.cargar();
  }

  onJornadaFiltroPick(opt: EnumBuscarOption): void {
    this.filtroJornadaId.set(String(opt.value));
    this.filtroJornadaTexto.set(opt.label);
    this.filtroClaseId.set('');
    this.filtroClaseTexto.set('');
    this.cargar();
  }

  onJornadaFiltroLimpiar(): void {
    this.filtroJornadaId.set('');
    this.filtroJornadaTexto.set('');
    this.cargar();
  }

  onClaseFiltroPick(opt: EnumBuscarOption): void {
    this.filtroClaseId.set(String(opt.value));
    this.filtroClaseTexto.set(opt.label);
    this.cargar();
  }

  onClaseFiltroLimpiar(): void {
    this.filtroClaseId.set('');
    this.filtroClaseTexto.set('');
    this.cargar();
  }

  onDesdeChange(v: string): void {
    this.filtroDesde.set(v || '');
    this.cargar();
  }

  onHastaChange(v: string): void {
    this.filtroHasta.set(v || '');
    this.cargar();
  }

  async descargarZip(): Promise<void> {
    if (!this.certificados().length) {
      this.msgError.set(true);
      this.msg.set('No hay certificados para exportar con los filtros actuales.');
      return;
    }
    this.descargandoZip.set(true);
    this.msgError.set(false);
    this.msg.set(null);
    this.zipProgresoOpen.set(true);
    this.zipProgreso.set({
      status: 'running',
      fase: 'Iniciando…',
      hecho: 0,
      total: this.certificados().length,
      porcentaje: 1,
    });
    try {
      await ejecutarExportZipCertificados(
        this.jornadaSvc,
        this.filtrosApi(),
        (p) => this.zipProgreso.set(p),
        `certificados-jornadas_${new Date().toISOString().slice(0, 10)}.zip`,
      );
      this.zipProgresoOpen.set(false);
      this.msgError.set(false);
      this.msg.set(
        `ZIP descargado (${this.certificados().length} PDF(s)). Abra «00-todos-imprimir.pdf» para imprimir todos, o los PDF de individuales/.`,
      );
    } catch (e: unknown) {
      const texto = e instanceof Error ? e.message : 'No se pudo generar el ZIP.';
      this.zipProgreso.update((p) => ({
        ...p,
        status: 'error',
        fase: 'Error',
        message: texto,
      }));
      this.msgError.set(true);
      this.msg.set(texto);
    } finally {
      this.descargandoZip.set(false);
    }
  }

  cerrarZipProgreso(): void {
    this.zipProgresoOpen.set(false);
  }

  onTipoCertPick(opt: EnumBuscarOption): void {
    this.editTipoCertificado.set(normalizarTipoAlumno(String(opt.value)) as TipoAlumno);
  }

  onTipoCertLimpiar(): void {
    this.editTipoCertificado.set(TIPO_JORNADAS_CAPACITACION);
  }

  abrirEditar(id: string) {
    const c = this.certificados().find((x) => x._id === id);
    if (!c) return;
    this.editId.set(c._id);
    this.editEncabezado.set(c.encabezado || '');
    this.editTipoCertificado.set(normalizarTipoAlumno(c.tipoCertificado));
    this.editNumActa.set(c.numActa || '');
    this.editNumFolio.set(c.numFolio || '');
    this.editNumRunt.set(c.numRunt || '');
    this.editObservaciones.set(c.observaciones || '');
    this.editFechaEmision.set(fechaInput(c.fechaEmision));
    this.editFechaVencimiento.set(fechaInput(c.fechaVencimiento || undefined));
    this.modalEditar.set(true);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { editar: id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  cerrarEditar() {
    this.modalEditar.set(false);
    this.editId.set('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { editar: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  guardarEditar() {
    const id = this.editId();
    if (!id) return;
    this.guardando.set(true);
    this.jornadaSvc
      .actualizarCertificadoJornada(id, {
        encabezado: this.editEncabezado().trim(),
        tipoCertificado: this.editTipoCertificado(),
        numActa: this.editNumActa().trim(),
        numFolio: this.editNumFolio().trim(),
        numRunt: this.editNumRunt().trim(),
        observaciones: this.editObservaciones().trim(),
        fechaEmision: this.editFechaEmision() || undefined,
        fechaVencimiento: this.editFechaVencimiento() || null,
      })
      .subscribe({
        next: (c) => {
          this.guardando.set(false);
          this.certificados.update((list) => list.map((x) => (x._id === id ? { ...x, ...c } : x)));
          this.msgError.set(false);
          this.msg.set('Certificado actualizado.');
          this.cerrarEditar();
        },
        error: (e) => {
          this.guardando.set(false);
          this.msgError.set(true);
          this.msg.set(e?.error?.message || 'No se pudo guardar.');
        },
      });
  }

  async eliminar(c: CertificadoJornadaItem) {
    const ok = await this.confirmSvc.open({
      title: 'Confirmar borrado',
      message: `¿De verdad desea borrar este certificado?\n\n${c.codigoCert || c._id} · ${c.nombreCompleto || 'el alumno'}`,
      confirmLabel: 'Sí, borrar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.jornadaSvc.eliminarCertificadoJornada(c._id).subscribe({
      next: () => {
        this.certificados.update((list) => list.filter((x) => x._id !== c._id));
        this.alertSvc.descartar(c._id);
        this.msgError.set(false);
        this.msg.set('Certificado eliminado.');
      },
      error: (e) => {
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo eliminar.');
      },
    });
  }

  imprimir(c: CertificadoJornadaItem) {
    this.jornadaSvc.imprimirCertificadoJornada(c._id, (m) => {
      this.msgError.set(true);
      this.msg.set(m);
    });
  }

  fmtFecha(f?: string) {
    if (!f) return '—';
    return fmtFechaCalendario(f);
  }
}
