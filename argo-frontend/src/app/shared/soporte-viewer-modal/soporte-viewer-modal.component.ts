import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'argo-soporte-viewer-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (abierto()) {
      <div class="svm-backdrop" (click)="cerrar()" role="presentation"></div>
      <div class="svm-panel" role="dialog" aria-modal="true" [attr.aria-label]="titulo()">
        <header class="svm-head">
          <strong>{{ titulo() }}</strong>
          <div class="svm-actions">
            @if (urlRaw()) {
              <a class="ghost mini" [href]="urlRaw()!" target="_blank" rel="noopener noreferrer">Abrir en pestaña</a>
            }
            <button type="button" class="ghost mini" (click)="cerrar()">Cerrar</button>
          </div>
        </header>
        <div class="svm-body">
          @if (esPdf()) {
            <iframe class="svm-frame" [src]="safeUrl()" title="Soporte PDF"></iframe>
          } @else {
            <img class="svm-img" [src]="urlRaw()!" [alt]="titulo()" />
          }
        </div>
      </div>
    }
  `,
  styles: [
    `
      .svm-backdrop {
        position: fixed;
        inset: 0;
        z-index: 12000;
        background: rgba(2, 8, 22, 0.72);
      }
      .svm-panel {
        position: fixed;
        z-index: 12001;
        top: 4vh;
        left: 50%;
        transform: translateX(-50%);
        width: min(920px, 94vw);
        height: min(88vh, 900px);
        display: flex;
        flex-direction: column;
        border-radius: 14px;
        border: 1px solid rgba(120, 170, 255, 0.28);
        background: #071428;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
        overflow: hidden;
      }
      .svm-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.7rem 0.85rem;
        border-bottom: 1px solid rgba(120, 170, 255, 0.16);
        strong {
          color: #e2e8f0;
          font-size: 0.9rem;
        }
      }
      .svm-actions {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
      .svm-body {
        flex: 1;
        min-height: 0;
        display: grid;
        place-items: center;
        background: #020817;
        padding: 0.5rem;
      }
      .svm-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 8px;
      }
      .svm-frame {
        width: 100%;
        height: 100%;
        border: 0;
        border-radius: 8px;
        background: #fff;
      }
    `,
  ],
})
export class SoporteViewerModalComponent {
  private sanitizer = inject(DomSanitizer);

  abierto = signal(false);
  urlRaw = signal<string | null>(null);
  safeUrl = signal<SafeResourceUrl | null>(null);
  titulo = signal('Soporte');

  abrir(url: string, titulo = 'Soporte del comprobante'): void {
    const u = String(url || '').trim();
    if (!u) return;
    this.urlRaw.set(u);
    this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(u));
    this.titulo.set(titulo);
    this.abierto.set(true);
  }

  cerrar(): void {
    this.abierto.set(false);
    this.urlRaw.set(null);
    this.safeUrl.set(null);
  }

  esPdf(): boolean {
    const u = (this.urlRaw() || '').toLowerCase();
    return u.includes('.pdf') || u.includes('application/pdf');
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.abierto()) this.cerrar();
  }
}
