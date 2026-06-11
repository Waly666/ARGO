import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AulaApiService } from '../../core/aula-api.service';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalConfig } from '../../core/models';
import { resolveUploadUrl } from '../../core/upload-url.util';
import {
  FUNDACION_COMPROMISO,
  FUNDACION_CONTACTO,
  FUNDACION_MISION,
  FUNDACION_QUIENES_BLOQUES,
  FUNDACION_QUIENES_DESTACADOS,
  FUNDACION_QUIENES_LEAD,
  FUNDACION_SERVICIOS_DESTACADOS,
  FUNDACION_SITIO_URL,
  FUNDACION_VISION,
} from './fundacion-content';

@Component({
  selector: 'av-fundacion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './fundacion.component.html',
  styleUrl: './fundacion.component.scss',
})
export class FundacionComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);

  config = signal<PortalConfig | null>(null);

  readonly quienesLead = FUNDACION_QUIENES_LEAD;
  readonly quienesDestacados = FUNDACION_QUIENES_DESTACADOS;
  readonly quienesBloques = FUNDACION_QUIENES_BLOQUES;
  readonly mision = FUNDACION_MISION;
  readonly vision = FUNDACION_VISION;
  readonly compromiso = FUNDACION_COMPROMISO;
  readonly servicios = FUNDACION_SERVICIOS_DESTACADOS;
  readonly sitioUrl = FUNDACION_SITIO_URL;
  readonly contacto = FUNDACION_CONTACTO;

  telefono = computed(() => this.config()?.telefono?.trim() || FUNDACION_CONTACTO.telefono);
  email = computed(() => this.config()?.email?.trim() || FUNDACION_CONTACTO.email);
  direccion = computed(() => {
    const c = this.config();
    const partes = [c?.direccion, c?.ciudad].filter(Boolean);
    return partes.length ? partes.join(', ') : FUNDACION_CONTACTO.direccion;
  });

  logoUrl = computed(() => {
    const cfg = this.config();
    return resolveUploadUrl(cfg?.urlLogoAbsoluta || cfg?.urlLogo);
  });

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.seo.applyFundacion(c);
      },
      error: () => this.seo.applyFundacion(null),
    });
  }

  telHref() {
    const digits = this.telefono().replace(/\D/g, '');
    if (!digits) return null;
    const withCountry = digits.startsWith('57') ? digits : `57${digits}`;
    return `tel:+${withCountry}`;
  }

  whatsappHref() {
    const digits = this.telefono().replace(/\D/g, '');
    if (!digits) return null;
    const withCountry = digits.startsWith('57') ? digits : `57${digits}`;
    return `https://wa.me/${withCountry}`;
  }
}
