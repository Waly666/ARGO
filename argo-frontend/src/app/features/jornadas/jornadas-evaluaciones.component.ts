import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import {
  EncuestaJornadaItem,
  EncuestaJornadaResultados,
  JornadaCapService,
} from '../../core/services/jornada-cap.service';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { FormModalComponent } from '../../shared/form-modal/form-modal.component';
import {
  buildEvalAspectosChart,
  buildEvalDashKpis,
  buildEvalRadar,
  buildEvalRankingChart,
  buildEvalSatisfaccionPie,
  formatEvalNota,
  formatEvalPct,
} from './eval-resultados-dashboard.util';

@Component({
  selector: 'app-jornadas-evaluaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormModalComponent,
    CatalogoEnumBuscarComponent,
    ArgoDateInputComponent,
  ],
  templateUrl: './jornadas-evaluaciones.component.html',
  styleUrl: './jornadas-evaluaciones.component.scss',
})
export class JornadasEvaluacionesComponent implements OnInit, OnChanges {
  private readonly jornadaSvc = inject(JornadaCapService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmDialogService);

  /** Contrato fijo (p. ej. ficha 8 del hub de jornadas). */
  @Input() idContrato = '';
  /** Oculta cabecera y filtro de contrato; usa el contrato del hub. */
  @Input() embedded = false;

  readonly puedeGestionar = this.auth.tienePermiso('jornadas.evaluaciones.gestionar');

  loading = signal(false);
  guardando = signal(false);
  msg = signal('');
  msgError = signal(false);

  encuestas = signal<EncuestaJornadaItem[]>([]);
  contratos = signal<EnumBuscarOption[]>([]);
  filtroContratoId = signal('');
  filtroContratoTexto = signal('');
  filtroEstado = signal('');

  modalForm = signal(false);
  editId = signal('');
  form = {
    idContrato: '',
    contratoTexto: '',
    titulo: '',
    instrucciones: '',
    fechaApertura: '',
    fechaCierre: '',
  };

  modalResultados = signal(false);
  resultados = signal<EncuestaJornadaResultados | null>(null);
  cargandoResultados = signal(false);
  exportandoInforme = signal(false);
  vistaResultados = signal<'dashboard' | 'tablas' | 'alumnos'>('dashboard');

  readonly aspectosDefault = [
    { key: 'claridad', label: 'Claridad' },
    { key: 'utilidad', label: 'Utilidad' },
    { key: 'instructor', label: 'Instructor' },
    { key: 'organizacion', label: 'Organización' },
    { key: 'recomendaria', label: 'Recomendaría' },
  ];

  filtradas = computed(() => {
    const rows = this.encuestas();
    const est = this.filtroEstado();
    if (!est) return rows;
    return rows.filter((e) => e.estado === est);
  });

  dashKpis = computed(() => buildEvalDashKpis(this.resultados()));
  dashAspectos = computed(() => buildEvalAspectosChart(this.resultados(), this.aspectosDefault));
  dashRanking = computed(() => buildEvalRankingChart(this.resultados()));
  dashSatisfaccion = computed(() => buildEvalSatisfaccionPie(this.resultados()));
  dashRadar = computed(() => buildEvalRadar(this.resultados(), this.aspectosDefault));

  readonly formatEvalPct = formatEvalPct;
  readonly formatEvalNota = formatEvalNota;

