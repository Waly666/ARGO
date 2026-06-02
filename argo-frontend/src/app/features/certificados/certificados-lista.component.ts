import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  CertificadoListItem,
  CertificadoService,
} from '../../core/services/certificado.service';
import { TIPOS_CERTIFICADO, capEncabezadoCert, capTipoFormatoCert, labelTipoCert } from '../../core/constants/tipos-certificado';
import { coincideBusquedaTexto } from '../../core/utils/busqueda-alumno.helpers';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { FormModalComponent } from '../../shared/form-modal/form-modal.component';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
import {
  TIPOS_ALUMNO_DEF,
  TIPO_ALUMNO_DEFAULT,
  TIPO_JORNADAS_CAPACITACION,
  TipoAlumno,
  normalizarTipoAlumno,
} from '../alumnos/catalogo.helpers';
import { esFechaHoy, ymdLocal } from '../jornadas/jornada-calendario.util';
import {
  capAlumnoNombre,
  capCertCodigo,
  capCodContrato,
  capDocAsis,
  capFechaJor,
  capUbicacionJornada,
  rowCertificadoHoyClass,
  ubicacionJornadaLabel,
} from '../jornadas/jornada-ui.util';

@Component({
  selector: 'argo-certificados-lista',
  standalone: true,
  imports: [CommonModule, FormsModule, FormModalComponent, CatalogoEnumBuscarComponent],
  templateUrl: './certificados-lista.component.html',
  styleUrls: ['./certificados-lista.component.scss'],
})
export class CertificadosListaComponent implements OnInit {
  private certSvc = inject(CertificadoService);
  private confirmSvc = inject(ConfirmDialogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  guardando = signal(false);
  filtro = signal('');
  tipoFormato = signal('');
  estadoFiltro = signal('');
  fechaDesde = signal('');
  fechaHasta = signal('');
  certificados = signal<CertificadoListItem[]>([]);
  emitidosHoy = signal(0);
  msg = signal<string | null>(null);
  msgError = signal(false);

  modalEditar = signal(false);
  editId = signal('');
  editEncabezado = signal('');
  editTipoCertificado = signal<TipoAlumno>(TIPO_ALUMNO_DEFAULT);
  editNumActa = signal('');
  editNumFolio = signal('');
  editNumRunt = signal('');
  editObservaciones = signal('');
  editFechaEmision = signal('');
  editFechaVencimiento = signal('');

  readonly tiposFormato = TIPOS_CERTIFICADO.filter((t) => t.id !== 'jornada_capacitacion');
  readonly estadosFiltro = [
    { value: '', label: 'Todos' },
    { value: 'vigente', label: 'Vigente' },
    { value: 'vencido', label: 'Vencido' },
    { value: 'anulado', label: 'Anulado' },
  ] as const;
  readonly tiposCertificadoCat = TIPOS_ALUMNO_DEF;
  readonly capEncabezadoCert = capEncabezadoCert;
  readonly capTipoFormatoCert = capTipoFormatoCert;
  readonly labelTipoCert = labelTipoCert;

  opcionesTipoCertificado = computed<EnumBuscarOption[]>(() =>
    this.tiposCertificadoCat
      .filter((t) => t !== TIPO_JORNADAS_CAPACITACION)
      .map((t) => ({ value: t, label: t })),
  );
  textoTipoCertificadoEdit = computed(() => this.editTipoCertificado() || '');

  certificadoEdit = computed(
    () => this.certificados().find((c) => c._id === this.editId()) || null,
  );

  filtrados = computed(() => {
    const q = this.filtro().trim();
    const est = this.estadoFiltro();
    return this.certificados().filter((c) => {
      if (est && this.estadoVigencia(c) !== est) return false;
      if (!q) return true;
      const enc = String(c.encabezado || '');
      const cod = String(c.codigoCert || '');
      const doc = String(c.numDoc ?? '');
      const tipo = String(c.tipoFormatoCertLabel || c.tipoFormatoCert || '');
      const contrato = String(c.codContrato || '');
      const ubicacion = String(c.ubicacionJornada || '');
      return (
        coincideBusquedaTexto(c.nombreCompleto, q) ||
        coincideBusquedaTexto(enc, q) ||
        coincideBusquedaTexto(cod, q) ||
        coincideBusquedaTexto(tipo, q) ||
        doc.includes(q.replace(/\D/g, '')) ||
        coincideBusquedaTexto(contrato, q) ||
        coincideBusquedaTexto(ubicacion, q)
      );
    });
  });

  readonly capCertCodigo = capCertCodigo;
  readonly capAlumnoNombre = capAlumnoNombre;
  readonly capDocAsis = capDocAsis;
  readonly capCodContrato = capCodContrato;
  readonly capUbicacionJornada = capUbicacionJornada;
  readonly ubicacionJornadaLabel = ubicacionJornadaLabel;
  readonly capFechaJor = capFechaJor;
  readonly rowCertificadoHoyClass = rowCertificadoHoyClass;
  readonly esFechaHoy = esFechaHoy;

  ngOnInit() {
    this.cargar();
  }

  cargar(silencioso = false) {
    if (!silencioso) this.loading.set(true);
    this.certSvc
      .listarGlobal({
        tipoFormatoCert: this.tipoFormato() || undefined,
        desde: this.fechaDesde() || undefined,
        hasta: this.fechaHasta() || undefined,
        cacheBust: Date.now(),
      })
      .subscribe({
        next: (res) => {
          this.certificados.set(res.items || []);
          this.emitidosHoy.set(res.emitidosHoy ?? 0);
          this.loading.set(false);
          const id = this.route.snapshot.queryParamMap.get('editar');
          if (id && !silencioso) this.abrirEditar(id);
        },
        error: (e) => {
          this.loading.set(false);
          this.msgError.set(true);
          this.msg.set(e?.error?.message || 'No se pudieron cargar los certificados.');
        },
      });
  }

  aplicarFiltrosServidor() {
    this.cargar();
  }

  limpiarFiltros() {
    this.filtro.set('');
    this.tipoFormato.set('');
    this.estadoFiltro.set('');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.cargar();
  }

  filtrarSoloHoy() {
    const hoy = new Date().toISOString().slice(0, 10);
    this.fechaDesde.set(hoy);
    this.fechaHasta.set(hoy);
    this.cargar();
  }

  onTipoCertPick(opt: EnumBuscarOption): void {
    this.editTipoCertificado.set(normalizarTipoAlumno(String(opt.value)) as TipoAlumno);
  }

  onTipoCertLimpiar(): void {
    this.editTipoCertificado.set(TIPO_ALUMNO_DEFAULT);
  }

  abrirAlumno(c: CertificadoListItem) {
    if (!c.alumnoId) return;
    void this.router.navigate(['/app/alumnos', c.alumnoId], { queryParams: { tab: 'certificados' } });
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
    this.editFechaEmision.set(this.fechaInputLocal(c.fechaEmision));
    this.editFechaVencimiento.set(this.fechaInputLocal(c.fechaVencimiento || undefined));
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
    if (!this.editFechaEmision()) {
      this.msgError.set(true);
      this.msg.set('La fecha de emisión es obligatoria.');
      return;
    }
    this.guardando.set(true);
    this.msg.set(null);
    const idStr = String(id);
    const prev = this.certificados().find((x) => String(x._id) === idStr);
    this.certSvc
      .actualizar(idStr, {
        encabezado: this.editEncabezado().trim(),
        tipoCertificado: this.editTipoCertificado(),
        numActa: this.editNumActa().trim(),
        numFolio: this.editNumFolio().trim(),
        numRunt: this.editNumRunt().trim(),
        observaciones: this.editObservaciones().trim(),
        fechaEmision: this.editFechaEmision(),
        fechaVencimiento: this.editFechaVencimiento() || null,
      })
      .subscribe({
        next: (c) => {
          this.guardando.set(false);
          this.certificados.update((list) =>
            list.map((x) =>
              String(x._id) === idStr ? this.fusionarCertActualizado(x, c, prev) : x,
            ),
          );
          this.recalcEmitidosHoy();
          this.msgError.set(false);
          this.msg.set('Certificado actualizado.');
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { editar: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
          this.modalEditar.set(false);
          this.editId.set('');
        },
        error: (e) => {
          this.guardando.set(false);
          this.msgError.set(true);
          this.msg.set(e?.error?.message || 'No se pudo guardar.');
        },
      });
  }

  async eliminar(c: CertificadoListItem) {
    const ok = await this.confirmSvc.open({
      title: 'Eliminar certificado',
      message: `¿Eliminar el certificado ${c.codigoCert || c._id} de ${c.nombreCompleto || 'el alumno'}?`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    this.certSvc.eliminar(c._id).subscribe({
      next: () => {
        this.certificados.update((list) => list.filter((x) => x._id !== c._id));
        this.msgError.set(false);
        this.msg.set('Certificado eliminado.');
        this.cargar();
      },
      error: (e) => {
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo eliminar.');
      },
    });
  }

  imprimir(c: CertificadoListItem) {
    this.certSvc.abrirHtml(c._id, (m) => {
      this.msgError.set(true);
      this.msg.set(m);
    });
  }

  fmtFecha(f?: string | null) {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-CO');
  }

  esAnulado(c: CertificadoListItem): boolean {
    return String(c.estado || '').trim().toLowerCase() === 'anulado';
  }

  estadoVigencia(c: CertificadoListItem): 'vigente' | 'vencido' | 'anulado' {
    if (this.esAnulado(c)) return 'anulado';
    if (this.esVencido(c)) return 'vencido';
    return 'vigente';
  }

  esVencido(c: CertificadoListItem): boolean {
    if (this.esAnulado(c)) return false;
    const fv = this.inicioDia(c.fechaVencimiento);
    const hoy = this.inicioDia(new Date());
    if (!fv || !hoy) return false;
    return fv.getTime() < hoy.getTime();
  }

  labelEstadoVigencia(c: CertificadoListItem): string {
    if (this.esAnulado(c)) return 'Anulado';
    if (this.esVencido(c)) return 'Vencido';
    return 'Vigente';
  }

  claseEstadoVigencia(c: CertificadoListItem): string {
    if (this.esAnulado(c)) return 'estado-cert-anulado';
    if (this.esVencido(c)) return 'estado-cert-vencido';
    return 'estado-cert-vigente';
  }

  tituloEstadoVigencia(c: CertificadoListItem): string {
    if (this.esAnulado(c)) return 'Certificado anulado';
    if (this.esVencido(c)) {
      return `Certificado vencido · venció ${this.fmtFecha(c.fechaVencimiento)} — contacte al cliente para revalidar`;
    }
    if (c.fechaVencimiento) {
      return `Certificado vigente · vence ${this.fmtFecha(c.fechaVencimiento)}`;
    }
    return 'Certificado vigente · sin fecha de vencimiento registrada';
  }

  private inicioDia(iso?: string | Date | null): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private fechaInputLocal(d?: string | Date | null): string {
    if (!d) return '';
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
    return ymdLocal(new Date(d));
  }

  private fusionarCertActualizado(
    prev: CertificadoListItem,
    actualizado: Partial<CertificadoListItem>,
    fallback?: CertificadoListItem,
  ): CertificadoListItem {
    const base = fallback || prev;
    return {
      ...prev,
      encabezado: actualizado.encabezado ?? prev.encabezado,
      tipoCertificado: actualizado.tipoCertificado ?? prev.tipoCertificado,
      numActa: actualizado.numActa ?? prev.numActa,
      numFolio: actualizado.numFolio ?? prev.numFolio,
      numRunt: actualizado.numRunt ?? prev.numRunt,
      observaciones: actualizado.observaciones ?? prev.observaciones,
      fechaEmision: actualizado.fechaEmision ?? prev.fechaEmision,
      fechaVencimiento:
        actualizado.fechaVencimiento !== undefined
          ? actualizado.fechaVencimiento
          : prev.fechaVencimiento,
      tipoFormatoCert: actualizado.tipoFormatoCert ?? prev.tipoFormatoCert,
      tipoFormatoCertLabel:
        actualizado.tipoFormatoCertLabel ||
        labelTipoCert(actualizado.tipoFormatoCert || prev.tipoFormatoCert) ||
        prev.tipoFormatoCertLabel,
      alumnoId: base.alumnoId,
      nombreCompleto: base.nombreCompleto,
      codContrato: base.codContrato,
      ubicacionJornada: base.ubicacionJornada,
      _id: String(actualizado._id || prev._id),
    };
  }

  private recalcEmitidosHoy() {
    const hoy = ymdLocal(new Date());
    this.emitidosHoy.set(
      this.certificados().filter((c) => this.fechaInputLocal(c.fechaEmision) === hoy).length,
    );
  }
}
