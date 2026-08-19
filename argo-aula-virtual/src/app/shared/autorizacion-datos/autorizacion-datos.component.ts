import { CommonModule } from '@angular/common';
import { Component, computed, input, model, signal } from '@angular/core';
import {
  AUTORIZACION_DATOS_TITULO,
  buildAutorizacionDatosTexto,
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

  nombreEmpresa = input<string>('');
  correo = input<string>('');

  readonly texto = computed(() =>
    buildAutorizacionDatosTexto(this.nombreEmpresa(), this.correo()),
  );

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
