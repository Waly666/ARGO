import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable, shareReplay, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { PortalConfig } from './models';
import { PortalBrandingService } from './portal-branding.service';
import { DEFAULT_CEA_NOMBRE } from './portal-brand-defaults';
import {
  applyPortalThemeCache,
  markPortalReady,
  persistPortalThemeCache,
  readPortalThemeCache,
} from './portal-theme-cache.util';
import { PortalThemeService } from './portal-theme.service';

@Injectable({ providedIn: 'root' })
export class PortalConfigService {
  private http = inject(HttpClient);
  private theme = inject(PortalThemeService);
  private branding = inject(PortalBrandingService);

  private readonly configSignal = signal<PortalConfig | null>(null);
  private readonly readySignal = signal(false);
  private stream: Observable<PortalConfig> | null = null;

  readonly config = this.configSignal.asReadonly();
  readonly ready = this.readySignal.asReadonly();

  constructor() {
    applyPortalThemeCache(readPortalThemeCache());
  }

  /** Bloquea el arranque de Angular hasta tener la configuración del tenant. */
  init(): Promise<PortalConfig> {
    return firstValueFrom(this.ensureLoaded());
  }

  ensureLoaded(): Observable<PortalConfig> {
    if (!this.stream) {
      this.stream = this.http.get<PortalConfig>(`${environment.apiUrl}/aula-virtual/config`).pipe(
        tap({
          next: (cfg) => this.applyConfig(cfg),
          error: () => this.applyConfig(this.fallbackConfig()),
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.stream;
  }

  private applyConfig(cfg: PortalConfig) {
    this.configSignal.set(cfg);
    this.theme.apply(cfg);
    this.branding.apply(cfg);
    persistPortalThemeCache(cfg);
    this.readySignal.set(true);
    markPortalReady();
  }

  private fallbackConfig(): PortalConfig {
    return {
      nombreCea: DEFAULT_CEA_NOMBRE,
      heroTitulo: 'Educación virtual',
      heroSubtitulo: 'Capacitación en línea',
      acercaDeHtml: '',
    } as PortalConfig;
  }
}
