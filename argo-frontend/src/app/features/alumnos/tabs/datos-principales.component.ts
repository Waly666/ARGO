import { CommonModule } from '@angular/common';

import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';



import { AlumnoDto, AlumnoService } from '../../../core/services/alumno.service';

import { AlumnoStore } from '../../../core/services/alumno-store.service';

import { CatalogoService } from '../../../core/services/catalogo.service';

import { environment } from '../../../../environments/environment';

import { MunicipioBuscarComponent } from '../municipio-buscar.component';

import {

  DISCAPACIDADES_DEF,

  ESTADOS_CIVIL_DEF,

  ESTRATOS_DEF,

  GENEROS_DEF,

  JORNADAS_DEF,

  MULTICULTURALIDAD_DEF,

  NIVEL_FORMACION_DEF,

  OCUPACIONES_DEF,

  REGIMEN_SALUD_DEF,

  TIPOS_DOC_DEF,

  TIPO_SANGRE_DEF,

  catEtiqueta,
  catalogoConEtiquetas,
  catValor,

  fechaHoraDisplay,

  fechaInput,

  normalizarEnum,

} from '../catalogo.helpers';



@Component({

  selector: 'argo-datos-principales',

  standalone: true,

  imports: [CommonModule, FormsModule, MunicipioBuscarComponent],

  templateUrl: './datos-principales.component.html',

  styleUrls: ['./datos-principales.component.scss'],

})

export class DatosPrincipalesComponent implements OnInit {

  private alumnoSvc = inject(AlumnoService);

  private catSvc = inject(CatalogoService);

  private router = inject(Router);

  store = inject(AlumnoStore);



  uploads = environment.uploadsUrl;



  form = signal<AlumnoDto>(this.emptyForm());

  fotoFile = signal<File | null>(null);

  fotoPreview = signal<string | null>(null);



  tiposDoc = signal<Record<string, unknown>[]>(TIPOS_DOC_DEF);

  generos = signal<Record<string, unknown>[]>(GENEROS_DEF);

  tiposSangre = signal<Record<string, unknown>[]>(TIPO_SANGRE_DEF);

  jornadas = signal<Record<string, unknown>[]>(JORNADAS_DEF);

  estadosCiviles = signal<Record<string, unknown>[]>(ESTADOS_CIVIL_DEF);

  estratos = signal<Record<string, unknown>[]>(ESTRATOS_DEF);

  regimenesSalud = signal<Record<string, unknown>[]>(REGIMEN_SALUD_DEF);

  nivelesFormacion = signal<Record<string, unknown>[]>(NIVEL_FORMACION_DEF);

  ocupaciones = signal<Record<string, unknown>[]>(OCUPACIONES_DEF);

  discapacidades = signal<Record<string, unknown>[]>(DISCAPACIDADES_DEF);

  multiCulturalidades = signal<Record<string, unknown>[]>(MULTICULTURALIDAD_DEF);



  expedidaTexto = signal('');

  munOrigenTexto = signal('');



  saving = signal(false);

  message = signal<string | null>(null);

  docDuplicado = signal<{ _id: string; nombreCompleto?: string } | null>(null);



  isEdit = computed(() => !!this.form()._id);



  catValor = catValor;

  catEtiqueta = catEtiqueta;

  fechaHoraDisplay = fechaHoraDisplay;



  constructor() {

    effect(() => {

      const a = this.store.alumno();

      if (a) {

        const mapped = this.mapDesdeBd(a as AlumnoDto & Record<string, unknown>);

        this.form.set(mapped);

        this.expedidaTexto.set(mapped.expedida || '');

        this.resolverTextoMunOrigen(mapped.codMunicipio || mapped.munOrigen);

        this.fotoPreview.set(a.urlFoto ? this.toUrl(a.urlFoto) : null);

        this.fotoFile.set(null);

        this.docDuplicado.set(null);

      } else {

        this.form.set(this.emptyForm());

        this.expedidaTexto.set('');

        this.munOrigenTexto.set('');

        this.fotoPreview.set(null);

      }

    });

  }



