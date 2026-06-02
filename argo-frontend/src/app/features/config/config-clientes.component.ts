import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Cliente, ClienteCatalogos, ClienteService } from '../../core/services/cliente.service';
import { AsistenteContextoService } from '../../core/services/asistente-contexto.service';

@Component({
  selector: 'argo-config-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-clientes.component.html',
  styleUrls: ['./config-clientes.component.scss'],
})
export class ConfigClientesComponent implements OnInit {
  private svc = inject(ClienteService);
  private asistente = inject(AsistenteContextoService);

  loading = signal(true);
  saving = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);

  clientes = signal<Cliente[]>([]);
  filtro = signal('');
  catalogos = signal<ClienteCatalogos | null>(null);

  modalAbierto = signal(false);
  editId = signal<string | null>(null);
  form = signal<Cliente>(this.vacio());

  private vacio(): Cliente {
    return {
      identificationDocumentCode: '31',
      identificacion: '',
      dv: '',
      legalOrganizationCode: '1',
      razonSocial: '',
      nombreComercial: '',
      nombres: '',
      tributeCode: 'ZZ',
      responsabilidadFiscal: 'R-99-PN',
      direccion: '',
      correo: '',
      telefono: '',
      municipioCodigo: '',
      municipioNombre: '',
      granContribuyente: false,
      agenteRetenedorIva: false,
      porcentajeReteIva: 0,
      activo: true,
    };
  }

  ngOnInit(): void {
    this.svc.catalogos().subscribe({
      next: (c) => this.catalogos.set(c),
      error: () => this.catalogos.set(null),
    });
    this.recargar();
  }

  recargar(): void {
    this.loading.set(true);
    this.svc.listar(this.filtro()).subscribe({
      next: (rows) => {
        this.clientes.set(rows || []);
        this.loading.set(false);
      },
      error: () => {
        this.clientes.set([]);
        this.loading.set(false);
      },
    });
  }

  patch(p: Partial<Cliente>): void {
    this.form.set({ ...this.form(), ...p });
  }

  nuevo(): void {
    this.editId.set(null);
    this.form.set(this.vacio());
    this.msg.set(null);
    this.modalAbierto.set(true);
    this.asistente.setOverride('facturacion.clientes');
  }

  editar(c: Cliente): void {
    this.editId.set(c._id || null);
    this.form.set({ ...this.vacio(), ...c });
    this.msg.set(null);
    this.modalAbierto.set(true);
    this.asistente.setOverride('facturacion.clientes');
  }

  cerrar(): void {
    this.modalAbierto.set(false);
    this.asistente.setOverride(null);
  }

  guardar(): void {
    const f = this.form();
    if (!f.identificacion?.trim() || !(f.razonSocial?.trim() || f.nombres?.trim())) {
      this.msgError.set(true);
      this.msg.set('Identificación y razón social / nombre son obligatorios');
      return;
    }
    this.saving.set(true);
    const obs = this.editId() ? this.svc.actualizar(this.editId()!, f) : this.svc.crear(f);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalAbierto.set(false);
        this.msgError.set(false);
        this.msg.set('Cliente guardado');
        this.recargar();
      },
      error: (e) => {
        this.saving.set(false);
        this.msgError.set(true);
        this.msg.set(e?.error?.message || 'No se pudo guardar el cliente');
      },
    });
  }

  eliminar(c: Cliente): void {
    if (!c._id) return;
    if (!confirm(`¿Desactivar el cliente "${c.nombre || c.identificacion}"?`)) return;
    this.svc.eliminar(c._id).subscribe({ next: () => this.recargar() });
  }

  esJuridica(): boolean {
    return String(this.form().legalOrganizationCode || '1') === '1';
  }

  esNit(): boolean {
    return String(this.form().identificationDocumentCode || '') === '31';
  }

  onTipoIdentificacion(code: string): void {
    const patch: Partial<Cliente> = { identificationDocumentCode: code };
    if (code === '31') {
      patch.legalOrganizationCode = '1';
    } else if (['13', '12', '22', '41'].includes(code)) {
      patch.legalOrganizationCode = '2';
      patch.dv = '';
    }
    this.patch(patch);
  }

  onGranContribuyente(v: boolean): void {
    const patch: Partial<Cliente> = { granContribuyente: v };
    if (v && this.form().responsabilidadFiscal === 'R-99-PN') {
      patch.responsabilidadFiscal = 'O-13';
    }
    this.patch(patch);
  }

  onAgenteRetenedor(v: boolean): void {
    const patch: Partial<Cliente> = { agenteRetenedorIva: v };
    if (v) {
      if (this.form().responsabilidadFiscal === 'R-99-PN') {
        patch.responsabilidadFiscal = 'O-23';
      }
      if (!this.form().porcentajeReteIva) patch.porcentajeReteIva = 15;
    }
    this.patch(patch);
  }
}
