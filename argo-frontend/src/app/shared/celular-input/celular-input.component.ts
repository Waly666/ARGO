import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  PAISES_CELULAR,
  PAIS_CELULAR_DEFAULT,
  type CelularInputModo,
  celularToStorage,
  formatearCelularLocal,
  limitarDigitosLocal,
  parseCelularAlmacenado,
  validarCelularLocal,
} from '../../core/utils/celular.util';

@Component({
  selector: 'argo-celular-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './celular-input.component.html',
  styleUrl: './celular-input.component.scss',
})
export class CelularInputComponent implements OnChanges {
  @Input({ required: true }) value = '';
  @Input() placeholder = '300 123 4567';
  /** celular: móvil CO empieza por 3. telefono: fijo o móvil (7–10 dígitos en CO). */
  @Input() modo: CelularInputModo = 'celular';
  @Output() valueChange = new EventEmitter<string>();

  readonly paises = PAISES_CELULAR;

  paisIso = PAIS_CELULAR_DEFAULT;
  localDigits = '';
  touched = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.syncFromValue(this.value);
    }
  }

  get localDisplay(): string {
    return formatearCelularLocal(this.paisIso, this.localDigits);
  }

  get maxLength(): number {
    const p = this.paises.find((x) => x.iso === this.paisIso);
    if (!p) return 12;
    if (p.iso === 'CO') return 12; // 3+1+3+1+4 con espacios
    return p.maxLocal + Math.floor(p.maxLocal / 3);
  }

  get errorMensaje(): string | null {
    if (!this.touched && !this.localDigits) return null;
    const v = validarCelularLocal(this.paisIso, this.localDigits, this.modo);
    return v.valid ? null : v.mensaje || 'Número inválido.';
  }

  get esInvalido(): boolean {
    return !!this.errorMensaje;
  }

  onPaisChange(iso: string): void {
    this.paisIso = iso || PAIS_CELULAR_DEFAULT;
    this.localDigits = limitarDigitosLocal(this.paisIso, this.localDigits);
    this.emit();
  }

  onLocalInput(raw: string): void {
    this.touched = true;
    this.localDigits = limitarDigitosLocal(this.paisIso, raw);
    this.emit();
  }

  onBlur(): void {
    this.touched = true;
  }

  private syncFromValue(raw: string): void {
    const parsed = parseCelularAlmacenado(raw);
    this.paisIso = parsed.iso;
    this.localDigits = parsed.local;
  }

  private emit(): void {
    this.valueChange.emit(celularToStorage(this.paisIso, this.localDigits));
  }
}