  ngOnInit(): void {

    this.cargarCatalogo('catRegimenSalud', this.regimenesSalud, REGIMEN_SALUD_DEF);

  }



  private resolverTextoMunOrigen(cod?: string) {

    if (!cod) {

      this.munOrigenTexto.set('');

      return;

    }

    this.catSvc.municipioPorCodigo(cod).subscribe({

      next: (m) => this.munOrigenTexto.set(m.label),

      error: () => this.munOrigenTexto.set(cod),

    });

  }



  onExpedidaSel(m: { nombreMunicipio: string; label: string }) {

    this.expedidaTexto.set(m.label);

    this.patch('expedida', m.nombreMunicipio);

  }



  onMunOrigenSel(m: { codMunicipio: string; label: string }) {
    this.munOrigenTexto.set(m.label);
    const cod = m.codMunicipio;
    this.form.update((f) => ({ ...f, munOrigen: cod, codMunicipio: cod }));
  }



  private cargarCatalogo(

    nombre: string,

    target: ReturnType<typeof signal<Record<string, unknown>[]>>,

    fallback: Record<string, unknown>[],

  ) {

    this.catSvc.list(nombre, { refresh: true }).subscribe((d) => {
      target.set(catalogoConEtiquetas(d || [], fallback));
    });

  }



  patch<K extends keyof AlumnoDto>(k: K, v: AlumnoDto[K]) {

    this.form.update((f) => ({ ...f, [k]: v }));

    if (k === 'numDoc') this.verificarDoc();

  }



  verificarDoc() {

    const nd = this.form().numDoc?.trim();

    if (!nd || nd.length < 4) {

      this.docDuplicado.set(null);

      return;

    }

    this.alumnoSvc.verificarDocumento(nd, this.form()._id).subscribe({

      next: (r) => {

        if (r.existe && r._id && r._id !== this.form()._id) {

          this.docDuplicado.set({ _id: r._id, nombreCompleto: r.nombreCompleto });

        } else this.docDuplicado.set(null);

      },

    });

  }



  irAlDuplicado() {

    const d = this.docDuplicado();

    if (d?._id) this.router.navigate(['/app/alumnos', d._id]);

  }



  onFoto(ev: Event) {

    const file = (ev.target as HTMLInputElement).files?.[0];

    if (!file) return;

    this.fotoFile.set(file);

    const r = new FileReader();

    r.onload = () => this.fotoPreview.set(r.result as string);

    r.readAsDataURL(file);

  }



  guardar() {

    const f = { ...this.form() };

    if (!f.expedida?.trim() && this.expedidaTexto().trim()) {

      f.expedida = this.expedidaTexto().trim();

    }

    if (!f.numDoc || !f.nombre1 || !f.apellido1) {

      this.message.set('numDoc, nombre1 y apellido1 son obligatorios.');

      return;

    }

    if (this.docDuplicado() && !this.isEdit()) {

      this.message.set('Ya existe un alumno con ese numDoc. Use el enlace para abrirlo.');

      return;

    }

    this.saving.set(true);

    this.message.set(null);

    const files = { foto: this.fotoFile() || undefined };

    const payload = this.toPayload(f);

    const obs = this.isEdit()

      ? this.alumnoSvc.actualizar(f._id!, payload, files)

      : this.alumnoSvc.crear(payload, files);

    obs.subscribe({

      next: (saved) => {

        this.saving.set(false);

        this.message.set('Datos guardados correctamente.');

        this.store.setAlumno(saved);

        if (!this.isEdit() && saved._id) {

          this.router.navigate(['/app/alumnos', saved._id], { replaceUrl: true });

        }

      },

      error: (err) => {

        this.saving.set(false);

        const body = err?.error;

        if (err?.status === 409 && body?.existingId) {

          this.docDuplicado.set({

            _id: body.existingId,

            nombreCompleto: body.nombreCompleto,

          });

          this.message.set(body.message || 'numDoc ya registrado.');

          return;

        }

        this.message.set(body?.message || 'Error al guardar.');

      },

    });

  }



