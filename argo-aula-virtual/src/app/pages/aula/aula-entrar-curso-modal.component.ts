import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';

export const AULA_ENTRAR_CURSO_MODAL_SKIP_KEY = 'argo.aula.curso-entrar-modal.v1.skip';

@Component({
  selector: 'av-aula-entrar-curso-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aula-entrar-curso-modal.component.html',
  styleUrl: './aula-entrar-curso-modal.component.scss',
})
export class AulaEntrarCursoModalComponent {
  cursoNombre = input.required<string>();
  asistenteVisible = input(true);

  closed = output<void>();

  noMostrarMas = signal(false);

  cerrar(): void {
    if (this.noMostrarMas() && typeof localStorage !== 'undefined') {
      localStorage.setItem(AULA_ENTRAR_CURSO_MODAL_SKIP_KEY, '1');
    }
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).dataset['backdrop'] === '1') {
      this.cerrar();
    }
  }
}
