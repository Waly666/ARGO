import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { PortalConfig } from '../../core/models';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { ACERCA_DEFAULT, VALORES } from '../home/home-content';

@Component({
  selector: 'av-acerca',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './acerca.component.html',
  styleUrl: './acerca.component.scss',
})
export class AcercaComponent implements OnInit {
  private api = inject(AulaApiService);
  config = signal<PortalConfig | null>(null);
  readonly valores = VALORES;

  ngOnInit() {
    this.api.config().subscribe({ next: (c) => this.config.set(c) });
  }

  acercaTexto() {
    return this.config()?.acercaDeHtml?.trim() || ACERCA_DEFAULT;
  }

  nombreCea() {
    return this.config()?.nombreCea || 'Fundación Finstruvial';
  }

  logoUrl() {
    const cfg = this.config();
    return resolveUploadUrl(cfg?.urlLogoAbsoluta || cfg?.urlLogo);
  }
}
