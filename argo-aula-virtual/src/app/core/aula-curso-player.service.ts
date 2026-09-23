import { Injectable, signal } from '@angular/core';

/** Estado global: el alumno tiene un curso virtual abierto en el iframe del aula. */
@Injectable({ providedIn: 'root' })
export class AulaCursoPlayerService {
  readonly abierto = signal(false);
  readonly tituloCurso = signal('');

  marcarAbierto(titulo: string): void {
    this.tituloCurso.set(titulo.trim());
    this.abierto.set(true);
  }

  marcarCerrado(): void {
    this.abierto.set(false);
    this.tituloCurso.set('');
  }
}
