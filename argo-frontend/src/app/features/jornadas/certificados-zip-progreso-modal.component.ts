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

@Component({
  selector: 'argo-certificados-zip-progreso-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="czp-layer" role="presentation">
        <div class="czp-backdrop"></div>
        <div
          class="czp-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="czp-title"
          (click)="$event.stopPropagation()">
          <header class="czp-head">
            <h2 id="czp-title">Generando ZIP de certificados</h2>
            <p class="czp-sub">PDFs individuales + archivo para imprimir todos</p>
          </header>

          <div class="czp-body" role="status" aria-live="polite">
            <p class="czp-fase">{{ progreso.fase || 'Preparando…' }}</p>

            <div class="czp-track" aria-hidden="true">
              <div
                class="czp-fill"
                [class.czp-fill--pulse]="progreso.status === 'running' && progreso.porcentaje < 3"
                [style.width.%]="barraPct"></div>
            </div>

            <div class="czp-meta">
              <span class="czp-pct">{{ progreso.porcentaje || 0 }}%</span>
              @if (progreso.total > 0) {
                <span class="czp-count">{{ progreso.hecho || 0 }} / {{ progreso.total }}</span>
              }
            </div>

            @if (progreso.status === 'error' && progreso.message) {
              <p class="czp-error">{{ progreso.message }}</p>
            }
            @if (progreso.status === 'downloading') {
              <p class="czp-hint">Descargando archivo…</p>
            }
            @if (progreso.status === 'ready') {
              <p class="czp-hint">ZIP listo. Iniciando descarga…</p>
            }
            @if (progreso.status === 'running') {
              <p class="czp-hint">No cierre esta ventana hasta que termine.</p>
            }
          </div>

          <footer class="czp-foot">
            @if (progreso.status === 'error') {
              <button type="button" class="primary" (click)="closed.emit()">Cerrar</button>
            } @else if (progreso.status === 'ready' || progreso.status === 'downloading') {
              <button type="button" class="ghost" disabled>Espere…</button>
            } @else {
              <button type="button" class="ghost" disabled>Generando…</button>
            }
          </footer>
        </div>
      </div>
    }
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
      .czp-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(2, 6, 23, 0.72);
        backdrop-filter: blur(2px);
      }
      .czp-panel {
        position: relative;
        width: min(28rem, 100%);
        border-radius: 14px;
        background: linear-gradient(165deg, #0f172a 0%, #111827 100%);
        border: 1px solid rgba(56, 189, 248, 0.28);
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
        color: #e2e8f0;
        overflow: hidden;
      }
      .czp-head {
        padding: 1.1rem 1.25rem 0.75rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.15);
      }
      .czp-head h2 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        color: #f8fafc;
      }
      .czp-sub {
        margin: 0.35rem 0 0;
        font-size: 0.8rem;
        color: #94a3b8;
      }
      .czp-body {
        padding: 1.15rem 1.25rem 0.85rem;
      }
      .czp-fase {
        margin: 0 0 0.85rem;
        font-size: 0.92rem;
        font-weight: 600;
        color: #bae6fd;
        min-height: 1.35rem;
      }
      .czp-track {
        height: 12px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.18);
        overflow: hidden;
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
      .czp-error {
        margin: 0.85rem 0 0;
        padding: 0.55rem 0.7rem;
        border-radius: 8px;
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(248, 113, 113, 0.35);
        color: #fecaca;
        font-size: 0.85rem;
      }
      .czp-hint {
        margin: 0.75rem 0 0;
        font-size: 0.78rem;
        color: #64748b;
      }
      .czp-foot {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem 1.1rem;
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
    `,
  ],
})
export class CertificadosZipProgresoModalComponent {
  @Input() open = false;
  @Input() progreso: CertZipProgreso = {
    status: 'idle',
    fase: '',
    hecho: 0,
    total: 0,
    porcentaje: 0,
  };

  @Output() closed = new EventEmitter<void>();

  get barraPct(): number {
    const p = Number(this.progreso?.porcentaje) || 0;
    return Math.max(0, Math.min(100, p));
  }
}
