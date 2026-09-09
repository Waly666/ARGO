import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  copiarTextoPortapapeles,
  promptImagenEfectivo,
} from '../../core/utils/portal-imagen-prompt.util';

@Component({
  selector: 'argo-portal-editor-imagen-prompt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-editor-imagen-prompt.component.html',
  styleUrl: './portal-editor-imagen-prompt.component.scss',
})
export class PortalEditorImagenPromptComponent {
  @Input() promptImagen = '';
  @Output() promptImagenChange = new EventEmitter<string>();
  @Input() alt = '';
  @Input() etiqueta = '';
  @Output() copied = new EventEmitter<void>();
  @Output() copyError = new EventEmitter<string>();

  copiado = signal(false);

  sugerenciaPrompt(): string {
    return promptImagenEfectivo({
      promptImagen: this.promptImagen,
      alt: this.alt,
      etiqueta: this.etiqueta,
    });
  }

  onPromptChange(value: string) {
    this.promptImagenChange.emit(value);
  }

  async copiar() {
    const text = this.sugerenciaPrompt();
    if (!text) {
      this.copyError.emit('No hay prompt para copiar');
      return;
    }
    if (await copiarTextoPortapapeles(text)) {
      this.copiado.set(true);
      this.copied.emit();
      window.setTimeout(() => this.copiado.set(false), 2000);
      return;
    }
    this.copyError.emit('No se pudo copiar. Seleccione el texto y use Ctrl+C.');
  }
}
