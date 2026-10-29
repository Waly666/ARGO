import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { TurnstileComponent } from '../../components/turnstile/turnstile.component';
import { AutorizacionDatosComponent } from '../../shared/autorizacion-datos/autorizacion-datos.component';
import { PortalIconComponent } from '../../shared/portal-icon/portal-icon.component';
import { PortalPromoBannerHeroComponent } from '../../shared/portal-promo-banner-hero/portal-promo-banner-hero.component';
import {
  PromoBannerRibbonItem,
} from '../../shared/portal-promo-banner-hero/portal-promo-banner-defaults';
import { payloadAutorizacionDatos } from '../../core/autorizacion-datos.constants';
import { AulaApiService } from '../../core/aula-api.service';
import { PortalConfig } from '../../core/models';
import { mergePortalLanding } from '../../core/portal-landing';
import {
  ACTOR_VIAL_FALLBACK,
  catEtiqueta,
  catValor,
  DISCAPACIDAD_FALLBACK,
  etiquetaGenero,
  GENEROS_FALLBACK,
  IDENTIDAD_GENERO_FALLBACK,
  MULTICULTURALIDAD_FALLBACK,
  ORIENTACION_SEXUAL_FALLBACK,
  ORIGENES_JORNADA_UI,
  PORTAL_ALUMNO_DEFAULTS,
  TIPOS_DOC_FALLBACK,
} from '../../core/catalogo.helpers';
import { PortalCatalogService } from '../../core/portal-catalog.service';
import { PortalSeoService } from '../../core/portal-seo.service';
import { portalHeroImagenPublicUrl, portalHeroImagenStoredAlt } from '../../core/portal-hero-imagen.util';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
import {
  PERFILES_INSTITUCION_UI,
  esNivelBasicaMedia,
  esNivelSuperior,
  labelCursoGrado,
  labelInstitucionBuscar,
  normalizarNivelInstitucion,
  opcionesAreaImparte,
  opcionesGradoColegio,
  opcionesSemestreInstitucion,
  opcionesTipoInstitucion,
  validarOrigenJornadaForm,
  type OrigenJornadaKey,
} from '../../core/origen-jornada.helpers';

@Component({
  selector: 'av-jornadas-capacitacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TurnstileComponent,
    AutorizacionDatosComponent,
    PortalIconComponent,
    PortalPromoBannerHeroComponent,
    CatalogoEnumBuscarComponent,
  ],
  templateUrl: './jornadas-capacitacion.component.html',
  styleUrl: './jornadas-capacitacion.component.scss',
})
export class JornadasCapacitacionComponent implements OnInit {
  private api = inject(AulaApiService);
  private catalogs = inject(PortalCatalogService);
  private seo = inject(PortalSeoService);

  turnstile = viewChild(TurnstileComponent);

  readonly catEtiqueta = catEtiqueta;
  readonly catValor = catValor;
  readonly etiquetaGenero = etiquetaGenero;

  config = signal<PortalConfig | null>(null);
  landing = computed(() => mergePortalLanding(this.config()?.landing));
  jornadas = computed(() => this.landing().jornadasCapacitacion);
  heroPilares = computed(() => this.jornadas().hero.pillars);
  heroPhoto = computed(() => portalHeroImagenPublicUrl(this.jornadas().hero));
  heroPhotoAlt = computed(() =>
    portalHeroImagenStoredAlt(this.jornadas().hero, this.jornadas().hero.tituloLinea),
  );

  readonly heroRibbon: PromoBannerRibbonItem[] = [
    { icon: 'qr-code', label: 'Código QR de asistencia' },
    { icon: 'user-group', label: 'Formación presencial' },
    { icon: 'shield-check', label: 'Seguridad vial' },
    { icon: 'heart', label: 'Experiencia práctica' },
  ];

  tiposDoc = signal<Record<string, unknown>[]>([]);
  generos = signal<Record<string, unknown>[]>([]);
  identidadesGenero = signal<Record<string, unknown>[]>([]);
  orientacionesSexuales = signal<Record<string, unknown>[]>([]);
  discapacidades = signal<Record<string, unknown>[]>([]);
  multiculturalidades = signal<Record<string, unknown>[]>([]);
  actoresViales = signal<Record<string, unknown>[]>([]);
  readonly origenesJornada = ORIGENES_JORNADA_UI;
  readonly perfilesInstitucion = PERFILES_INSTITUCION_UI;
  readonly opcionesTipoInstitucion = opcionesTipoInstitucion;
  readonly opcionesAreaImparte = opcionesAreaImparte;
  departamentos = signal<{ codDepto: string; nombreDepto: string }[]>([]);
  municipiosExp = signal<{ codMunicipio: string; nombreMunicipio: string; label: string }[]>([]);
  municipiosOrigen = signal<{ codMunicipio: string; nombreMunicipio: string; label: string }[]>([]);

