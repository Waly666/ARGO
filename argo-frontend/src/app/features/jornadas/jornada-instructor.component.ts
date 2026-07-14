import { CommonModule } from '@angular/common';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { CertificadoJornadaAlertService } from '../../core/services/certificado-jornada-alert.service';
import { MetaAlumnosJornadaAlertService } from '../../core/services/meta-alumnos-jornada-alert.service';
import { CertificadoJornadaBloqueoService } from '../../core/services/certificado-jornada-bloqueo.service';
import { JornadaLiveSyncService } from '../../core/services/jornada-live-sync.service';
import { JornadaCapService } from '../../core/services/jornada-cap.service';
import {
  ProgresoCertResp,
  etiquetaProgresoCert,
} from './jornada-progreso.util';
import {
  JorMsgTipo,
  capAlumnoNombre,
  capContratoLabel,
  capDocAsis,
  capFechaJor,
  capHoraJor,
  capMunicipioJor,
  capPrograma,
  capSesCert,
  capUbicacionClase,
  capCarpa,
  labelCarpaClase,
  capInstructor,
  estadoClaseLiveClass,
  estadoJornadaLiveClass,
  iconoJorMsg,
  rowClaseClass,
  rowJornadaClass,
  tituloJorMsg,
  isoAHoraInput,
  validarHoraInput,
  labelInstructorClase,
} from './jornada-ui.util';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
import { Hora12InputComponent } from '../../shared/hora-12-input/hora-12-input.component';
import { JornadasOperacionConfigService } from '../../core/services/jornadas-operacion-config.service';
import { ymdLocal } from './jornada-calendario.util';

