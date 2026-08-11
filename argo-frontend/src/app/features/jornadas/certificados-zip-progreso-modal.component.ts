import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type CertZipProgreso = {
  jobId?: string;
  status: 'idle' | 'running' | 'ready' | 'error' | 'downloading';
  fase: string;
  hecho: number;
  total: number;
  porcentaje: number;
  message?: string | null;
  filename?: string | null;
};

/** modal = centrado; anchor = junto al header del hub; header = franja superior; inline = embebido. */
export type CertZipProgresoUbicacion = 'modal' | 'anchor' | 'header' | 'inline';

@Component({
  selector: 'argo-certificados-zip-progreso-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      @if (ubicacion === 'inline') {
        <div class="czp-inline" role="status" aria-live="polite" aria-labelledby="czp-title">
          <ng-container *ngTemplateOutlet="contenido" />
        </div>
      } @else if (ubicacion === 'anchor') {
        <div class="czp-anchor" role="presentation">
          <div class="czp-backdrop czp-backdrop--anchor" aria-hidden="true"></div>
          <div
            class="czp-panel czp-panel--anchor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="czp-title"
            (click)="$event.stopPropagation()">
            <ng-container *ngTemplateOutlet="contenido" />
          </div>
        </div>
      } @else {
        <div
          class="czp-layer"
          [class.czp-layer--header]="ubicacion === 'header'"
          role="presentation">
          @if (modoModalCompleto) {
            <div class="czp-backdrop"></div>
          }
          <div
            class="czp-panel"
            [class.czp-panel--header]="ubicacion === 'header'"
            role="dialog"
            [attr.aria-modal]="modoModalCompleto ? 'true' : null"
            aria-labelledby="czp-title"
            (click)="$event.stopPropagation()">
            <ng-container *ngTemplateOutlet="contenido" />
          </div>
        </div>
      }
    }

    <ng-template #contenido>
      <header class="czp-head" [class.czp-head--compact]="!modoModalCompleto">
        <div class="czp-head-copy">
          <h2 id="czp-title">{{ titulo }}</h2>
          @if (modoModalCompleto) {
            <p class="czp-sub">{{ subtitulo }}</p>
          }
        </div>
        @if (!modoModalCompleto) {
          <div class="czp-head-meta">
            <span class="czp-pct">{{ progreso.porcentaje || 0 }}%</span>
            @if (progreso.total > 0) {
              <span class="czp-count">{{ progreso.hecho || 0 }} / {{ progreso.total }}</span>
            }
          </div>
        }
      </header>

      <div class="czp-body" [class.czp-body--compact]="!modoModalCompleto" role="status" aria-live="polite">
        <p class="czp-fase">{{ progreso.fase || 'Preparando…' }}</p>

        <div class="czp-track" aria-hidden="true">
          <div
            class="czp-fill"
            [class.czp-fill--pulse]="progreso.status === 'running' && progreso.porcentaje < 3"
            [style.width.%]="barraPct"></div>
        </div>

        @if (modoModalCompleto) {
          <div class="czp-meta">
            <span class="czp-pct">{{ progreso.porcentaje || 0 }}%</span>
            @if (progreso.total > 0) {
              <span class="czp-count">{{ progreso.hecho || 0 }} / {{ progreso.total }}</span>
            }
          </div>
        }

        @if (progreso.status === 'error' && progreso.message) {
          <p class="czp-error">{{ progreso.message }}</p>
        }
        @if (progreso.status === 'downloading') {
          <p class="czp-hint">Descargando archivo…</p>
        }
        @if (progreso.status === 'ready') {
          <p class="czp-hint">Archivo listo. Iniciando descarga…</p>
        }
        @if (progreso.status === 'running' && modoModalCompleto) {
          <p class="czp-hint">No cierre esta ventana hasta que termine.</p>
        }
      </div>

      @if (progreso.status === 'error' || modoModalCompleto) {
        <footer class="czp-foot" [class.czp-foot--compact]="!modoModalCompleto">
          @if (progreso.status === 'error') {
            <button type="button" class="primary" (click)="closed.emit()">Cerrar</button>
          } @else if (progreso.status === 'ready' || progreso.status === 'downloading') {
            <button type="button" class="ghost" disabled>Espere…</button>
          } @else if (modoModalCompleto) {
            <button type="button" class="ghost" disabled>Generando…</button>
          }
        </footer>
      }
    </ng-template>
  `,
  styles: [
    `
      .czp-layer {
        position: fixed;
        inset: 0;
        z-index: 12000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }

      .czp-layer--header {
        top: 76px;
        left: 0;
        right: 0;
        bottom: auto;
        align-items: flex-start;
        justify-content: stretch;
        padding: 0;
        pointer-events: none;
      }

      .czp-anchor {
        position: absolute;
        top: 0.65rem;
        left: 50%;
        right: auto;
        transform: translateX(-50%);
        z-index: 120;
        width: min(26rem, calc(100% - 2rem));
        pointer-events: none;
      }

      .czp-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(2, 6, 23, 0.72);
        backdrop-filter: blur(2px);
      }

      .czp-backdrop--anchor {
        position: fixed;
        inset: 0;
        z-index: -1;
        pointer-events: auto;
      }

      .czp-panel,
      .czp-inline {
        position: relative;
        color: #e2e8f0;
        overflow: hidden;
        border: 1px solid rgba(56, 189, 248, 0.28);
        background: linear-gradient(165deg, #0f172a 0%, #111827 100%);
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
      }

      .czp-panel {
        width: min(28rem, 100%);
        border-radius: 14px;
      }

      .czp-panel--anchor {
        width: 100%;
        pointer-events: auto;
      }

      .czp-panel--header {
        width: 100%;
        border-radius: 0;
        border-left: 0;
        border-right: 0;
        border-top: 0;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
        pointer-events: auto;
      }

      .czp-inline {
        width: 100%;
        border-radius: 12px;
        margin-top: 0.85rem;
      }

      .czp-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 1.1rem 1.25rem 0.75rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.15);
      }

      .czp-head--compact {
        padding: 0.75rem 1rem 0.55rem;
      }

      .czp-head-copy {
        min-width: 0;
        flex: 1;
      }

      .czp-head h2 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        color: #f8fafc;
      }

      .czp-head--compact h2 {
        font-size: 0.92rem;
      }

      .czp-sub {
        margin: 0.35rem 0 0;
        font-size: 0.8rem;
        color: #94a3b8;
      }

      .czp-head-meta {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        flex-shrink: 0;
        font-variant-numeric: tabular-nums;
      }

      .czp-body {
        padding: 1.15rem 1.25rem 0.85rem;
      }

      .czp-body--compact {
        padding: 0.55rem 1rem 0.75rem;
      }

      .czp-fase {
        margin: 0 0 0.65rem;
        font-size: 0.92rem;
        font-weight: 600;
        color: #bae6fd;
        min-height: 1.2rem;
      }

      .czp-body--compact .czp-fase {
        margin-bottom: 0.45rem;
        font-size: 0.82rem;
      }

      .czp-track {
        height: 12px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.18);
        overflow: hidden;
      }

      .czp-body--compact .czp-track {
        height: 10px;
      }

      .czp-fill {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #0284c7, #38bdf8 55%, #67e8f9);
        transition: width 0.35s ease;
        min-width: 2px;
      }

      .czp-fill--pulse {
        width: 35% !important;
        animation: czp-slide 1.2s ease-in-out infinite;
      }

      @keyframes czp-slide {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(280%);
        }
      }

      .czp-meta {
        display: flex;
        justify-content: space-between;
        margin-top: 0.55rem;
        font-size: 0.82rem;
        color: #94a3b8;
        font-variant-numeric: tabular-nums;
      }

      .czp-pct {
        font-weight: 700;
        color: #e2e8f0;
      }

      .czp-count {
        color: #94a3b8;
        font-size: 0.78rem;
      }

      .czp-error {
        margin: 0.65rem 0 0;
        padding: 0.55rem 0.7rem;
        border-radius: 8px;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(248, 113, 113, 0.35);
        color: #fecaca;
        font-size: 0.85rem;
      }

      .czp-hint {
        margin: 0.55rem 0 0;
        font-size: 0.78rem;
        color: #64748b;
      }

      .czp-foot {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem 1.1rem;
      }

      .czp-foot--compact {
        padding: 0 1rem 0.75rem;
      }

      .czp-foot .primary,
      .czp-foot .ghost {
        border-radius: 8px;
        padding: 0.45rem 0.9rem;
        font: 600 0.85rem/1.2 system-ui, sans-serif;
        cursor: pointer;
      }

      .czp-foot .primary {
        border: 0;
        background: #0284c7;
        color: #fff;
      }

      .czp-foot .ghost {
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: transparent;
        color: #94a3b8;
      }

      .czp-foot .ghost:disabled {
        cursor: default;
        opacity: 0.7;
      }

      @media (max-width: 900px) {
        .czp-anchor {
          position: fixed;
          top: 5rem;
          left: 50%;
          right: auto;
          transform: translateX(-50%);
          width: min(26rem, calc(100vw - 1.5rem));
        }
      }
    `,
  ],
})
export class CertificadosZipProgresoModalComponent {
  @Input() open = false;
  @Input() ubicacion: CertZipProgresoUbicacion = 'modal';
  @Input() titulo = 'Generando ZIP de certificados';
  @Input() subtitulo = 'PDFs individuales + archivo para imprimir todos';
  @Input() progreso: CertZipProgreso = {
    status: 'idle',
    fase: '',
    hecho: 0,
    total: 0,
    porcentaje: 0,
  };

  @Output() closed = new EventEmitter<void>();

  get modoModalCompleto(): boolean {
    return this.ubicacion === 'modal' || this.ubicacion === 'anchor';
  }

  get barraPct(): number {
    const p = Number(this.progreso?.porcentaje) || 0;
    return Math.max(0, Math.min(100, p));
  }
}