  deptoExp = '';
  codMunicipioExp = '';
  deptoOrigen = '';
  codMunicipioOrigen = '';

  form = {
    email: '',
    tipoDoc: '1',
    numDoc: '',
    expedida: '',
    apellido1: '',
    apellido2: '',
    nombre1: '',
    nombre2: '',
    celular: '',
    direccion: '',
    genero: '',
    identidadGenero: PORTAL_ALUMNO_DEFAULTS.identidadGenero as string,
    orientacionSexual: PORTAL_ALUMNO_DEFAULTS.orientacionSexual as string,
    discapacidad: PORTAL_ALUMNO_DEFAULTS.discapacidad as string,
    multiCulturalidad: PORTAL_ALUMNO_DEFAULTS.multiCulturalidad as string,
    origenJornadaCap: PORTAL_ALUMNO_DEFAULTS.origenJornadaCap as OrigenJornadaKey,
    tipoInstitucionEducativa: 'secundaria',
    perfilInstitucionEducativa: 'estudiante',
    colegioCodigo: '',
    colegioNombre: '',
    gradoColegio: null as number | null,
    semestreInstitucion: null as number | null,
    titulacionCodigo: '',
    programaInstitucion: '',
    areaImparteColegio: '',
    estamentoId: '',
    estamentoNombre: '',
    cargoEstamento: '',
    dependenciaEstamento: '',
    actorVial: '',
    fechaNac: '',
    codMunicipio: '',
    munOrigen: '',
    codDepartamento: '',
    nombreDepartamento: '',
    nombreMunicipio: '',
    empresaId: null as string | null,
    empresaNombre: null as string | null,
  };

  empresaBusqReg = signal('');
  empresaSugsReg = signal<{ _id: string; nombre: string; identificacion: string }[]>([]);
  empresaDropReg = signal(false);
  empresaCargReg = signal(false);

  error = signal('');
  info = signal('');
  loading = signal(false);
  buscando = signal(false);
  alumnoEnArgo = signal(false);
  registroAbierto = signal(true);
  emailVerificacion = signal(false);
  paso = signal<'formulario' | 'codigo' | 'exito'>('formulario');
  pendingId = signal('');
  emailEnmascarado = signal('');
  codigoVerificacion = signal('');
  reenviando = signal(false);
  turnstileSiteKey = signal('');
  turnstileToken = signal('');
  aceptaAutorizacion = signal(false);
  mensajeExito = signal('');
  nombreExito = signal('');
  nombreEmpresa = signal('');
  correoEmpresa = signal('');

  nivelInstitucionUi = computed(() => normalizarNivelInstitucion(this.form.tipoInstitucionEducativa));
  esProfesorInstitucion = computed(
    () =>
      this.form.origenJornadaCap === 'colegio' &&
      this.form.perfilInstitucionEducativa === 'profesor',
  );
  esNivelBasicaMediaUi = computed(() => esNivelBasicaMedia(this.form.tipoInstitucionEducativa));
  esNivelSuperiorUi = computed(() => esNivelSuperior(this.form.tipoInstitucionEducativa));
  claveBusquedaInstitucion = computed(
    () => `${this.nivelInstitucionUi()}|${this.form.codMunicipio || this.form.munOrigen || ''}`,
  );
  labelInstitucion = computed(() => labelInstitucionBuscar(this.form.tipoInstitucionEducativa));
  labelGradoCurso = computed(() => labelCursoGrado(this.form.tipoInstitucionEducativa));

