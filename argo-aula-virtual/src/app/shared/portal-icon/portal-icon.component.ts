import { Component, computed, inject, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

import { PortalIconografiaService } from './portal-iconografia.service';
import { resolvePortalIconDisplay } from './portal-icon.resolver';

@Component({
  selector: 'av-portal-icon',
  standalone: true,
  imports: [NgIcon],
  template: `@if (display(); as d) {
    @switch (d.type) {
      @case ('image') {
        <img class="av-portal-icon__img" [src]="d.url" alt="" />
      }
      @case ('emoji') {
        <span class="av-portal-icon__emoji">{{ d.char }}</span>
      }
      @case ('vector') {
        <ng-icon [name]="d.name" [size]="size()" [color]="color()" />
      }
    }
  }`,
  styleUrl: './portal-icon.component.scss',
  host: {
    class: 'av-portal-icon',
    '[class]': 'extraClass()',
    'aria-hidden': 'true',
  },
})
export class PortalIconComponent {
  private iconografiaSvc = inject(PortalIconografiaService);

  /** Emoji legacy, clave semántica o nombre ng-icon registrado. */
  icon = input<string>('');
  size = input<string>('1.35rem');
  color = input<string>('');
  extraClass = input<string>('', { alias: 'class' });

  protected display = computed(() =>
    resolvePortalIconDisplay(this.icon(), this.iconografiaSvc.config()),
  );
}