@Component({
  selector: 'argo-jornada-instructor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CatalogoEnumBuscarComponent,
    ArgoDateInputComponent,
    Hora12InputComponent,
  ],
  templateUrl: './jornada-instructor.component.html',
  styleUrls: ['./jornada-instructor.component.scss'],
})
export class JornadaInstructorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private jornadaSvc = inject(JornadaCapService);
  private auth = inject(AuthService);
  private certAlertSvc = inject(CertificadoJornadaAlertService);
  private metaAlumnosAlertSvc = inject(MetaAlumnosJornadaAlertService);
  private certBloqueoSvc = inject(CertificadoJornadaBloqueoService);
  private liveSync = inject(JornadaLiveSyncService);
  operacionCfg = inject(JornadasOperacionConfigService);
  operacionEspecialActiva = this.operacionCfg.puedeOperarFueraDeDia;

  msg = signal<string | null>(null);
  msgTipo = signal<JorMsgTipo>('info');
  msgTitulo = signal('');
  fecha = signal(ymdLocal(new Date()));

  jornadasHoy = signal<any[]>([]);
  jornadaSel = signal<string>('');

  clases = signal<any[]>([]);
  claseSel = signal<string>('');
  claseActiva = signal<any | null>(null);

  programasJornada = signal<any[]>([]);
  nuevaClaseProg = signal('');
  nuevaClaseUbic = signal('Carpa');
  horaInicioClase = signal('');
  horaFinClase = signal('');
  guardandoHorario = signal(false);

  asistencias = signal<any[]>([]);
  numDocAsis = signal('');
  progresoPreview = signal<ProgresoCertResp | null>(null);
  nombreAlumnoPreview = signal('');
  progresoPreviewLoading = signal(false);

  jornadaActiva = computed(() => this.jornadasHoy().find((j) => j._id === this.jornadaSel()));

  etiquetaProgresoCert = etiquetaProgresoCert;
  iconoJorMsg = iconoJorMsg;
  estadoJornadaLiveClass = estadoJornadaLiveClass;
  rowJornadaClass = rowJornadaClass;
  estadoClaseLiveClass = estadoClaseLiveClass;
  rowClaseClass = rowClaseClass;
  capUbicacionClase = capUbicacionClase;
  capCarpa = capCarpa;
  labelCarpaClase = labelCarpaClase;
  capContratoLabel = capContratoLabel;
  capMunicipioJor = capMunicipioJor;
  capFechaJor = capFechaJor;
  capPrograma = capPrograma;
  capSesCert = capSesCert;
  capHoraJor = capHoraJor;
  capDocAsis = capDocAsis;
  capAlumnoNombre = capAlumnoNombre;
  capInstructor = capInstructor;
  labelInstructorClase = labelInstructorClase;

  instructorSesionNombre = computed(
    () => this.auth.user()?.empleado?.nombreCompleto || this.auth.user()?.username || '—',
  );

  private progresoDebounce: ReturnType<typeof setTimeout> | null = null;
  private ultimoDocCertDialog = '';

  ubicaciones = ['Carpa', 'Domo', 'Empresa', 'Colegio', 'Auditorio', 'Coliseo', 'Estadio', 'Otro'];

  opcionesProgramasInstructor = computed<EnumBuscarOption[]>(() =>
    this.programasJornada().map((p) => ({
      value: String(p.idPrograma || p._id || ''),
      label: String(p.nombreProg || p.codigoProg || ''),
    })),
  );

  textoProgramaInstructor = computed(() => {
    const id = this.nuevaClaseProg();
    if (!id) return '';
    const p = this.programasJornada().find(
      (x) => String(x.idPrograma || x._id) === String(id),
    );
    return p ? String(p.nombreProg || p.codigoProg || id) : id;
  });

  opcionesUbicacionInstructor = computed<EnumBuscarOption[]>(() =>
    this.ubicaciones.map((u) => ({ value: u, label: u })),
  );

  textoUbicacionInstructor = computed(() => this.nuevaClaseUbic() || 'Carpa');

  ngOnInit() {
    this.operacionCfg.cargar();
    const q = this.route.snapshot.queryParamMap;
    const f = q.get('fecha');
    const j = q.get('jornada');
    const claseId = q.get('clase');
    this.fecha.set(f || ymdLocal(new Date()));
    this.cargarProgramas();
    this.cargarJornadasDia();
    if (j) {
      this.jornadaSel.set(j);
      this.recargarClases(claseId || undefined);
    }
  }

  onProgramaInstructorPick(opt: EnumBuscarOption): void {
    this.nuevaClaseProg.set(String(opt.value));
  }

  onProgramaInstructorLimpiar(): void {
    this.nuevaClaseProg.set('');
  }

  onUbicacionInstructorPick(opt: EnumBuscarOption): void {
    this.nuevaClaseUbic.set(String(opt.value));
  }

  onUbicacionInstructorLimpiar(): void {
    this.nuevaClaseUbic.set('Carpa');
  }

  mostrarMsg(texto: string, tipo: JorMsgTipo = 'info', titulo?: string) {
    this.msg.set(texto);
    this.msgTipo.set(tipo);
    this.msgTitulo.set(titulo ?? tituloJorMsg(tipo));
  }

  cerrarMsg() {
    this.msg.set(null);
    this.msgTitulo.set('');
  }

  cargarProgramas() {
    this.jornadaSvc.programasJornadaCap().subscribe({
      next: (p) => this.programasJornada.set(p || []),
    });
  }

  nombrePrograma(idProg: string): string {
    const p = this.programasJornada().find(
      (x) => String(x.idPrograma || x._id) === String(idProg),
    );
    return p?.nombreProg || p?.codigoProg || idProg;
  }

  cargarJornadasDia() {
    this.jornadaSvc.jornadasDelDia(this.fecha()).subscribe({
      next: (r) => this.jornadasHoy.set(r || []),
      error: () => this.jornadasHoy.set([]),
    });
  }

  onFechaChange(f: string) {
    this.fecha.set(f);
    this.jornadaSel.set('');
    this.claseSel.set('');
    this.claseActiva.set(null);
    this.cargarJornadasDia();
  }

  irHoy() {
    this.onFechaChange(ymdLocal(new Date()));
    this.mostrarMsg('Mostrando jornadas programadas para hoy.', 'info', 'Fecha actualizada');
  }

  seleccionarJornada(id: string) {
    const j = this.jornadasHoy().find((x) => x._id === id);
    if (!this.operacionEspecialActiva() && j && j.estado !== 'EN PROCESO') {
      this.mostrarMsg('Solo puede operar la jornada del día en estado EN PROCESO.', 'warn', 'Jornada no operable');
      return;
    }
    this.jornadaSel.set(id);
    this.claseSel.set('');
    this.claseActiva.set(null);
    this.recargarClases();
    this.consultarProgresoPreview(this.numDocAsis());
    this.mostrarMsg('Jornada lista para crear clases y tomar asistencia.', 'ok', 'Jornada seleccionada');
  }

  recargarClases(seleccionarId?: string) {
    const id = this.jornadaSel();
    if (!id) {
      this.clases.set([]);
      return;
    }
    this.jornadaSvc.listarClases({ idJornada: id }).subscribe({
      next: (r) => {
        this.clases.set(r || []);
        const act = seleccionarId || this.claseSel();
        if (act) {
          const c = (r || []).find((x: any) => x._id === act);
          if (c) {
            this.claseSel.set(c._id);
            this.claseActiva.set(c);
            this.horaInicioClase.set(isoAHoraInput(c.horaInicio));
            this.horaFinClase.set(isoAHoraInput(c.horaFin));
            this.cargarAsistencias(c._id);
          }
        }
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudieron cargar las clases.', 'error', 'Error'),
    });
  }

  crearClase() {
    const idJ = this.jornadaSel();
    const idP = this.nuevaClaseProg();
    if (!idJ || !idP) {
      this.mostrarMsg('Seleccione la jornada del día y el programa de capacitación.', 'warn', 'Datos incompletos');
      return;
    }
    if (!this.jornadaOperable()) {
      this.mostrarMsg('Las clases solo se crean en jornadas EN PROCESO (día de hoy).', 'warn', 'Fuera de operación');
      return;
    }
    this.jornadaSvc
      .crearClase({ idJornada: idJ, idPrograma: idP, ubicacion: this.nuevaClaseUbic() })
      .subscribe({
        next: (c) => {
          this.claseSel.set(c._id);
          this.claseActiva.set(c);
          this.recargarClases();
          this.mostrarMsg('Clase creada. Puede iniciarla y registrar asistencias.', 'ok', 'Clase lista');
        },
        error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo crear la clase.', 'error', 'Error'),
      });
  }

  seleccionarClase(c: any) {
    this.claseSel.set(c._id);
    this.claseActiva.set(c);
    this.horaInicioClase.set(isoAHoraInput(c.horaInicio));
    this.horaFinClase.set(isoAHoraInput(c.horaFin));
    this.cargarAsistencias(c._id);
    this.consultarProgresoPreview(this.numDocAsis());
  }

  guardarHorarioClase() {
    const id = this.claseSel();
    if (!id) return;
    const hi = this.horaInicioClase().trim();
    const hf = this.horaFinClase().trim();
    if (!validarHoraInput(hi) || !validarHoraInput(hf)) {
      this.mostrarMsg('Use formato HH:mm (ej. 08:30).', 'error', 'Horario inválido');
      return;
    }
    this.guardandoHorario.set(true);
    this.jornadaSvc
      .actualizarClase(id, { horaInicio: hi || null, horaFin: hf || null })
      .subscribe({
        next: (r: any) => {
          this.guardandoHorario.set(false);
          const c = r?.clase || r;
          this.claseActiva.set(c);
          this.horaInicioClase.set(isoAHoraInput(c.horaInicio));
          this.horaFinClase.set(isoAHoraInput(c.horaFin));
          this.recargarClases(id);
          const nCert = this.contarCertificadosEmitidos(r);
          if (nCert > 0) {
            this.certAlertSvc.notificarVariosDesdeRespuesta(r?.certificadosEmitidos);
          }
          const msg = r?.message || 'Horario de la clase actualizado.';
          this.mostrarMsg(msg, nCert > 0 ? 'ok' : 'info', 'Horario guardado');
        },
        error: (e) => {
          this.guardandoHorario.set(false);
          this.mostrarMsg(e?.error?.message || 'No se pudo guardar el horario.', 'error', 'Error');
        },
      });
  }

  onNumDocAsisChange(value: string) {
    this.numDocAsis.set(value);
    this.consultarProgresoPreview(value);
  }

  consultarProgresoPreview(raw: string) {
    if (this.progresoDebounce) clearTimeout(this.progresoDebounce);
    const nd = raw.trim();
    const idContrato = this.jornadaActiva()?.idContrato;
    if (!nd || nd.length < 5 || !idContrato) {
      this.progresoPreview.set(null);
      this.nombreAlumnoPreview.set('');
      this.progresoPreviewLoading.set(false);
      this.ultimoDocCertDialog = '';
      return;
    }
    this.progresoPreviewLoading.set(true);
    this.progresoDebounce = setTimeout(() => {
      this.jornadaSvc.progresoCertificacion(nd, String(idContrato)).subscribe({
        next: (p) => {
          this.progresoPreview.set(p);
          this.progresoPreviewLoading.set(false);
          if (p.certificado && nd !== this.ultimoDocCertDialog) {
            this.ultimoDocCertDialog = nd;
            void this.certBloqueoSvc.mostrarAlumnoCertificado({
              nombreAlumno: this.nombreAlumnoPreview() || nd,
              certificado: p.certificado,
            });
          }
        },
        error: () => {
          this.progresoPreview.set(null);
          this.progresoPreviewLoading.set(false);
        },
      });
      this.jornadaSvc.buscarAlumnoDoc(nd).subscribe({
        next: (a: any) => {
          const nom = [a.nombre1, a.nombre2].filter(Boolean).join(' ').trim() || String(a.nombres || '').trim();
          const ap = [a.apellido1, a.apellido2].filter(Boolean).join(' ').trim() || String(a.apellidos || '').trim();
          this.nombreAlumnoPreview.set(`${nom} ${ap}`.trim() || a.nombreCompleto || '');
        },
        error: () => this.nombreAlumnoPreview.set(''),
      });
    }, 400);
  }

  cargarAsistencias(idClase: string) {
    this.jornadaSvc.listarAsistencias(idClase).subscribe({
      next: (r) => this.asistencias.set(r || []),
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudieron cargar las asistencias.', 'error', 'Error'),
    });
  }

  iniciarClase() {
    const id = this.claseSel();
    if (!id) return;
    this.jornadaSvc.iniciarClase(id).subscribe({
      next: (c) => {
        this.claseActiva.set(c);
        this.horaInicioClase.set(isoAHoraInput(c.horaInicio));
        this.horaFinClase.set(isoAHoraInput(c.horaFin));
        this.recargarClases(id);
        this.liveSync.notificarClaseIniciada(c as unknown as Record<string, unknown>);
        this.mostrarMsg('Reloj de clase iniciado. Ya puede registrar asistencias.', 'ok', 'Clase en curso');
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo iniciar la clase.', 'error', 'Error'),
    });
  }

  finalizarClase() {
    const id = this.claseSel();
    if (!id) return;
    const payload: { horaInicio?: string; horaFin?: string } = {};
    if (this.operacionEspecialActiva()) {
      const hi = this.horaInicioClase().trim();
      const hf = this.horaFinClase().trim();
      if (this.claseActiva()?.estado !== 'EN PROCESO') {
        if (!validarHoraInput(hi) || !validarHoraInput(hf)) {
          this.mostrarMsg(
            'Indique hora de inicio y hora de fin antes de finalizar.',
            'error',
            'Horario requerido',
          );
          return;
        }
      }
      if (validarHoraInput(hi)) payload.horaInicio = hi;
      if (validarHoraInput(hf)) payload.horaFin = hf;
    }
    this.jornadaSvc.finalizarClase(id, payload).subscribe({
      next: (r: any) => {
        const c = r?.clase || { ...this.claseActiva(), estado: 'FINALIZADO' };
        this.claseActiva.set(c);
        this.horaInicioClase.set(isoAHoraInput(c.horaInicio));
        this.horaFinClase.set(isoAHoraInput(c.horaFin));
        this.recargarClases(id);
        this.liveSync.notificarClaseFinalizada(c as unknown as Record<string, unknown>);
        const nCert = this.contarCertificadosEmitidos(r);
        if (nCert > 0) {
          this.certAlertSvc.notificarVariosDesdeRespuesta(r?.certificadosEmitidos);
        }
        let msg = 'Clase cerrada correctamente.';
        if (r?.asistenciasRegistradas > 0) {
          msg += ` Asistencia a ${r.asistenciasRegistradas} alumno(s).`;
        }
        if (nCert > 0) {
          msg += ` Certificados emitidos: ${nCert}.`;
        }
        this.mostrarMsg(msg, nCert > 0 ? 'ok' : 'info', 'Clase finalizada');
      },
      error: (e) => this.mostrarMsg(e?.error?.message || 'No se pudo finalizar la clase.', 'error', 'Error'),
    });
  }

  alumnoYaCertificadoContrato(): boolean {
    return !!this.progresoPreview()?.certificado;
  }

  mostrarDialogoAlumnoCertificado() {
    const nd = this.numDocAsis().trim();
    const p = this.progresoPreview();
    if (!p?.certificado) return;
    void this.certBloqueoSvc.mostrarAlumnoCertificado({
      nombreAlumno: this.nombreAlumnoPreview() || nd || 'El alumno',
      certificado: p.certificado,
    });
  }

  marcarAsistencia() {
    const id = this.claseSel();
    const nd = this.numDocAsis().trim();
    if (!id || !nd) return;
    if (this.alumnoYaCertificadoContrato()) {
      this.mostrarDialogoAlumnoCertificado();
      return;
    }
    this.jornadaSvc.registrarAsistencia(id, nd).subscribe({
      next: (r: any) => {
        this.numDocAsis.set('');
        this.progresoPreview.set(null);
        this.nombreAlumnoPreview.set('');
        this.cargarAsistencias(id);
        this.metaAlumnosAlertSvc.notificarDesdeRespuesta(r?.metaJornada, {
          contratoLabel: this.jornadaActiva()?.contratoLabel || this.jornadaActiva()?.codContrato,
        });
        if (r.certificadoGenerado && r.certificado) {
          this.certAlertSvc.notificarDesdeRespuesta(r.certificado, r.nombreAlumno);
        }
        this.mostrarMsg(this.textoAsistencia(r, nd), r.certificadoGenerado ? 'ok' : 'info', r.certificadoGenerado ? 'Certificado emitido' : 'Asistencia registrada');
      },
      error: (e) => {
        const body = e?.error;
        if (e?.status === 409 && body?.codigo === 'ya_certificado_contrato') {
          void this.certBloqueoSvc.mostrarDesdeError(body, this.nombreAlumnoPreview() || nd);
          return;
        }
        if (e?.status === 409 && body?.sesiones != null) {
          this.mostrarMsg(this.textoAsistencia(body, nd), 'info', 'Progreso del alumno');
          return;
        }
        this.mostrarMsg(body?.message || 'No se pudo registrar la asistencia.', 'error', 'Error');
      },
    });
  }

  private contarCertificadosEmitidos(r: {
    certificadosGenerados?: number;
    certificadosNuevos?: number;
    certificadosEmitidos?: unknown[];
  } | null | undefined): number {
    const porLista = Array.isArray(r?.certificadosEmitidos) ? r!.certificadosEmitidos!.length : 0;
    const porContador = Math.max(Number(r?.certificadosGenerados) || 0, Number(r?.certificadosNuevos) || 0);
    return Math.max(porLista, porContador);
  }

  private textoAsistencia(r: any, nd: string): string {
    const ses = r.sesiones ?? 0;
    const req = r.numSesCert ?? '?';
    if (r.certificadoGenerado) {
      return `Certificado automático (${ses}/${req} sesiones). Código: ${r.certificado?.codigoCert || 'OK'}`;
    }
    const faltan = r.faltan ?? Math.max(0, Number(req) - ses);
    return `${r.nombreAlumno || nd}: ${ses}/${req} sesiones — faltan ${faltan} para certificado automático`;
  }

  jornadaOperable(): boolean {
    if (this.operacionEspecialActiva()) return !!this.jornadaActiva();
    return this.jornadaActiva()?.estado === 'EN PROCESO';
  }

  chipClaseCal(c: any): string {
    const prog = this.nombrePrograma(c.idPrograma);
    return `${prog} · ${labelInstructorClase(c)}`;
  }

  fmtFecha(f?: string) {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-CO');
  }

  fmtHora(f?: string) {
    if (!f) return '—';
    return new Date(f).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
}
