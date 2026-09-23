import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';

import { AULA_GUIA_TOUR_STEPS, AulaGuiaPanelKey, AulaGuiaTourStep } from './aula-guia-tour.steps';

@Component({
  selector: 'av-aula-guia-tour',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aula-guia-tour.component.html',
  styleUrl: './aula-guia-tour.component.scss',
})
export class AulaGuiaTourComponent implements AfterViewInit, OnDestroy, OnChanges {
  private platformId = inject(PLATFORM_ID);
  private host = inject(ElementRef<HTMLElement>);

  @Input({ required: true }) open = false;
  @Output() closed = new EventEmitter<'done' | 'skip'>();
  @Output() panelChange = new EventEmitter<AulaGuiaPanelKey>();

  readonly steps = AULA_GUIA_TOUR_STEPS;
  stepIndex = signal(0);

  spotlight = signal<{ top: number; left: number; width: number; height: number } | null>(null);
  cardStyle = signal<{ top: string; left: string; transform: string }>({
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  });

  private repositionTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly onLayout = () => this.scheduleReposition();

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.addEventListener('resize', this.onLayout);
    window.addEventListener('scroll', this.onLayout, true);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.removeEventListener('resize', this.onLayout);
    window.removeEventListener('scroll', this.onLayout, true);
    if (this.repositionTimer) clearTimeout(this.repositionTimer);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.stepIndex.set(0);
      this.applyStep(0);
    }
  }

  currentStep(): AulaGuiaTourStep {
    return this.steps[this.stepIndex()] ?? this.steps[0];
  }

  isFirst(): boolean {
    return this.stepIndex() <= 0;
  }

  isLast(): boolean {
    return this.stepIndex() >= this.steps.length - 1;
  }

  close(skipped = true): void {
    this.closed.emit(skipped ? 'skip' : 'done');
  }

  back(): void {
    if (this.isFirst()) return;
    this.applyStep(this.stepIndex() - 1);
  }

  next(): void {
    if (this.isLast()) {
      this.close(false);
      return;
    }
    this.applyStep(this.stepIndex() + 1);
  }

  private applyStep(index: number): void {
    const step = this.steps[index];
    if (!step) return;
    if (step.panel) {
      this.panelChange.emit(step.panel);
    }
    this.stepIndex.set(index);
    this.scheduleReposition(120);
  }

  private scheduleReposition(delayMs = 0): void {
    if (this.repositionTimer) clearTimeout(this.repositionTimer);
    this.repositionTimer = setTimeout(() => this.reposition(), delayMs);
  }

  private reposition(): void {
    if (!this.open || !isPlatformBrowser(this.platformId)) return;

    const step = this.currentStep();
    const root = this.host.nativeElement.closest('.aula-dashboard') as HTMLElement | null;
    const scope = root ?? document.body;

    if (!step.target) {
      this.spotlight.set(null);
      this.cardStyle.set({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      return;
    }

    const el = scope.querySelector(`[data-aula-tour="${step.target}"]`) as HTMLElement | null;
    if (!el) {
      this.spotlight.set(null);
      this.cardStyle.set({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      return;
    }

    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });

    const pad = 8;
    const rect = el.getBoundingClientRect();
    this.spotlight.set({
      top: Math.max(8, rect.top - pad),
      left: Math.max(8, rect.left - pad),
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });

    const cardW = 360;
    const cardH = 220;
    let top = rect.bottom + 16;
    let left = rect.left + rect.width / 2;
    let transform = 'translate(-50%, 0)';

    if (top + cardH > window.innerHeight - 12) {
      top = rect.top - 16;
      transform = 'translate(-50%, -100%)';
    }
    if (left - cardW / 2 < 12) {
      left = cardW / 2 + 12;
    }
    if (left + cardW / 2 > window.innerWidth - 12) {
      left = window.innerWidth - cardW / 2 - 12;
    }

    this.cardStyle.set({
      top: `${Math.max(12, top)}px`,
      left: `${left}px`,
      transform,
    });
  }
}
