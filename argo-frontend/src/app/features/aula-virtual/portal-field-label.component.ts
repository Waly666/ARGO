import { Component, Input } from '@angular/core';

import { PortalSeoHtmlTag, PortalSeoTagComponent } from './portal-seo-tag.component';

@Component({
  selector: 'argo-portal-field-label',
  standalone: true,
  imports: [PortalSeoTagComponent],
  template: `<span class="psb-field-label"><argo-portal-seo-tag [tag]="tag" /> {{ label }}</span>`,
})
export class PortalFieldLabelComponent {
  @Input({ required: true }) tag!: PortalSeoHtmlTag;
  @Input({ required: true }) label!: string;
}
