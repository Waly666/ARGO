import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export type PesvNavId = 'inicio' | 'autodiagnostico' | 'fase1' | 'fase2' | 'tablero' | 'config';

@Component({
  selector: 'argo-pesv-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './pesv-nav.component.html',
  styleUrls: ['./pesv-nav.component.scss'],
})
export class PesvNavComponent {
  /** Resalta la sección actual en la barra del módulo. */
  active = input<PesvNavId>('inicio');
}
