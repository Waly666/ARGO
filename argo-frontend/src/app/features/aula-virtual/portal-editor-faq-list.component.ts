import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { addFaqItem, removeAt } from './portal-landing-editor-helpers';

@Component({
  selector: 'argo-portal-editor-faq-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    @for (faq of items; track $index; let i = $index) {
      <div class="ple-card">
        <div class="ple-card__head">
          <strong>Pregunta {{ i + 1 }}</strong>
          <button type="button" class="psb-link ple-remove" (click)="remove(i)">Eliminar</button>
        </div>
        <label class="psb-field psb-field--plain">
          <span>Pregunta</span>
          <input type="text" class="psb-input" [(ngModel)]="faq.pregunta" [name]="'faq-q-' + i" />
        </label>
        <label class="psb-field psb-field--plain">
          <span>Respuesta</span>
          <textarea class="psb-input" rows="3" [(ngModel)]="faq.respuesta" [name]="'faq-a-' + i"></textarea>
        </label>
      </div>
    }
    <button type="button" class="psb-link" (click)="add()">+ Añadir pregunta</button>
  `,
  styleUrl: './portal-landing-editor-shared.scss',
})
export class PortalEditorFaqListComponent {
  @Input({ required: true }) items!: { pregunta: string; respuesta: string }[];

  add() {
    addFaqItem(this.items);
  }

  remove(i: number) {
    removeAt(this.items, i);
  }
}
