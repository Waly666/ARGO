import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { Usuario, UsuarioDto, UsuarioService } from '../../core/services/usuario.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { readVistaLista, saveVistaLista, VistaLista } from '../../core/utils/vista-lista.helpers';
import {
  documentoUsuario,
  esLoginNumerico,
  loginMostrable,
} from '../../core/utils/usuario-login.helpers';

@Component({
  selector: 'argo-usuarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.scss'],
})
export class UsuariosAdminComponent implements OnInit {
  private svc = inject(UsuarioService);
  private auth = inject(AuthService);
  private confirm = inject(ConfirmDialogService);

  usuarios = signal<Usuario[]>([]);
  roles = signal<{ id: string; label: string }[]>([]);
  loading = signal(false);
  saving = signal(false);
  msg = signal<string | null>(null);
  editando = signal<Usuario | null>(null);
  mostrarForm = signal(false);
  vista = signal<VistaLista>(readVistaLista('argo-usuarios-vista'));

  form = signal<UsuarioDto>({
    username: '',
    password: '',
    nombres: '',
    apellidos: '',
    email: '',
    rol: 'usuario',
    activo: true,
    numeroDocumento: '',
  });

  ngOnInit(): void {
    this.cargar();
    this.svc.roles().subscribe({ next: (r) => this.roles.set(r || []) });
  }

  cargar() {
    this.loading.set(true);
    this.svc.listar().subscribe({
      next: (r) => {
        this.usuarios.set(r || []);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.msg.set(e?.error?.message || 'Error cargando usuarios');
      },
    });
  }

  setVista(v: VistaLista) {
    this.vista.set(v);
    saveVistaLista('argo-usuarios-vista', v);
  }

  nombreCompleto(u: Usuario): string {
    return `${u.nombres || ''} ${u.apellidos || ''}`.trim() || loginMostrable(u);
  }

  loginLabel = loginMostrable;
  docLabel = documentoUsuario;

  nuevo() {
    this.editando.set(null);
    this.form.set({
      username: '',
      password: '',
      nombres: '',
      apellidos: '',
      email: '',
      rol: 'usuario',
      activo: true,
      numeroDocumento: '',
    });
    this.mostrarForm.set(true);
    this.msg.set(null);
  }

  editar(u: Usuario) {
    this.editando.set(u);
    const login = esLoginNumerico(u.username) ? '' : u.username;
    this.form.set({
      username: login,
      password: '',
      nombres: u.nombres || '',
      apellidos: u.apellidos || '',
      email: u.email || '',
      rol: u.rol || 'usuario',
      activo: u.activo !== false,
      numeroDocumento: documentoUsuario(u),
    });
    this.mostrarForm.set(true);
    this.msg.set(null);
  }

  cancelar() {
    this.mostrarForm.set(false);
    this.editando.set(null);
  }

  patch<K extends keyof UsuarioDto>(k: K, v: UsuarioDto[K]) {
    this.form.update((f) => ({ ...f, [k]: v }));
  }

  guardar() {
    const f = this.form();
    const ed = this.editando();
    if (!f.username?.trim()) {
      this.msg.set('El nombre de usuario (login) es obligatorio.');
      return;
    }
    if (esLoginNumerico(f.username)) {
      this.msg.set('Use un nombre de usuario (ej. jose o walter.aguilar), no el documento.');
      return;
    }
    if (!ed && (!f.password || f.password.length < 4)) {
      this.msg.set('La contraseña es obligatoria al crear (mín. 4 caracteres).');
      return;
    }
    this.saving.set(true);
    this.msg.set(null);
    const req = ed
      ? this.svc.actualizar(ed._id, f)
      : this.svc.crear(f);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.mostrarForm.set(false);
        this.cargar();
        this.msg.set(ed ? 'Usuario actualizado.' : 'Usuario creado.');
      },
      error: (e) => {
        this.saving.set(false);
        this.msg.set(e?.error?.message || 'Error al guardar.');
      },
    });
  }

  esUsuarioActual(u: Usuario): boolean {
    const me = this.auth.user()?._id;
    return !!me && String(me) === String(u._id);
  }

  async desactivar(u: Usuario) {
    const ok = await this.confirm.open({
      title: '¿Desactivar usuario?',
      message: `El usuario «${loginMostrable(u)}» no podrá iniciar sesión.`,
      variant: 'danger',
      confirmLabel: 'Desactivar',
    });
    if (!ok) return;
    this.svc.desactivar(u._id).subscribe({
      next: () => this.cargar(),
      error: (e) => this.msg.set(e?.error?.message || 'Error.'),
    });
  }

  async borrar(u: Usuario) {
    const ok = await this.confirm.open({
      title: '¿Eliminar usuario?',
      message: `Se borrará permanentemente «${loginMostrable(u)}». Esta acción no se puede deshacer.`,
      variant: 'danger',
      icon: 'delete',
      confirmLabel: 'Sí, eliminar',
    });
    if (!ok) return;
    this.svc.borrar(u._id).subscribe({
      next: (r) => {
        if (this.editando()?._id === u._id) this.cancelar();
        this.cargar();
        this.msg.set(r.message || 'Usuario eliminado.');
      },
      error: (e) => this.msg.set(e?.error?.message || 'No se pudo eliminar.'),
    });
  }

  labelRol(id?: string): string {
    return this.roles().find((r) => r.id === id)?.label || id || '—';
  }
}
