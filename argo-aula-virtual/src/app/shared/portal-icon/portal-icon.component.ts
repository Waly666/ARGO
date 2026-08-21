import { Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

import { resolvePortalIconName } from './portal-icon.registry';

@Component({
  selector: 'av-portal-icon',
  standalone: true,
  imports: [NgIcon],
  template: `@if (resolved(); as n) {
    <ng-icon [name]="n" [size]="size()" [color]="color()" />
  }`,
  styleUrl: './portal-icon.component.scss',
  host: {
    class: 'av-portal-icon',
    '[class]': 'extraClass()',
    'aria-hidden': 'true',
  },
})
export class PortalIconComponent {
  /** Emoji legacy, clave semántica o nombre ng-icon registrado. */
  icon = input<string>('');
  size = input<string>('1.35rem');
  color = input<string>('');
  extraClass = input<string>('', { alias: 'class' });

  protected resolved = computed(() => resolvePortalIconName(this.icon()));
}
