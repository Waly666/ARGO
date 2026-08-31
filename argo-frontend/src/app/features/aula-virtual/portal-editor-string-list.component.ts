import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { addStringItem, moveStringItem, removeStringItem } from './portal-landing-editor-helpers';

@Component({
  selector: 'argo-portal-editor-string-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="ple-list">
      @for (_ of items; track $index; let i = $index) {
        <div class="ple-list__row">
          <input type="text" class="psb-input" [(ngModel)]="items[i]" [name]="'str-' + i" />
          <button type="button" class="psb-icon-btn" title="Subir" (click)="move(i, -1)" [disabled]="i === 0">↑</button>
          <button
            type="button"
            class="psb-icon-btn"
            title="Bajar"
            (click)="move(i, 1)"
            [disabled]="i === items.length - 1"
          >
            ↓
          </button>
          <button type="button" class="psb-icon-btn" title="Eliminar" (click)="remove(i)">×</button>
        </div>
      }
      <button type="button" class="psb-link" (click)="add()">{{ addLabel }}</button>
    </div>
  `,
  styleUrl: './portal-landing-editor-shared.scss',
})
export class PortalEditorStringListComponent {
  @Input({ required: true }) items!: string[];
  @Input() addLabel = '+ Añadir ítem';

  add() {
    addStringItem(this.items);
  }

  remove(i: number) {
    removeStringItem(this.items, i);
  }

  move(i: number, dir: -1 | 1) {
    moveStringItem(this.items, i, dir);
  }
}
