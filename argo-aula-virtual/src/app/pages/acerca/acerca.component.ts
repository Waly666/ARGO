import { CommonModule } from '@angular/common';

import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { RouterLink } from '@angular/router';



import { AulaApiService } from '../../core/aula-api.service';

import { mergePortalLanding } from '../../core/portal-landing';

import { PortalSeoService } from '../../core/portal-seo.service';

import { PortalConfig } from '../../core/models';

import { resolveUploadUrl } from '../../core/upload-url.util';

import { ContactoFormComponent } from '../../shared/contacto-form/contacto-form.component';

import { PortalIconComponent } from '../../shared/portal-icon/portal-icon.component';

import { portalSectionIcon } from '../../shared/portal-icon/portal-icon.registry';

import { DEFAULT_CEA_NOMBRE } from '../../core/portal-brand-defaults';
import { whatsappHrefFromPhone } from '../../core/portal-whatsapp.util';
import { ACERCA_DEFAULT, VALORES } from '../home/home-content';



@Component({

  selector: 'av-acerca',

  standalone: true,

  imports: [CommonModule, RouterLink, ContactoFormComponent, PortalIconComponent],

  templateUrl: './acerca.component.html',

  styleUrl: './acerca.component.scss',

})

export class AcercaComponent implements OnInit {

  private api = inject(AulaApiService);

  private seo = inject(PortalSeoService);

  config = signal<PortalConfig | null>(null);

  readonly valores = VALORES;



  landing = computed(() => mergePortalLanding(this.config()?.landing));

  acerca = computed(() => this.landing().acerca);



  ngOnInit() {

    this.api.config().subscribe({

      next: (c) => {

        this.config.set(c);

        this.seo.applyAcerca(c);

      },

      error: () => this.seo.applyAcerca(null),

    });

  }



  private readonly valorIcons = ['star', 'globe', 'user-group', 'target', 'heart', 'car'];



  readonly portalSectionIcon = portalSectionIcon;



  acercaTexto() {

    return this.config()?.acercaDeHtml?.trim() || ACERCA_DEFAULT;

  }



  acercaParrafos(): string[] {

    return this.acercaTexto()

      .split(/\n+/)

      .map((p: string) => p.trim())

      .filter(Boolean);

  }



  iconoValor(index: number): string {

    return this.valorIcons[index % this.valorIcons.length];

  }

  whatsappHref(): string | null {
    return whatsappHrefFromPhone(this.config()?.telefono);
  }



  nombreCea() {

    return this.config()?.nombreCea || DEFAULT_CEA_NOMBRE;

  }



  logoUrl = computed(() => {
    const cfg = this.config();
    return resolveUploadUrl(cfg?.urlLogoAbsoluta || cfg?.urlLogo);
  });



  heroImagenUrl = computed(() => {

    const hero = this.acerca().hero;

    const url = hero.imagenUrl?.trim();

    if (!url) return null;

    if (url.startsWith('/images/') || url.startsWith('/apk/')) return url;

    if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url;

    const resolved = resolveUploadUrl(hero.imagenUrlAbsoluta || url);

    if (resolved) return resolved;

    if (url.startsWith('/uploads/')) return url;

    return null;

  });



  heroImagenAlt = computed(() => {

    const alt = this.acerca().hero.imagenAlt?.trim();

    if (alt) return alt;

    return `Equipo o instalaciones de ${this.nombreCea()}`;

  });



  heroImagenCaption = computed(() => this.acerca().hero.imagenCaption?.trim() || '');

}


