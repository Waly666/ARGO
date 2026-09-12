import { Component } from '@angular/core';

import { PortalSeoTagComponent } from './portal-seo-tag.component';

@Component({
  selector: 'argo-portal-seo-legend',
  standalone: true,
  imports: [PortalSeoTagComponent],
  template: `
    <p class="psb-seo-legend">
      Las etiquetas
      <argo-portal-seo-tag tag="H1" />
      <argo-portal-seo-tag tag="H2" />
      <argo-portal-seo-tag tag="H3" />
      <argo-portal-seo-tag tag="p" />
      indican qué elemento HTML usa el sitio público (importante para SEO y accesibilidad).
      El <strong>H1</strong> (dorado) es el único título principal de cada página y aparece resaltado en el formulario.
    </p>
  `,
})
export class PortalSeoLegendComponent {}
