import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'argo-form-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-modal.component.html',
  styleUrls: ['./form-modal.component.scss'],
})
export class FormModalComponent implements OnChanges {
  @Input({ required: true }) open = false;
  @Input({ required: true }) title = '';
  @Input() wide = false;
  /** Modal ancho completo (~1280px) para formularios densos. */
  @Input() xwide = false;
  /** Formulario alto: ancla arriba y usa casi toda la altura del viewport. */
  @Input() tall = false;
  @Input() subtitle = '';
  /** Distancia desde arriba del viewport (px). Si no se pasa, se usa el valor por defecto del CSS. */
  @Input() anchorTopPx: number | null = null;

  @Output() closed = new EventEmitter<void>();

  @ViewChild('panel') panelRef?: ElementRef<HTMLElement>;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open']?.currentValue || changes['anchorTopPx'] || changes['tall']) {
      setTimeout(() => this.syncPanelMaxHeight());
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.open) this.close();
  }

  @HostListener('window:resize')
  onResize() {
    this.syncPanelMaxHeight();
  }

  close() {
    this.closed.emit();
  }

  layerTopPx(): number {
    if (this.tall) return 36;
    return this.anchorTopPx ?? 168;
  }

  /** Recalcula altura máxima del panel según espacio disponible bajo el ancla. */
  syncPanelMaxHeight() {
    if (!this.open || !this.panelRef) return;
    const top = this.layerTopPx();
    const bottom = this.tall ? 12 : 16;
    const maxH = Math.max(240, window.innerHeight - top - bottom);
    this.panelRef.nativeElement.style.maxHeight = `${maxH}px`;
  }
}
