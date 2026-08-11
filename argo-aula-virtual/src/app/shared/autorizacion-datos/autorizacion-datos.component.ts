import { CommonModule } from '@angular/common';
import { Component, model, signal } from '@angular/core';
import {
  AUTORIZACION_DATOS_TEXTO,
  AUTORIZACION_DATOS_TITULO,
} from '../../core/autorizacion-datos.constants';

@Component({
  selector: 'av-autorizacion-datos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './autorizacion-datos.component.html',
  styleUrl: './autorizacion-datos.component.scss',
})
export class AutorizacionDatosComponent {
  readonly titulo = AUTORIZACION_DATOS_TITULO;
  readonly texto = AUTORIZACION_DATOS_TEXTO;

  aceptado = model(false);
  modalAbierto = signal(false);

  abrirModal(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
  }

  onCheckChange(checked: boolean) {
    this.aceptado.set(checked);
  }
}