  /** Solo campos del esquema datosAlumnos (sin auditoría de solo lectura) */

  private toPayload(f: AlumnoDto): AlumnoDto {

    return {

      tipoDoc: f.tipoDoc,

      numDoc: f.numDoc,

      expedida: f.expedida,

      apellido1: f.apellido1,

      apellido2: f.apellido2,

      nombre1: f.nombre1,

      nombre2: f.nombre2,

      fechaNac: f.fechaNac,

      observaciones: f.observaciones,

      genero: f.genero,

      tipoSangre: f.tipoSangre,

      jornada: f.jornada,

      estadoCivil: f.estadoCivil,

      estrato: f.estrato,

      regimenSalud: f.regimenSalud,

      nivelFormacion: f.nivelFormacion,

      ocupacion: f.ocupacion,

      discapacidad: f.discapacidad,
      munOrigen: f.munOrigen || f.codMunicipio,
      codMunicipio: f.codMunicipio || f.munOrigen,
      correo: f.correo,
      direccion: f.direccion,
      celular: f.celular,
      multiCulturalidad: f.multiCulturalidad,

      urlFoto: f.urlFoto,

    };

  }



  toUrl(name: string) {

    if (!name) return '';

    if (name.startsWith('http')) return name;

    return `${this.uploads}/${name}`;

  }



  private mapDesdeBd(raw: AlumnoDto & Record<string, unknown>): AlumnoDto {

    return {

      _id: raw._id,

      fechaReg: raw.fechaReg as string,

      tipoDoc: normalizarEnum(String(raw.tipoDoc || '1')),

      numDoc: String(raw.numDoc || ''),

      expedida: String(raw.expedida || ''),

      apellido1: String(raw.apellido1 || ''),

      apellido2: String(raw.apellido2 || ''),

      nombre1: String(raw.nombre1 || ''),

      nombre2: String(raw.nombre2 || ''),

      fechaNac: fechaInput(raw.fechaNac as string),

      observaciones: String(raw.observaciones || ''),

      genero: String(raw.genero || '').toUpperCase(),

      tipoSangre: String(raw.tipoSangre || ''),

      jornada: normalizarEnum(String(raw.jornada || '')),

      estadoCivil: normalizarEnum(String(raw.estadoCivil || '')),

      estrato: normalizarEnum(String(raw.estrato || '')),

      regimenSalud: normalizarEnum(String(raw.regimenSalud || '')),

      nivelFormacion: normalizarEnum(String(raw.nivelFormacion || '')),

      ocupacion: normalizarEnum(String(raw.ocupacion || '')),

      discapacidad: normalizarEnum(String(raw.discapacidad || '9')),
      munOrigen: String(raw.munOrigen || raw.codMunicipio || ''),
      codMunicipio: String(raw.codMunicipio || raw.munOrigen || ''),
      correo: String(raw.correo || ''),
      direccion: String(raw.direccion || ''),
      celular: String(raw.celular || ''),
      multiCulturalidad: String(raw.multiCulturalidad || 'NO_APLICA'),

      urlFoto: String(raw.urlFoto || (raw['foto'] as string) || ''),

      fechaAudi: raw.fechaAudi as string,

      userAddReg: String(raw.userAddReg || ''),

      userChangeRecord: String(raw.userChangeRecord || ''),

      fechaMod: raw.fechaMod as string,

    };

  }



  private emptyForm(): AlumnoDto {

    return {

      tipoDoc: '1',

      numDoc: '',

      expedida: '',

      apellido1: '',

      apellido2: '',

      nombre1: '',

      nombre2: '',

      fechaNac: '',

      observaciones: '',

      genero: '',

      tipoSangre: '',

      jornada: '',

      estadoCivil: '',

      estrato: '',

      regimenSalud: '',

      nivelFormacion: '',

      ocupacion: '',

      discapacidad: '9',
      munOrigen: '',
      codMunicipio: '',
      correo: '',
      direccion: '',
      celular: '',
      multiCulturalidad: 'NO_APLICA',

      urlFoto: '',

    };

  }

}


