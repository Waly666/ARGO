import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  PLATFORM_ID,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import { resolvePlayerIframeUrl } from '../../core/utils/upload-url.util';

export interface CursoVirtualPreviewTarget {
  idPrograma: string;
  nombreProg: string;
  playerUrl?: string | null;
  storagePrefix?: string | null;
}

@Component({
  selector: 'argo-aula-virtual-curso-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aula-virtual-curso-preview.component.html',
  styleUrls: ['./aula-virtual-curso-preview.component.scss'],
})
export class AulaVirtualCursoPreviewComponent {
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);

  curso = input.required<CursoVirtualPreviewTarget>();
  closed = output<void>();

  private frame = viewChild<ElementRef<HTMLIFrameElement>>('previewFrame');
  private initTimers: ReturnType<typeof setTimeout>[] = [];

  safeUrl = signal<SafeResourceUrl | null>(null);

  constructor() {
    effect(() => {
      const c = this.curso();
      if (c && isPlatformBrowser(this.platformId)) {
        this.abrirUrl();
      }
    });
  }

  cerrar(): void {
    this.initTimers.forEach(clearTimeout);
    this.initTimers = [];
    this.safeUrl.set(null);
    this.closed.emit();
  }

  onIframeLoad(): void {
    this.enviarInitSandbox();
    this.initTimers.forEach(clearTimeout);
    this.initTimers = [
      setTimeout(() => this.enviarInitSandbox(), 600),
      setTimeout(() => this.enviarInitSandbox(), 1800),
    ];
  }

  private abrirUrl(): void {
    const c = this.curso();
    const raw = String(c.playerUrl || '').trim();
    if (!raw) return;
    const full = resolvePlayerIframeUrl(raw);
    if (!full) return;
    this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(full));
  }

  private enviarInitSandbox(): void {
    const c = this.curso();
    const win = this.frame()?.nativeElement?.contentWindow;
    if (!win) return;
    const payload = {
      type: 'ARGO_INIT',
      sandbox: true,
      apiUrl: this.aulaVirtualApiUrl(),
      idPrograma: String(c.idPrograma),
      storagePrefix: c.storagePrefix ? String(c.storagePrefix) : undefined,
    };
    win.postMessage(payload, '*');
    win.postMessage({ type: 'ARGO_SYNC_REQUEST' }, '*');
  }

  /** Mismo origen que el iframe (backend :3000 cuando el paquete se sirve desde /uploads). */
  private aulaVirtualApiUrl(): string {
    const iframe = resolvePlayerIframeUrl(this.curso().playerUrl);
    if (iframe) {
      try {
        return `${new URL(iframe).origin}/api/aula-virtual`;
      } catch {
        /* fall through */
      }
    }
    const root = String(environment.apiUrl || '').replace(/\/+$/, '');
    return `${root}/aula-virtual`;
  }
}