  ngOnInit() {
    this.cargarContratos();
    this.aplicarContratoFijo();
    this.recargar();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idContrato']) {
      this.aplicarContratoFijo();
      if (!changes['idContrato'].firstChange) this.recargar();
    }
  }

  private aplicarContratoFijo() {
    const id = String(this.idContrato || '').trim();
    if (!id) return;
    this.filtroContratoId.set(id);
    const opt = this.contratos().find((c) => String(c.value) === id);
    if (opt) this.filtroContratoTexto.set(opt.label);
  }

  cargarContratos() {
    this.jornadaSvc.listarContratos().subscribe({
      next: (rows) => {
        this.contratos.set(
          rows.map((c) => ({
            value: String(c._id),
            label: [c.codContrato, c.razoSocial || c.nombreComercial].filter(Boolean).join(' — '),
          })),
        );
        this.aplicarContratoFijo();
      },
    });
  }

  recargar() {
    this.loading.set(true);
    this.msg.set('');
    const idContrato = this.filtroContratoId();
    this.jornadaSvc
      .listarEncuestasJornada(idContrato ? { idContrato } : undefined)
      .subscribe({
        next: (rows) => {
          this.encuestas.set(rows);
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.msgError.set(true);
          this.msg.set(e?.error?.message || 'No se pudieron cargar las encuestas.');
        },
      });
  }

  abrirNueva() {
    this.editId.set('');
    const idFijo = String(this.idContrato || '').trim();
    this.form = {
      idContrato: idFijo || this.filtroContratoId() || '',
      contratoTexto: this.filtroContratoTexto() || '',
      titulo: '',
      instrucciones: '',
      fechaApertura: '',
      fechaCierre: '',
    };
    this.modalForm.set(true);
  }

  onContratoFiltroPick(opt: EnumBuscarOption) {
    this.filtroContratoId.set(String(opt.value));
    this.filtroContratoTexto.set(opt.label);
    this.recargar();
  }

  onContratoFiltroLimpiar() {
    this.filtroContratoId.set('');
    this.filtroContratoTexto.set('');
    this.recargar();
  }

  onContratoFormPick(opt: EnumBuscarOption) {
    this.form.idContrato = String(opt.value);
    this.form.contratoTexto = opt.label;
  }

  onContratoFormLimpiar() {
    this.form.idContrato = '';
    this.form.contratoTexto = '';
  }

  abrirEditar(e: EncuestaJornadaItem) {
    this.editId.set(e._id);
    this.form = {
      idContrato: e.idContrato,
      contratoTexto: e.contratoLabel || e.codContrato || '',
      titulo: e.titulo,
      instrucciones: e.instrucciones || '',
      fechaApertura: e.fechaApertura ? String(e.fechaApertura).slice(0, 10) : '',
      fechaCierre: e.fechaCierre ? String(e.fechaCierre).slice(0, 10) : '',
    };
    this.modalForm.set(true);
  }

  guardar() {
    const titulo = this.form.titulo.trim();
    if (!titulo) {
      this.msgError.set(true);
      this.msg.set('El título es obligatorio.');
      return;
    }
    const body = {
      titulo,
      instrucciones: this.form.instrucciones.trim(),
      fechaApertura: this.form.fechaApertura || null,
      fechaCierre: this.form.fechaCierre || null,
    };
    this.guardando.set(true);
    const id = this.editId();
    const req = id
      ? this.jornadaSvc.actualizarEncuestaJornada(id, body)
      : this.jornadaSvc.crearEncuestaJornada(this.form.idContrato, body);

    if (!id && !this.form.idContrato) {
      this.guardando.set(false);
      this.msgError.set(true);
      this.msg.set('Seleccione un contrato.');
      return;
    }

    req.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalForm.set(false);
        this.msgError.set(false);
        this.msg.set(id ? 'Encuesta actualizada.' : 'Encuesta creada.');
        this.recargar();
      },
      error: (e) => {
        this.guardando.set(false);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo guardar.');
      },
    });
  }

  publicar(e: EncuestaJornadaItem) {
    void this.confirm
      .open({
        title: 'Publicar encuesta',
        message: `¿Publicar «${e.titulo}»? Solo puede haber una encuesta publicada por contrato.`,
        confirmLabel: 'Publicar',
        variant: 'success',
      })
      .then((ok) => {
        if (!ok) return;
        this.jornadaSvc.publicarEncuestaJornada(e._id).subscribe({
          next: () => {
            this.msgError.set(false);
            this.msg.set('Encuesta publicada.');
            this.recargar();
          },
          error: (err) => {
            this.msgError.set(true);
            this.msg.set(err?.error?.message || 'No se pudo publicar.');
          },
        });
      });
  }

  cerrar(e: EncuestaJornadaItem) {
    void this.confirm
      .open({
        title: 'Cerrar encuesta',
        message: `¿Cerrar «${e.titulo}»? Ya no aceptará nuevas respuestas.`,
        confirmLabel: 'Cerrar',
        variant: 'warn',
      })
      .then((ok) => {
        if (!ok) return;
        this.jornadaSvc.cerrarEncuestaJornada(e._id).subscribe({
          next: () => {
            this.msgError.set(false);
            this.msg.set('Encuesta cerrada.');
            this.recargar();
          },
          error: (err) => {
            this.msgError.set(true);
            this.msg.set(err?.error?.message || 'No se pudo cerrar.');
          },
        });
      });
  }

  eliminar(e: EncuestaJornadaItem) {
    void this.confirm
      .open({
        title: 'Eliminar encuesta',
        message: `¿Eliminar «${e.titulo}»? Solo es posible si no hay respuestas.`,
        confirmLabel: 'Eliminar',
        variant: 'danger',
      })
      .then((ok) => {
        if (!ok) return;
        this.jornadaSvc.eliminarEncuestaJornada(e._id).subscribe({
          next: () => {
            this.msgError.set(false);
            this.msg.set('Encuesta eliminada.');
            this.recargar();
          },
          error: (err) => {
            this.msgError.set(true);
            this.msg.set(err?.error?.message || 'No se pudo eliminar.');
          },
        });
      });
  }

  verResultados(e: EncuestaJornadaItem) {
    this.modalResultados.set(true);
    this.vistaResultados.set('dashboard');
    this.resultados.set(null);
    this.cargandoResultados.set(true);
    this.jornadaSvc.resultadosEncuestaJornada(e._id).subscribe({
      next: (res) => {
        this.resultados.set(res);
        this.cargandoResultados.set(false);
      },
      error: (err) => {
        this.cargandoResultados.set(false);
        this.msgError.set(true);
        this.msg.set(err?.error?.message || 'No se pudieron cargar los resultados.');
        this.modalResultados.set(false);
      },
    });
  }

  exportarInformePdf() {
    const res = this.resultados();
    if (!res?.encuesta?._id || this.exportandoInforme()) return;
    this.exportandoInforme.set(true);
    this.msg.set('');
    this.jornadaSvc.descargarInformeEncuestaPdf(res.encuesta._id).subscribe({
      next: (blob) => {
        this.exportandoInforme.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const cod = res.encuesta.codContrato || res.encuesta._id;
        a.download = `informe_encuesta_${cod}_${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.msgError.set(false);
        this.msg.set('Informe PDF descargado.');
      },
      error: (e) => {
        this.exportandoInforme.set(false);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo generar el informe PDF.');
      },
    });
  }

  exportarCsv() {
    const res = this.resultados();
    if (!res) return;
    const aspectos = res.aspectos?.length ? res.aspectos : this.aspectosDefault;
    const header = [
      'Documento',
      'Nombre',
      'Programa',
      'Instructor',
      'Promedio capacitación',
      ...aspectos.map((a) => a.label),
      'Comentario',
      'Fecha',
    ];
    const lines = [header.join(';')];
    for (const f of res.filas) {
      if (f.calificacionesCarpa?.length) {
        for (const c of f.calificacionesCarpa) {
          lines.push(
            [
              f.numDoc,
              `"${(f.nombreCompleto || '').replace(/"/g, '""')}"`,
              `"${(c.programaNombre || c.nombre || '').replace(/"/g, '""')}"`,
              `"${(c.instructorNombre || '').replace(/"/g, '""')}"`,
              c.promedio != null ? String(c.promedio) : '',
              ...aspectos.map((a) => String(c.aspectos?.[a.key] ?? '')),
              `"${(f.comentario || '').replace(/"/g, '""')}"`,
              f.fechaEnvio ? String(f.fechaEnvio).slice(0, 19) : '',
            ].join(';'),
          );
        }
      } else {
        for (const c of f.calificaciones) {
          lines.push(
            [
              f.numDoc,
              `"${(f.nombreCompleto || '').replace(/"/g, '""')}"`,
              `"${(c.nombre || '').replace(/"/g, '""')} (legado)"`,
              '',
              String(c.nota),
              '',
              '',
              '',
              '',
              '',
              `"${(f.comentario || '').replace(/"/g, '""')}"`,
              f.fechaEnvio ? String(f.fechaEnvio).slice(0, 19) : '',
            ].join(';'),
          );
        }
      }
    }
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluacion-${res.encuesta.codContrato || res.encuesta._id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  promedioAspectoCarpa(
    carpa: EncuestaJornadaResultados['promediosCarpa'][number],
    key: string,
  ): string {
    const v = carpa.aspectos?.[key]?.promedio;
    return v != null ? String(v) : '—';
  }

  notaAspectoAlumno(
    fila: EncuestaJornadaResultados['filas'][number],
    calificacion: EncuestaJornadaResultados['filas'][number]['calificacionesCarpa'][number],
    key: string,
  ): string {
    const v = calificacion?.aspectos?.[key];
    return v != null ? String(v) : '—';
  }

  notaAlumno(fila: EncuestaJornadaResultados['filas'][number], idProg: string): string {
    const c = fila.calificaciones.find((x) => x.idProg === idProg);
    return c ? String(c.nota) : '—';
  }

  estadoClass(estado: string): string {
    if (estado === 'PUBLICADA') return 'estado--pub';
    if (estado === 'CERRADA') return 'estado--cerr';
    return 'estado--bor';
  }
}
