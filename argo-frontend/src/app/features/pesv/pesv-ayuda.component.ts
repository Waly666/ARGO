import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'argo-pesv-ayuda',
  standalone: true,
  imports: [RouterLink],
  template: `
    <aside class="pesv-ayuda" aria-label="Ayuda de esta pantalla">
      <p class="pesv-ayuda-kicker">Qué hacer ahora</p>
      <p class="pesv-ayuda-ahora">{{ ahora() }}</p>
      @if (detalle()) {
        <p class="pesv-ayuda-detalle">{{ detalle() }}</p>
      }
      @if (siguiente()) {
        <a [routerLink]="siguiente()">{{ siguienteTexto() }}</a>
      }
    </aside>
  `,
  styleUrls: ['./pesv-shared.scss'],
})
export class PesvAyudaComponent {
  ahora = input.required<string>();
  detalle = input('');
  siguiente = input<string | null>(null);
  siguienteTexto = input('Continuar');
}