  textoTipoInstitucion = computed(() => {
    const k = this.nivelInstitucionUi();
    return opcionesTipoInstitucion().find((o) => o.value === k)?.label || '';
  });
  textoGradoColegio = computed(() => {
    const g = this.form.gradoColegio;
    if (g == null || !Number.isFinite(Number(g))) return '';
    return this.nivelInstitucionUi() === 'primaria' ? `Curso ${g}` : `Grado ${g}`;
  });
  textoSemestreInstitucion = computed(() => {
    const s = this.form.semestreInstitucion;
    if (s == null || !Number.isFinite(Number(s))) return '';
    return `Semestre ${s}`;
  });
  textoAreaImparte = computed(() => {
    const k = String(this.form.areaImparteColegio || '').trim();
    return opcionesAreaImparte().find((o) => o.value === k)?.label || '';
  });

  opcionesGradoColegioLocal = computed(() => opcionesGradoColegio(this.form.tipoInstitucionEducativa));
  opcionesSemestreLocal = opcionesSemestreInstitucion;

  buscarColegiosRemoto = (q: string) => {
    const cod = String(this.form.codMunicipio || this.form.munOrigen || '').trim();
    const nivel = this.nivelInstitucionUi();
    const superior = ['tecnica', 'tecnologica', 'universidad'].includes(nivel);
    const limit = superior ? 500 : 60;
    return this.catalogs.buscarColegios(cod, q, limit, nivel).pipe(
      map((rows) =>
        rows.map((r) => {
          const nombre = String(r.nombreEstablecimiento || r.label || '').trim();
          const muni = String(r.nombreMunicipio || '').trim();
          const depto = String(r.nombreDepartamento || '').trim();
          const ubi = r.hint || [muni, depto].filter(Boolean).join(' · ');
          return {
            value: r.codigoEstablecimiento,
            label: nombre,
            hint: ubi || undefined,
          };
        }),
      ),
      catchError(() => of([] as EnumBuscarOption[])),
    );
  };

  buscarTitulacionesRemoto = (q: string) => {
    const nivel = this.nivelInstitucionUi();
    return this.catalogs.buscarTitulaciones(nivel, q, 80).pipe(
      map((rows) =>
        rows.map((r) => ({
          value: r.codigo,
          label: r.nombre || r.label || '',
          hint: r.hint,
        })),
      ),
      catchError(() => of([] as EnumBuscarOption[])),
    );
  };

  buscarEstamentosRemoto = (q: string) => {
    const cod = String(this.form.codMunicipio || this.form.munOrigen || '').trim();
    return this.catalogs.buscarEstamentosPublicos(cod, q, 40).pipe(
      map((rows) =>
        rows.map((r) => ({
          value: r.idEstamento,
          label: r.label || r.nombre || '',
        })),
      ),
      catchError(() => of([] as EnumBuscarOption[])),
    );
  };

  buscarEmpresasOrigenRemoto = (q: string) =>
    this.api.buscarEmpresasPublico(q.trim()).pipe(
      map((rows) =>
        rows.map((e) => ({
          value: e._id,
          label: e.nombre,
          hint: e.identificacion,
        })),
      ),
      catchError(() => of([] as EnumBuscarOption[])),
    );

