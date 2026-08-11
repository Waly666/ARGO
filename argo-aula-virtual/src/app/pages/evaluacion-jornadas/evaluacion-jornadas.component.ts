import { CommonModule } from '@angular/common';

import { Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { RouterLink } from '@angular/router';



import { TurnstileComponent } from '../../components/turnstile/turnstile.component';

import { AulaApiService } from '../../core/aula-api.service';

import {

  EncuestaJornadaAspecto,

  EncuestaJornadaDetalleRes,

  EncuestaJornadaMotivoSinPendientes,

  EncuestaJornadaPendiente,

} from '../../core/models';

import { PortalSeoService } from '../../core/portal-seo.service';



type Paso = 'documento' | 'lista' | 'formulario' | 'exito';

type NotasCarpa = Record<string, Record<string, number>>;



@Component({

  selector: 'av-evaluacion-jornadas',

  standalone: true,

  imports: [CommonModule, FormsModule, RouterLink, TurnstileComponent],

  templateUrl: './evaluacion-jornadas.component.html',

  styleUrl: './evaluacion-jornadas.component.scss',

})

export class EvaluacionJornadasComponent implements OnInit {

  private api = inject(AulaApiService);

  private seo = inject(PortalSeoService);



  turnstile = viewChild(TurnstileComponent);



  numDoc = '';

  turnstileSiteKey = signal('');

  turnstileToken = signal('');

  loading = signal(false);

  enviando = signal(false);

  error = signal('');



  paso = signal<Paso>('documento');

  nombreCompleto = signal('');

  pendientes = signal<EncuestaJornadaPendiente[]>([]);

  encuesta = signal<EncuestaJornadaDetalleRes | null>(null);

  notas = signal<NotasCarpa>({});
  /** Vista previa al pasar el mouse sobre las estrellas. */
  hoverNotas = signal<Record<string, number>>({});
  comentario = signal('');



  readonly escala = [1, 2, 3, 4, 5];

  /** Porcentaje de aspectos calificados (para barra de progreso). */
  progresoEncuesta = computed(() => {
    this.notas();
    const det = this.encuesta();
    if (!det) return { pct: 0, done: 0, total: 0 };
    const aspectos = det.aspectos || [];
    const carpas = det.carpas || [];
    const total = aspectos.length * carpas.length;
    if (!total) return { pct: 0, done: 0, total: 0 };
    let done = 0;
    for (const c of carpas) {
      for (const a of aspectos) {
        if (this.notaAspecto(this.claveCarpa(c), a.key) >= 1) done++;
      }
    }
    return { pct: Math.round((done / total) * 100), done, total };
  });

  ngOnInit() {

    this.api.config().subscribe({

      next: (c) => {

        this.turnstileSiteKey.set(c.turnstileSiteKey || '');

        this.seo.applyConsultaCertificados(c);

      },

      error: () => this.seo.applyConsultaCertificados(null),

    });

  }



  captchaToken(): string {

    return this.turnstileToken() || this.turnstile()?.getToken() || '';

  }



  buscar() {

    const doc = this.numDoc.trim();

    if (!doc) {

      this.error.set('Ingrese su número de documento.');

      return;

    }

    const token = this.captchaToken();

    if (this.turnstileSiteKey() && !token) {

      this.error.set('Complete la verificación anti-bot.');

      return;

    }



    this.loading.set(true);

    this.error.set('');

    this.pendientes.set([]);

    this.encuesta.set(null);



    this.api.encuestasJornadaPendientes(doc, token || undefined).subscribe({

      next: (res) => {

        this.loading.set(false);

        this.nombreCompleto.set(res.nombreCompleto || '');

        this.pendientes.set(res.items || []);

        if (!res.items?.length) {

          this.paso.set('documento');

          this.error.set(this.mensajeSinPendientes(res.motivo));

          return;

        }

        if (res.items.length === 1) {

          void this.abrirEncuesta(res.items[0]);

          return;

        }

        this.paso.set('lista');

      },

      error: (e) => {

        this.loading.set(false);

        this.turnstile()?.reset();

        const msg = e?.error?.message || 'No se pudo verificar el documento.';

        if (e?.status === 404) {

          this.error.set(`${msg} Puede registrarse en jornadas de capacitación.`);

        } else if (e?.status === 403) {

          this.error.set(msg);

        } else {

          this.error.set(msg);

        }

      },

    });

  }



  abrirEncuesta(item: EncuestaJornadaPendiente) {

    const doc = this.numDoc.trim();

    const token = this.captchaToken();

    this.loading.set(true);

    this.error.set('');



    this.api.encuestaJornadaDetalle(item._id, doc, token || undefined).subscribe({

      next: (det) => {

        this.loading.set(false);

        this.encuesta.set(det);

        const map: NotasCarpa = {};

        for (const c of det.carpas || []) {

          const id = c.clave || String(c.idCarpa);

          map[id] = {};

          for (const a of det.aspectos || []) map[id][a.key] = 0;

        }

        this.notas.set(map);
        this.hoverNotas.set({});
        this.comentario.set('');

        this.paso.set('formulario');

      },

      error: (e) => {

        this.loading.set(false);

        this.turnstile()?.reset();

        this.error.set(e?.error?.message || 'No se pudo cargar la encuesta.');

      },

    });

  }



  aspectosEncuesta(): EncuestaJornadaAspecto[] {

    return this.encuesta()?.aspectos || [];

  }

  claveCarpa(c: { clave?: string; idCarpa: number | string }): string {
    return c.clave || String(c.idCarpa);
  }



  notaAspecto(idCarpa: number | string, aspectoKey: string): number {
    return this.notas()[String(idCarpa)]?.[aspectoKey] || 0;
  }

  private claveEstrellas(idCarpa: number | string, aspectoKey: string): string {
    return `${idCarpa}|${aspectoKey}`;
  }

  estrellasActivas(idCarpa: number | string, aspectoKey: string): number {
    const hover = this.hoverNotas()[this.claveEstrellas(idCarpa, aspectoKey)];
    if (hover) return hover;
    return this.notaAspecto(idCarpa, aspectoKey);
  }

  estrellaMarcada(idCarpa: number | string, aspectoKey: string, valor: number): boolean {
    return this.estrellasActivas(idCarpa, aspectoKey) >= valor;
  }

  setNota(idCarpa: number | string, aspectoKey: string, nota: number) {
    const id = String(idCarpa);
    this.notas.update((m) => ({
      ...m,
      [id]: { ...(m[id] || {}), [aspectoKey]: nota },
    }));
    this.limpiarHoverEstrellas(idCarpa, aspectoKey);
  }

  hoverEstrella(idCarpa: number | string, aspectoKey: string, nota: number) {
    const key = this.claveEstrellas(idCarpa, aspectoKey);
    this.hoverNotas.update((m) => ({ ...m, [key]: nota }));
  }

  limpiarHoverEstrellas(idCarpa: number | string, aspectoKey: string) {
    const key = this.claveEstrellas(idCarpa, aspectoKey);
    this.hoverNotas.update((m) => {
      if (!(key in m)) return m;
      const copy = { ...m };
      delete copy[key];
      return copy;
    });
  }

  promedioPrograma(idCarpa: number | string): number | null {
    const aspectos = this.aspectosEncuesta();
    if (!aspectos.length) return null;
    const notas = aspectos.map((a) => this.notaAspecto(idCarpa, a.key));
    if (notas.some((n) => n < 1)) return null;
    const sum = notas.reduce((a, b) => a + b, 0);
    return Math.round((sum / notas.length) * 10) / 10;
  }

  promedioProgramaParcial(idCarpa: number | string): number | null {
    const aspectos = this.aspectosEncuesta();
    const notas = aspectos.map((a) => this.notaAspecto(idCarpa, a.key)).filter((n) => n >= 1);
    if (!notas.length) return null;
    return Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10;
  }

  etiquetaPromedio(prom: number): string {
    if (prom >= 4.5) return 'Excelente';
    if (prom >= 3.5) return 'Buena';
    if (prom >= 2.5) return 'Regular';
    return 'Necesita mejorar';
  }

  clasePromedio(prom: number): string {
    if (prom >= 4.5) return 'eval-promedio--excelente';
    if (prom >= 3.5) return 'eval-promedio--buena';
    if (prom >= 2.5) return 'eval-promedio--regular';
    return 'eval-promedio--baja';
  }

  enviar() {

    const det = this.encuesta();

    if (!det) return;

    const doc = this.numDoc.trim();

    const aspectos = det.aspectos || [];

    const calificacionesCarpa = (det.carpas || []).map((c) => ({

      idCarpa: c.idCarpa,
      clave: this.claveCarpa(c),

      aspectos: Object.fromEntries(

        aspectos.map((a) => [a.key, this.notaAspecto(this.claveCarpa(c), a.key)]),

      ),

    }));



    if (

      calificacionesCarpa.some((c) =>

        aspectos.some((a) => {

          const n = Number((c.aspectos as Record<string, number>)[a.key]);

          return n < 1 || n > 5;

        }),

      )

    ) {

      this.error.set('Califique todos los aspectos con estrellas (1 a 5).');

      return;

    }



    const token = this.captchaToken();

    if (this.turnstileSiteKey() && !token) {

      this.error.set('Complete la verificación anti-bot.');

      return;

    }



    this.enviando.set(true);

    this.error.set('');

    this.api

      .responderEncuestaJornada(

        det._id,

        { numDoc: doc, calificacionesCarpa, comentario: this.comentario().trim() },

        token || undefined,

      )

      .subscribe({

        next: () => {

          this.enviando.set(false);

          this.paso.set('exito');

        },

        error: (e) => {

          this.enviando.set(false);

          this.turnstile()?.reset();

          this.error.set(e?.error?.message || 'No se pudo enviar la evaluación.');

        },

      });

  }



  volverDocumento() {

    this.paso.set('documento');

    this.encuesta.set(null);
    this.pendientes.set([]);
    this.hoverNotas.set({});
    this.error.set('');

  }



  private mensajeSinPendientes(motivo?: EncuestaJornadaMotivoSinPendientes): string {

    switch (motivo) {

      case 'sin_encuestas':

        return 'No hay evaluaciones disponibles. La institución aún no ha creado una encuesta para su contrato.';

      case 'encuestas_no_publicadas':

        return 'Hay encuestas en preparación, pero aún no han sido publicadas. Intente más tarde o contacte a la institución.';

      case 'encuestas_fuera_vigencia':

        return 'Las evaluaciones existen pero no están abiertas en este momento (revise las fechas de apertura o cierre).';

      case 'sin_encuesta_su_contrato':

        return 'Usted cumple los requisitos, pero aún no hay una evaluación publicada para el contrato en el que participó.';

      case 'ya_respondio':

        return 'Ya registró su respuesta para las evaluaciones disponibles. Gracias por su participación.';

      case 'asistencia_sin_carpa':

        return 'Tiene asistencias registradas, pero las clases no tienen programa o carpa configurados. Contacte a la institución para completar la programación.';

      case 'no_elegible':

      default:

        return 'No tiene evaluaciones pendientes. Debe haber asistido al menos a una carpa del contrato.';

    }

  }

}


