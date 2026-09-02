import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'argo-portal-finstruvial-editor-seccion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="fsv-sec" [class.fsv-sec--collapsed]="!abierta" [attr.id]="anchorId">
      <header class="fsv-sec__head">
        <button type="button" class="fsv-sec__toggle" (click)="toggle.emit()" [attr.aria-expanded]="abierta">
          <span class="fsv-sec__step">{{ paso }}</span>
          <span class="fsv-sec__icon" aria-hidden="true">{{ icono }}</span>
          <span class="fsv-sec__copy">
            <strong class="fsv-sec__title">{{ titulo }}</strong>
            <span class="fsv-sec__desc">{{ descripcion }}</span>
          </span>
          <span class="fsv-sec__caret" aria-hidden="true">{{ abierta ? '▾' : '▸' }}</span>
        </button>
        @if (ancla && vistaPreviaUrl) {
          <a
            class="fsv-sec__preview"
            [href]="vistaPreviaUrl + '#' + ancla"
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir esta sección en el sitio público"
          >
            Ver en sitio ↗
          </a>
        }
      </header>
      @if (abierta) {
        <div class="fsv-sec__body">
          <ng-content />
        </div>
      }
    </section>
  `,
  styleUrl: './portal-finstruvial-editor-seccion.component.scss',
})
export class PortalFinstruvialEditorSeccionComponent {
  @Input({ required: true }) paso = 1;
  @Input({ required: true }) titulo = '';
  @Input() descripcion = '';
  @Input() icono = '📄';
  @Input() ancla = '';
  @Input() vistaPreviaUrl = '';
  @Input() abierta = true;
  @Input() anchorId = '';

  @Output() toggle = new EventEmitter<void>();
}
