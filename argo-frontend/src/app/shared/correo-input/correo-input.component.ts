import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { mensajeErrorCorreoAlmacenado, normalizarCorreo } from '../../core/utils/correo.util';

@Component({
  selector: 'argo-correo-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './correo-input.component.html',
  styleUrl: './correo-input.component.scss',
})
export class CorreoInputComponent implements OnChanges {
  @Input({ required: true }) value = '';
  @Input() placeholder = 'correo@ejemplo.com';
  @Input() required = false;
  @Output() valueChange = new EventEmitter<string>();

  localValue = '';
  touched = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.localValue = normalizarCorreo(this.value);
    }
  }

  get errorMensaje(): string | null {
    if (!this.touched && !this.localValue) {
      return this.required ? 'El correo es obligatorio.' : null;
    }
    if (this.required && !this.localValue.trim()) {
      return 'El correo es obligatorio.';
    }
    return mensajeErrorCorreoAlmacenado(this.localValue);
  }

  get esInvalido(): boolean {
    return !!this.errorMensaje;
  }

  onInput(raw: string): void {
    this.touched = true;
    this.localValue = raw;
    this.emit();
  }

  onBlur(): void {
    this.touched = true;
    this.localValue = normalizarCorreo(this.localValue);
    this.emit();
  }

  private emit(): void {
    this.valueChange.emit(normalizarCorreo(this.localValue));
  }
}
