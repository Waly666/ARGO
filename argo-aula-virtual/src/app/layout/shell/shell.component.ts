import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { PortalBrandingService } from '../../core/portal-branding.service';
import { PortalConfig } from '../../core/models';
import { PortalAuthService } from '../../core/portal-auth.service';
import { ACERCA_DEFAULT } from '../../pages/home/home-content';

const FOOTER_ABOUT_DEFAULT =
  'promueve la seguridad vial mediante capacitación, estudios técnicos, campañas preventivas y asesoría a empresas, fomentando una movilidad segura y responsable.';

@Component({
  selector: 'av-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private api = inject(AulaApiService);
  private branding = inject(PortalBrandingService);
  auth = inject(PortalAuthService);

  config = signal<PortalConfig | null>(null);

  readonly footerServicios = [
    'Capacitación',
    'PESV',
    'Campañas de seguridad vial',
    'Carreras técnicas',
    'Estudios de tránsito',
    'Planes de movilidad sostenible y segura',
  ];

  nombreCea = computed(() => this.config()?.nombreCea || 'Fundación Finstruvial');

  whatsappTelefono = computed(() => this.config()?.telefono?.trim() || '');

  whatsappHref = computed(() => {
    const digits = this.whatsappTelefono().replace(/\D/g, '');
    if (!digits) return null;
    const withCountry = digits.startsWith('57') ? digits : `57${digits}`;
    return `https://wa.me/${withCountry}`;
  });

  direccionCompleta = computed(() => {
    const c = this.config();
    return [c?.direccion, c?.ciudad].filter(Boolean).join(' ').trim() || '';
  });

  footerAbout = computed(() => {
    const custom = this.config()?.acercaDeHtml?.trim();
    if (custom) {
      const first = custom.split('\n').map((l) => l.trim()).find(Boolean);
      if (first) return first;
    }
    return `${this.nombreCea()} ${FOOTER_ABOUT_DEFAULT}`;
  });

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.branding.apply(c);
      },
      error: () => {
        const fallback = {
          nombreCea: 'Fundación Finstruvial',
          heroTitulo: 'Educación virtual',
          heroSubtitulo: 'Capacitación en línea',
          acercaDeHtml: ACERCA_DEFAULT,
        };
        this.config.set(fallback);
        this.branding.apply(fallback);
      },
    });
  }

  telHref() {
    const digits = this.config()?.telefono?.replace(/\D/g, '') || '';
    if (!digits) return null;
    const withCountry = digits.startsWith('57') ? digits : `57${digits}`;
    return `tel:+${withCountry}`;
  }

  telDisplay() {
    const tel = this.config()?.telefono?.trim() || '';
    const digits = tel.replace(/\D/g, '');
    if (!digits) return tel;
    const withCountry = digits.startsWith('57') ? digits : `57${digits}`;
    if (withCountry.length === 12) {
      return `+${withCountry.slice(0, 2)} ${withCountry.slice(2, 5)} ${withCountry.slice(5, 8)} ${withCountry.slice(8)}`;
    }
    return tel.startsWith('+') ? tel : `+${withCountry}`;
  }

  logout() {
    this.auth.logout();
  }
}
