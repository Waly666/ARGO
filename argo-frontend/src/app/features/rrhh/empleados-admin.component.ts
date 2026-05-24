import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Empleado, EmpleadoDto, EmpleadoService } from '../../core/services/empleado.service';
import { RrhhCatalogService } from '../../core/services/rrhh-catalog.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { inicialesNombre, readVistaLista, saveVistaLista, VistaLista } from '../../core/utils/vista-lista.helpers';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'argo-empleados-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './empleados-admin.component.html',
  styleUrls: ['./empleados-admin.component.scss', './rrhh-catalog-admin.component.scss', './rrhh-shared.scss'],
})
export class EmpleadosAdminComponent implements OnInit {
  private svc = inject(EmpleadoService);
  private cat = inject(RrhhCatalogService);
  private confirm = inject(ConfirmDialogService);

  uploads = environment.uploadsUrl;
  fotoFile = signal<File | null>(null);
  fotoPreview = signal<string | null>(null);

  empleados = signal<Empleado[]>([]);
  cargos = signal<any[]>([]);
  departamentos = signal<any[]>([]);
  eps = signal<any[]>([]);
  afp = signal<any[]>([]);
  arl = signal<any[]>([]);
  cajas = signal<any[]>([]);

  loading = signal(false);
  saving = signal(false);
  msg = signal<string | null>(null);
  busqueda = signal('');
  vista = signal<VistaLista>(readVistaLista('argo-empleados-vista'));
  editando = signal<Empleado | null>(null);
  mostrarForm = signal(false);

  readonly tiposDocumento = ['CC', 'CE', 'TI', 'PAS'];
  readonly sexos = ['Masculino', 'Femenino', 'Otro'];
  readonly estados = ['activo', 'retirado', 'suspendido'];
  readonly tiposContrato = ['indefinido', 'fijo', 'obra labor', 'aprendizaje'];

  form = signal<EmpleadoDto>(this.formVacio());

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargar();
  }

  formVacio(): EmpleadoDto {
    return {
      tipoDocumento: 'CC',
      numeroDocumento: '',
      primerNombre: '',
      segundoNombre: '',
      primerApellido: '',
      segundoApellido: '',
      estado: 'activo',
    };
  }

  cargarCatalogos() {
    this.cat.listar('cargos').subscribe({ next: (r) => this.cargos.set(r || []) });
    this.cat.listar('departamentos').subscribe({ next: (r) => this.departamentos.set(r || []) });
    this.cat.listar('eps').subscribe({ next: (r) => this.eps.set(r || []) });
    this.cat.listar('afp').subscribe({ next: (r) => this.afp.set(r || []) });
    this.cat.listar('arl').subscribe({ next: (r) => this.arl.set(r || []) });
    this.cat.listar('cajas-compensacion').subscribe({ next: (r) => this.cajas.set(r || []) });
  }

  cargar() {
    this.loading.set(true);
    const q = this.busqueda().trim();
    this.svc.listar(q.length >= 2 ? { q } : {}).subscribe({
      next: (r) => {
        this.empleados.set(r || []);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.msg.set(e?.error?.message || 'Error cargando empleados');
      },
    });
  }

  setVista(v: VistaLista) {
    this.vista.set(v);
    saveVistaLista('argo-empleados-vista', v);
  }

  iniciales(e: Empleado): string {
    return inicialesNombre(e.primerNombre, e.primerApellido);
  }

  fotoUrl(f?: string): string | null {
    if (!f) return null;
    if (f.startsWith('http')) return f;
    return `${this.uploads}/${f}`;
  }

  onFoto(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fotoFile.set(file);
    const r = new FileReader();
    r.onload = () => this.fotoPreview.set(r.result as string);
    r.readAsDataURL(file);
  }

  nuevo() {
    this.editando.set(null);
    this.form.set(this.formVacio());
    this.fotoFile.set(null);
    this.fotoPreview.set(null);
    this.mostrarForm.set(true);
    this.msg.set(null);
  }

  editar(e: Empleado) {
    this.editando.set(e);
    this.form.set({
      ...e,
      fechaNacimiento: e.fechaNacimiento ? String(e.fechaNacimiento).slice(0, 10) : '',
      fechaIngreso: e.fechaIngreso ? String(e.fechaIngreso).slice(0, 10) : '',
      fechaRetiro: e.fechaRetiro ? String(e.fechaRetiro).slice(0, 10) : '',
    });
    this.fotoFile.set(null);
    this.fotoPreview.set(e.urlFoto ? this.fotoUrl(e.urlFoto) : null);
    this.mostrarForm.set(true);
    this.msg.set(null);
  }

  cancelar() {
    this.mostrarForm.set(false);
    this.editando.set(null);
  }

  patch<K extends keyof EmpleadoDto>(k: K, v: EmpleadoDto[K]) {
    this.form.update((f) => ({ ...f, [k]: v }));
  }

  guardar() {
    const f = this.form();
    if (!f.primerNombre?.trim() || !f.primerApellido?.trim()) {
      this.msg.set('Primer nombre y primer apellido son obligatorios.');
      return;
    }
    if (!f.numeroDocumento?.trim()) {
      this.msg.set('numeroDocumento es obligatorio (enlace con egresos).');
      return;
    }
    this.saving.set(true);
    const ed = this.editando();
    const files = this.fotoFile() ? { foto: this.fotoFile()! } : undefined;
    const req = ed ? this.svc.actualizar(ed.idEmpleado, f, files) : this.svc.crear(f, files);
    req.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.fotoFile.set(null);
        this.mostrarForm.set(false);
        this.cargar();
        let txt = ed ? 'Empleado actualizado.' : 'Empleado creado.';
        const ug = res?.usuarioGenerado;
        if (ug?.username) {
          if (ug.existente) {
            txt += ` Usuario ya existía — login: ${ug.username} (${ug.rol}).`;
          } else {
            txt += ` Usuario creado — login: ${ug.username} (mismo número de documento, ${ug.rol}).`;
            if (ug.passwordInicial) {
              txt += ` Contraseña inicial: ${ug.passwordInicial}.`;
            }
          }
        }
        this.msg.set(txt);
      },
      error: (e) => {
        this.saving.set(false);
        this.msg.set(e?.error?.message || 'Error al guardar');
      },
    });
  }

  async eliminar(e: Empleado) {
    const ok = await this.confirm.open({
      title: 'Eliminar empleado',
      message: `¿Eliminar a ${e.nombreCompleto}?`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;
    this.svc.eliminar(e.idEmpleado).subscribe({
      next: () => {
        this.cargar();
        this.msg.set('Empleado eliminado.');
      },
      error: (err) => this.msg.set(err?.error?.message || 'No se pudo eliminar'),
    });
  }
}