  ngOnInit() {
    this.catalogs.tiposDoc().subscribe({
      next: (rows) => this.tiposDoc.set(rows?.length ? rows : TIPOS_DOC_FALLBACK),
      error: () => this.tiposDoc.set(TIPOS_DOC_FALLBACK),
    });
    this.catalogs.generos().subscribe({
      next: (rows) => this.generos.set(rows?.length ? rows : GENEROS_FALLBACK),
      error: () => this.generos.set(GENEROS_FALLBACK),
    });
    this.catalogs.identidadesGenero().subscribe({
      next: (rows) => this.identidadesGenero.set(rows?.length ? rows : IDENTIDAD_GENERO_FALLBACK),
      error: () => this.identidadesGenero.set(IDENTIDAD_GENERO_FALLBACK),
    });
    this.catalogs.orientacionesSexuales().subscribe({
      next: (rows) => this.orientacionesSexuales.set(rows?.length ? rows : ORIENTACION_SEXUAL_FALLBACK),
      error: () => this.orientacionesSexuales.set(ORIENTACION_SEXUAL_FALLBACK),
    });
    this.catalogs.discapacidades().subscribe({
      next: (rows) => this.discapacidades.set(rows?.length ? rows : DISCAPACIDAD_FALLBACK),
      error: () => this.discapacidades.set(DISCAPACIDAD_FALLBACK),
    });
    this.catalogs.multiculturalidad().subscribe({
      next: (rows) => this.multiculturalidades.set(rows?.length ? rows : MULTICULTURALIDAD_FALLBACK),
      error: () => this.multiculturalidades.set(MULTICULTURALIDAD_FALLBACK),
    });
    this.catalogs.actoresViales().subscribe({
      next: (rows) => this.actoresViales.set(rows?.length ? rows : ACTOR_VIAL_FALLBACK),
      error: () => this.actoresViales.set(ACTOR_VIAL_FALLBACK),
    });
    this.catalogs.departamentos().subscribe({
      next: (rows) => this.departamentos.set(rows || []),
      error: () => this.departamentos.set([]),
    });

    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.turnstileSiteKey.set(c.turnstileSiteKey || '');
        this.registroAbierto.set(c.registroAbierto !== false);
        this.emailVerificacion.set(!!c.emailVerificacionRegistro);
        this.nombreEmpresa.set(c.nombreCea || '');
        this.correoEmpresa.set(c.email || '');
        this.seo.applyJornadasCapacitacion(c);
      },
      error: () => undefined,
    });
  }

  onDeptoExpChange() {
    this.codMunicipioExp = '';
    this.form.expedida = '';
    this.cargarMunicipiosExp();
  }

  onMunicipioExpChange() {
    const m = this.municipiosExp().find((x) => x.codMunicipio === this.codMunicipioExp);
    this.form.expedida = m?.nombreMunicipio || '';
  }

  onDeptoOrigenChange() {
    this.codMunicipioOrigen = '';
    this.form.codMunicipio = '';
    this.form.munOrigen = '';
    this.form.codDepartamento = this.deptoOrigen || '';
    const dep = this.departamentos().find((d) => d.codDepto === this.deptoOrigen);
    this.form.nombreDepartamento = dep?.nombreDepto || '';
    this.form.nombreMunicipio = '';
    this.cargarMunicipiosOrigen();
  }

  onMunicipioOrigenChange() {
    this.form.codMunicipio = this.codMunicipioOrigen;
    this.form.munOrigen = this.codMunicipioOrigen;
    this.form.codDepartamento = this.deptoOrigen || '';
    const dep = this.departamentos().find((d) => d.codDepto === this.deptoOrigen);
    this.form.nombreDepartamento = dep?.nombreDepto || '';
    const m = this.municipiosOrigen().find((x) => x.codMunicipio === this.codMunicipioOrigen);
    this.form.nombreMunicipio = m?.nombreMunicipio || '';
  }

  private cargarMunicipiosExp() {
    if (!this.deptoExp) {
      this.municipiosExp.set([]);
      return;
    }
    this.catalogs.municipios(this.deptoExp).subscribe({
      next: (rows) => this.municipiosExp.set(rows || []),
      error: () => this.municipiosExp.set([]),
    });
  }

  private cargarMunicipiosOrigen() {
    if (!this.deptoOrigen) {
      this.municipiosOrigen.set([]);
      return;
    }
    this.catalogs.municipios(this.deptoOrigen).subscribe({
      next: (rows) => this.municipiosOrigen.set(rows || []),
      error: () => this.municipiosOrigen.set([]),
    });
  }

  private aplicarMunicipioOrigenDesdeCodigo(cod: string) {
    const c = String(cod || '').trim();
    if (!c) return;
    this.catalogs.municipioPorCodigo(c).subscribe({
      next: (m) => {
        this.deptoOrigen = m.codDepto;
        this.catalogs.municipios(m.codDepto).subscribe({
          next: (rows) => {
            this.municipiosOrigen.set(rows || []);
            this.codMunicipioOrigen = m.codMunicipio;
            this.form.codMunicipio = m.codMunicipio;
            this.form.munOrigen = m.codMunicipio;
          },
        });
      },
    });
  }

  private aplicarExpedidaDesdeTexto(texto: string) {
    const t = String(texto || '').trim();
    if (!t) return;
    this.catalogs.buscarMunicipios(t, 10).subscribe({
      next: (rows) => {
        const exact =
          rows.find((r) => r.nombreMunicipio.toLowerCase() === t.toLowerCase()) || rows[0];
        if (!exact) return;
        this.deptoExp = exact.codDepto;
        this.catalogs.municipios(exact.codDepto).subscribe({
          next: (list) => {
            this.municipiosExp.set(list || []);
            this.codMunicipioExp = exact.codMunicipio;
            this.form.expedida = exact.nombreMunicipio;
          },
        });
      },
    });
  }

  buscarEmpresaReg(q: string) {
    this.empresaBusqReg.set(q);
    if (!q.trim() || q.trim().length < 2) {
      this.empresaSugsReg.set([]);
      this.empresaDropReg.set(false);
      return;
    }
    this.empresaCargReg.set(true);
    this.api.buscarEmpresasPublico(q.trim()).subscribe({
      next: (rows) => {
        this.empresaSugsReg.set(rows);
        this.empresaDropReg.set(rows.length > 0);
        this.empresaCargReg.set(false);
      },
      error: () => this.empresaCargReg.set(false),
    });
  }

  onEmpresaBlurReg() {
    setTimeout(() => this.empresaDropReg.set(false), 200);
  }

  seleccionarEmpresaReg(e: { _id: string; nombre: string; identificacion: string }) {
    this.form.empresaId = e._id;
    this.form.empresaNombre = e.nombre;
    this.empresaBusqReg.set(e.nombre);
    this.empresaDropReg.set(false);
    this.empresaSugsReg.set([]);
  }

  quitarEmpresaReg() {
    this.form.empresaId = null;
    this.form.empresaNombre = null;
    this.empresaBusqReg.set('');
    this.empresaSugsReg.set([]);
    this.empresaDropReg.set(false);
  }

  setOrigenJornadaCap(key: 'colegio' | 'estamento' | 'empresa' | 'operativo') {
    this.form.origenJornadaCap = key;
    if (key !== 'colegio') {
      this.form.tipoInstitucionEducativa = '';
      this.form.perfilInstitucionEducativa = 'estudiante';
      this.form.colegioCodigo = '';
      this.form.colegioNombre = '';
      this.form.gradoColegio = null;
      this.form.semestreInstitucion = null;
      this.form.titulacionCodigo = '';
      this.form.programaInstitucion = '';
      this.form.areaImparteColegio = '';
    } else {
      if (!this.form.tipoInstitucionEducativa) this.form.tipoInstitucionEducativa = 'secundaria';
      if (!this.form.perfilInstitucionEducativa) this.form.perfilInstitucionEducativa = 'estudiante';
    }
    if (key !== 'estamento') {
      this.form.estamentoId = '';
      this.form.estamentoNombre = '';
      this.form.cargoEstamento = '';
      this.form.dependenciaEstamento = '';
    }
    if (key !== 'empresa') {
      // empresaId opcional (transporte) se conserva
    } else {
      this.form.empresaId = null;
      this.form.empresaNombre = null;
      this.empresaBusqReg.set('');
    }
  }

  setPerfilInstitucion(perfil: 'estudiante' | 'profesor') {
    this.form.perfilInstitucionEducativa = perfil;
    if (perfil === 'profesor') {
      this.form.gradoColegio = null;
      this.form.semestreInstitucion = null;
      this.form.titulacionCodigo = '';
      this.form.programaInstitucion = '';
    } else {
      this.form.areaImparteColegio = '';
    }
  }

  onTipoInstitucionPick(opt: EnumBuscarOption) {
    this.form.tipoInstitucionEducativa = String(opt.value);
    this.form.colegioCodigo = '';
    this.form.colegioNombre = '';
    this.form.gradoColegio = null;
    this.form.semestreInstitucion = null;
    this.form.titulacionCodigo = '';
    this.form.programaInstitucion = '';
  }

  onTipoInstitucionLimpiar() {
    this.form.tipoInstitucionEducativa = '';
  }

  onColegioPick(opt: EnumBuscarOption) {
    this.form.colegioCodigo = String(opt.value || '').trim();
    this.form.colegioNombre = String(opt.label || '').trim();
  }

  onColegioLimpiar() {
    this.form.colegioCodigo = '';
    this.form.colegioNombre = '';
  }

  onGradoColegioPick(opt: EnumBuscarOption) {
    this.form.gradoColegio = parseInt(String(opt.value), 10);
  }

  onGradoColegioLimpiar() {
    this.form.gradoColegio = null;
  }

  onSemestreInstitucionPick(opt: EnumBuscarOption) {
    this.form.semestreInstitucion = parseInt(String(opt.value), 10);
  }

  onSemestreInstitucionLimpiar() {
    this.form.semestreInstitucion = null;
  }

  onAreaImpartePick(opt: EnumBuscarOption) {
    this.form.areaImparteColegio = String(opt.value);
  }

  onAreaImparteLimpiar() {
    this.form.areaImparteColegio = '';
  }

  onTitulacionPick(opt: EnumBuscarOption) {
    this.form.titulacionCodigo = String(opt.value || '').trim();
    this.form.programaInstitucion = String(opt.label || '').trim();
  }

  onTitulacionLimpiar() {
    this.form.titulacionCodigo = '';
    this.form.programaInstitucion = '';
  }

  onEstamentoPick(opt: EnumBuscarOption) {
    this.form.estamentoId = String(opt.value || '').trim();
    this.form.estamentoNombre = String(opt.label || '').trim();
  }

  onEstamentoLimpiar() {
    this.form.estamentoId = '';
    this.form.estamentoNombre = '';
  }

  onEmpresaOrigenPick(opt: EnumBuscarOption) {
    this.form.empresaId = String(opt.value);
    this.form.empresaNombre = String(opt.label);
  }

  onEmpresaOrigenLimpiar() {
    this.form.empresaId = null;
    this.form.empresaNombre = null;
  }

  private aplicarOrigenDesdeAlumno(a: Record<string, string | number | boolean>) {
    if (a['tipoInstitucionEducativa']) {
      this.form.tipoInstitucionEducativa = String(a['tipoInstitucionEducativa']);
    }
    if (a['perfilInstitucionEducativa']) {
      this.form.perfilInstitucionEducativa = String(a['perfilInstitucionEducativa']);
    }
    if (a['colegioCodigo']) this.form.colegioCodigo = String(a['colegioCodigo']);
    if (a['colegioNombre']) this.form.colegioNombre = String(a['colegioNombre']);
    if (a['gradoColegio'] !== '' && a['gradoColegio'] != null) {
      this.form.gradoColegio = Number(a['gradoColegio']);
    }
    if (a['semestreInstitucion'] !== '' && a['semestreInstitucion'] != null) {
      this.form.semestreInstitucion = Number(a['semestreInstitucion']);
    }
    if (a['titulacionCodigo']) this.form.titulacionCodigo = String(a['titulacionCodigo']);
    if (a['programaInstitucion']) this.form.programaInstitucion = String(a['programaInstitucion']);
    if (a['areaImparteColegio']) this.form.areaImparteColegio = String(a['areaImparteColegio']);
    if (a['estamentoId']) this.form.estamentoId = String(a['estamentoId']);
    if (a['estamentoNombre']) this.form.estamentoNombre = String(a['estamentoNombre']);
    if (a['cargoEstamento']) this.form.cargoEstamento = String(a['cargoEstamento']);
    if (a['dependenciaEstamento']) this.form.dependenciaEstamento = String(a['dependenciaEstamento']);
    if (a['empresaId']) {
      this.form.empresaId = String(a['empresaId']);
      if (this.form.origenJornadaCap === 'empresa') {
        this.form.empresaNombre = this.form.empresaNombre || null;
      }
    }
  }

  private captchaToken(): string {
    return this.turnstileToken() || this.turnstile()?.getToken() || '';
  }

  buscarDocumento() {
    const nd = String(this.form.numDoc || '').trim();
    if (!nd) return;
    const token = this.captchaToken();
    if (this.turnstileSiteKey() && !token) {
      this.error.set('Complete la verificación anti-bot antes de consultar el documento.');
      return;
    }
    this.buscando.set(true);
    this.error.set('');
    this.info.set('');
    this.api.buscarAlumno(nd, token || undefined).subscribe({
      next: (res) => {
        this.buscando.set(false);
        this.turnstile()?.reset();
        this.alumnoEnArgo.set(res.existeEnArgo);
        if (res.existeEnArgo && res.alumno) {
          const a = res.alumno;
          this.form.tipoDoc = String(a['tipoDoc'] || this.form.tipoDoc);
          this.form.expedida = String(a['expedida'] || '');
          this.form.apellido1 = String(a['apellido1'] || '');
          this.form.apellido2 = String(a['apellido2'] || '');
          this.form.nombre1 = String(a['nombre1'] || '');
          this.form.nombre2 = String(a['nombre2'] || '');
          this.form.genero = String(a['genero'] || '').toUpperCase();
          if (a['identidadGenero']) this.form.identidadGenero = String(a['identidadGenero']);
          if (a['orientacionSexual']) this.form.orientacionSexual = String(a['orientacionSexual']);
          if (a['discapacidad']) this.form.discapacidad = String(a['discapacidad']);
          if (a['multiCulturalidad']) this.form.multiCulturalidad = String(a['multiCulturalidad']);
          if (a['origenJornadaCap']) {
            this.form.origenJornadaCap = String(a['origenJornadaCap']) as OrigenJornadaKey;
          }
          this.aplicarOrigenDesdeAlumno(a);
          this.form.actorVial = String(a['actorVial'] || '').trim();
          this.form.fechaNac = String(a['fechaNac'] || '');
          this.form.codMunicipio = String(a['codMunicipio'] || a['munOrigen'] || '');
          this.form.munOrigen = String(a['munOrigen'] || a['codMunicipio'] || '');
          this.aplicarMunicipioOrigenDesdeCodigo(this.form.codMunicipio);
          this.aplicarExpedidaDesdeTexto(this.form.expedida);
          this.info.set(
            'Ya está en ARGO. Complete el correo para confirmar su inscripción a jornadas (no se crea cuenta del aula virtual).',
          );
        } else {
          this.info.set('Documento nuevo: complete sus datos. Quedará como alumno de Jornadas de Capacitación.');
        }
      },
      error: (e) => {
        this.buscando.set(false);
        this.turnstile()?.reset();
        this.error.set(e?.error?.message || 'No se pudo consultar el documento');
      },
    });
  }

  volverAlFormulario() {
    this.paso.set('formulario');
    this.codigoVerificacion.set('');
    this.error.set('');
  }

  reenviarCodigo() {
    const id = this.pendingId();
    if (!id) return;
    this.reenviando.set(true);
    this.error.set('');
    this.api.registroJornadaReenviarCodigo(id).subscribe({
      next: (res) => {
        this.reenviando.set(false);
        this.info.set(res.message);
      },
      error: (e) => {
        this.reenviando.set(false);
        this.error.set(e?.error?.message || 'No se pudo reenviar el código');
      },
    });
  }

  private mostrarExito(mensaje: string, nombre?: string) {
    this.mensajeExito.set(
      mensaje ||
        'Te has registrado en Jornadas de Capacitación. Revise su correo: le enviamos su código QR.',
    );
    this.nombreExito.set(nombre || '');
    this.paso.set('exito');
  }

  enviar() {
    if (!this.registroAbierto()) {
      this.error.set('El registro en línea está temporalmente cerrado.');
      return;
    }
    if (!String(this.form.email || '').trim()) {
      this.error.set('El correo es obligatorio.');
      return;
    }
    const token = this.captchaToken();
    if (this.turnstileSiteKey() && !token) {
      this.error.set('Complete la verificación anti-bot.');
      return;
    }
    if (!this.aceptaAutorizacion()) {
      this.error.set('Debe aceptar la autorización de tratamiento de datos personales.');
      return;
    }
    if (!this.alumnoEnArgo() && !String(this.form.actorVial || '').trim()) {
      this.error.set('Seleccione el actor vial.');
      return;
    }
    const errOrigen = validarOrigenJornadaForm(this.form);
    if (errOrigen) {
      this.error.set(errOrigen);
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.info.set('');

    this.api
      .registroJornadaSolicitar(
        { ...this.form, ...payloadAutorizacionDatos(true) },
        token || undefined,
      ).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.turnstile()?.reset();
        if (res.step === 'done') {
          this.mostrarExito(res.mensaje || res.message || '', res.alumno?.nombreCompleto);
          return;
        }
        this.pendingId.set(res.pendingId || '');
        this.emailEnmascarado.set(res.email || '');
        this.paso.set('codigo');
        this.info.set(res.message || '');
      },
      error: (e) => {
        this.loading.set(false);
        this.turnstile()?.reset();
        this.error.set(e?.error?.message || 'No se pudo iniciar la inscripción');
      },
    });
  }

  confirmarCodigo() {
    const codigo = String(this.codigoVerificacion() || '').trim();
    if (!/^\d{6}$/.test(codigo)) {
      this.error.set('Ingrese el código de 6 dígitos que recibió por correo.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api.registroJornadaConfirmar(this.pendingId(), codigo).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.mostrarExito(res.mensaje || res.message || '', res.alumno?.nombreCompleto);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message || 'No se pudo confirmar la inscripción');
      },
    });
  }
}
