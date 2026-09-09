import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  PortalEnlaceRelacionado,
  portalEnlaceEsExterno,
  portalEnlaceRuta,
} from '../../core/portal-enlace-relacionado.util';

@Component({
  selector: 'av-portal-enlaces-relacionados',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './portal-enlaces-relacionados.component.html',
  styleUrl: './portal-enlaces-relacionados.component.scss',
})
export class PortalEnlacesRelacionadosComponent {
  @Input() titulo = '';
  @Input() enlaces: PortalEnlaceRelacionado[] = [];
  @Input() sectionId = 'enlaces-relacionados';

  esExterno(url: string): boolean {
    return portalEnlaceEsExterno(url);
  }

  ruta(url: string): string {
    return portalEnlaceRuta(url);
  }
}
