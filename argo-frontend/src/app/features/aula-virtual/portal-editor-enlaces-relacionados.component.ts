import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PortalEnlaceRelacionado } from '../../core/portal-enlace-relacionado.util';

@Component({
  selector: 'av-portal-editor-enlaces-relacionados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-editor-enlaces-relacionados.component.html',
})
export class PortalEditorEnlacesRelacionadosComponent {
  @Input({ required: true }) titulo!: string;
  @Input({ required: true }) enlaces!: PortalEnlaceRelacionado[];

  addEnlace() {
    this.enlaces.push({ texto: '', etiqueta: '', url: '' });
  }

  removeEnlace(index: number) {
    this.enlaces.splice(index, 1);
  }
}
