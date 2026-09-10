import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PortalFieldLabelComponent } from './portal-field-label.component';

export interface PortalLandingHeroBasicFields {
  kicker: string;
  titulo: string;
  tituloLinea2?: string;
  subtitulo?: string;
  heroLead?: string;
}

@Component({
  selector: 'argo-portal-landing-hero-basic-fields',
  standalone: true,
  imports: [
    PortalFieldLabelComponent,
    FormsModule,
  ],
  templateUrl: './portal-landing-hero-basic-fields.component.html',
})
export class PortalLandingHeroBasicFieldsComponent {
  @Input({ required: true }) hero!: PortalLandingHeroBasicFields;
  @Input() showTituloLinea2 = true;
  @Input() showSubtitulo = true;
  @Input() showHeroLead = true;
}
