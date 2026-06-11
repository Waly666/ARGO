import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AulaApiService } from '../../core/aula-api.service';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { PortalBrandingService } from '../../core/portal-branding.service';
import { PortalConfig } from '../../core/models';
import { PortalAuthService } from '../../core/portal-auth.service';
import { mergePortalLanding } from '../../core/portal-landing';
import { ACERCA_DEFAULT } from '../../pages/home/home-content';

import { FUNDACION_SITIO_URL } from '../../pages/fundacion/fundacion-content';

const FOOTER_ABOUT_DEFAULT =
  'promueve la seguridad vial mediante capacitación, estudios técnicos, campañas preventivas y asesoría a empresas, fomentando una movilidad segura y responsable.';

const FOOTER_SERVICIO_HREF: Record<string, string> = {
  capacitación: '/cursos',
  pesv: 'https://finstruvial.com.co/planes-estrategicos-de-seguridad-vial/',
  'campañas de seguridad vial': '/fundacion',
  'carreras técnicas': '/#carreras-tecnicas',
  'estudios de tránsito': 'https://finstruvial.com.co/nuestros-servicios/mapas/',
  'planes de movilidad sostenible y segura':
    'https://finstruvial.com.co/planes-de-movilidad-sostenible-y-segura/',
};

export interface FooterEnlace {
  label: string;
  route: string;
  fragment?: string;
}

export interface FooterServicioEnlace {
  label: string;
  href?: string;
  route?: string;
  fragment?: string;
  external: boolean;
}

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
  private router = inject(Router);
  auth = inject(PortalAuthService);

  config = signal<PortalConfig | null>(null);
  menuAbierto = signal(false);

  logoUrl = computed(() => resolveUploadUrl(this.config()?.urlLogoAbsoluta || this.config()?.urlLogo));

  landing = computed(() => mergePortalLanding(this.config()?.landing));

  footerServicios = computed(() => this.landing().footerServicios);

  footerEnlaces = computed((): FooterEnlace[] => {
    const nav = this.landing().nav;
    return [
      { label: nav.home, route: '/' },
      { label: nav.cursos, route: '/cursos' },
      { label: nav.tienda, route: '/tienda' },
      { label: nav.aula, route: '/aula' },
      { label: nav.fundacion, route: '/fundacion' },
      { label: nav.consultaCertificados, route: '/consulta-certificados' },
      { label: nav.acerca, route: '/acerca' },
      { label: 'Servicios', route: '/', fragment: 'servicios-empresa' },
      { label: 'Cómo funciona', route: '/', fragment: 'como-funciona' },
      { label: 'Preguntas frecuentes', route: '/', fragment: 'preguntas-frecuentes' },
      { label: 'Contáctanos', route: '/acerca', fragment: 'contacto' },
    ];
  });

  footerServiciosLinks = computed((): FooterServicioEnlace[] =>
    this.footerServicios().map((label) => {
      const href = FOOTER_SERVICIO_HREF[label.trim().toLowerCase()] || '/#servicios-empresa';
      if (href.startsWith('http')) {
        return { label, href, external: true };
      }
      if (href.includes('#')) {
        const [route, fragment] = href.split('#');
        return { label, route: route || '/', fragment, external: false };
      }
      return { label, route: href, external: false };
    }),
  );

  sitioInstitucionalUrl = FUNDACION_SITIO_URL;

  nombreCea = computed(() => this.config()?.nombreCea || 'Fundación Finstruvial');

  /** Texto junto al logo en el header (marca corta). */
  brandMarca = computed(() => {
    const name = this.config()?.nombreCea?.trim() || '';
    if (/finstruvial/i.test(name)) return 'FINSTRUVIAL';
    const corto = name.replace(/^fundaci[oó]n\s+/i, '').trim();
    return corto ? corto.toUpperCase() : 'FINSTRUVIAL';
  });

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

  toggleMenu() {
    this.menuAbierto.update((v) => !v);
  }

  cerrarMenu() {
    this.menuAbierto.set(false);
  }

  ngOnInit() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.cerrarMenu());

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
