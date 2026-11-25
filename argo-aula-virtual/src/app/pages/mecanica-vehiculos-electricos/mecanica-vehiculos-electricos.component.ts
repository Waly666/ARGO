import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { DEFAULT_CEA_NOMBRE } from '../../core/portal-brand-defaults';
import { mergePortalLanding } from '../../core/portal-landing';
import { PortalConfig } from '../../core/models';
import { whatsappHrefFromPhone } from '../../core/portal-whatsapp.util';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { LcImagen, LcZonaImagen, mergeLandingCursos } from './landing-cursos-content';

@Component({
  selector: 'av-mecanica-vehiculos-electricos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mecanica-vehiculos-electricos.component.html',
  styleUrl: './mecanica-vehiculos-electricos.component.scss',
})
export class MecanicaVehiculosElectricosComponent implements OnInit {
  private api = inject(AulaApiService);

  @ViewChild('islandTrack') islandTrack?: ElementRef<HTMLElement>;

  config = signal<PortalConfig | null>(null);
  habilidadActiva = signal(0);
  menuAbierto = signal(false);

  contenido = computed(() => {
    const landing = mergePortalLanding(this.config()?.landing, this.config()?.site?.tema);
    const legacy = (this.config()?.landing as { mecanicaVehiculosElectricos?: unknown } | undefined)
      ?.mecanicaVehiculosElectricos;
    return mergeLandingCursos(landing.landingCursos || (legacy as never));
  });

  nombreCea = computed(() => this.config()?.nombreCea?.trim() || DEFAULT_CEA_NOMBRE);
  telefono = computed(() => this.config()?.telefono?.trim() || '');
  direccion = computed(() => this.config()?.direccion?.trim() || '');
  whatsappHref = computed(() => whatsappHrefFromPhone(this.config()?.telefono));
  logoUrl = computed(() => {
    const cfg = this.config();
    return resolveUploadUrl(cfg?.urlLogoAbsoluta || cfg?.urlLogo) || '';
  });

  heroDesktop = computed(() => this.imagenPorZona('hero-desktop'));
  heroMobile = computed(() => this.imagenPorZona('hero-mobile'));
  fotoLateral = computed(() => this.imagenPorZona('lateral'));
  fotoAncha = computed(() => this.imagenPorZona('ancho'));
  galeria = computed(() =>
    this.contenido().imagenes.filter((img) => img.zona === 'galeria' && this.urlDe(img)),
  );

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => this.config.set(c),
      error: () => this.config.set(null),
    });
  }

  texto(value: string | null | undefined): string {
    return String(value || '')
      .replaceAll('{empresa}', this.nombreCea())
      .replaceAll('{telefono}', this.telefono())
      .replaceAll('{direccion}', this.direccion());
  }

  urlDe(img: LcImagen | undefined): string | null {
    const url = img?.urlAbsoluta?.trim() || img?.url?.trim();
    if (!url) return null;
    if (url.startsWith('/assets/') || url.startsWith('assets/')) {
      return url.startsWith('/') ? url : `/${url}`;
    }
    return resolveUploadUrl(url) || url;
  }

  compraExterna(): boolean {
    return /^https?:\/\//i.test(this.contenido().ctaComprarUrl.trim());
  }

  iconoHabilidad(index: number): 'caso' | 'escudo' | 'bateria' | 'energia' | 'medir' | 'informe' {
    const iconos = ['caso', 'escudo', 'bateria', 'energia', 'medir', 'informe'] as const;
    return iconos[index % iconos.length];
  }

  numeroHabilidad(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  iconoDato(item: { titulo: string; precio: string }): 'pantalla' | 'reloj' | 'precio' | 'calendario' {
    if (item.precio?.trim()) return 'precio';
    const titulo = (item.titulo || '').toLowerCase();
    if (titulo.includes('dura')) return 'reloj';
    if (titulo.includes('fecha')) return 'calendario';
    return 'pantalla';
  }

  toggleMenu() {
    this.menuAbierto.update((v) => !v);
  }

  cerrarMenu() {
    this.menuAbierto.set(false);
  }

  moverIsla(direccion: number) {
    const total = this.contenido().habilidades.length;
    this.irIsla(Math.min(total - 1, Math.max(0, this.habilidadActiva() + direccion)));
  }

  irIsla(indice: number) {
    const pista = this.islandTrack?.nativeElement;
    if (!pista) return;
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    pista.scrollTo({ left: indice * this.pasoIsla(), behavior: suave ? 'smooth' : 'auto' });
    this.habilidadActiva.set(indice);
  }

  alDesplazarIsla() {
    const pista = this.islandTrack?.nativeElement;
    const salto = this.pasoIsla();
    if (!pista || !salto) return;
    const total = this.contenido().habilidades.length;
    const indice = Math.min(total - 1, Math.max(0, Math.round(pista.scrollLeft / salto)));
    this.habilidadActiva.set(indice);
  }

  private pasoIsla(): number {
    const pista = this.islandTrack?.nativeElement;
    const tarjeta = pista?.querySelector('.skill') as HTMLElement | null;
    if (!pista || !tarjeta) return 0;
    return tarjeta.getBoundingClientRect().width + 16;
  }

  private imagenPorZona(zona: LcZonaImagen): LcImagen | null {
    return this.contenido().imagenes.find((img) => img.zona === zona && this.urlDe(img)) || null;
  }
}
