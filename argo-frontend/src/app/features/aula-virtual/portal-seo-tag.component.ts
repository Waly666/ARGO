import { Component, Input } from '@angular/core';

export type PortalSeoHtmlTag = 'H1' | 'H2' | 'H3' | 'H4' | 'p';

@Component({
  selector: 'argo-portal-seo-tag',
  standalone: true,
  template: `<span class="psb-seo-tag" [class]="'psb-seo-tag--' + tag.toLowerCase()" [attr.title]="'Elemento HTML en el sitio público'">{{ tag }}</span>`,
})
export class PortalSeoTagComponent {
  @Input({ required: true }) tag!: PortalSeoHtmlTag;
}
