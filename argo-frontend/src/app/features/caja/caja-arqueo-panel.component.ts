import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ArqueoLinea } from '../../core/constants/caja-arqueo.constants';
import {
  lineasArqueoConSubtotal,
  totalArqueo,
} from '../../core/utils/caja-arqueo.helpers';

type FilaArqueo = ArqueoLinea & { idx: number; subtotal: number };

@Component({
  selector: 'argo-caja-arqueo-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './caja-arqueo-panel.component.html',
  styleUrls: ['./caja-arqueo-panel.component.scss'],
})
export class CajaArqueoPanelComponent {
  lineas = input<ArqueoLinea[]>([]);
  esperado = input<number | null>(null);
  lineasChange = output<ArqueoLinea[]>();

  filas = computed(() => lineasArqueoConSubtotal(this.lineas()));
  total = computed(() => totalArqueo(this.lineas()));
  diferencia = computed(() => {
    const esp = this.esperado();
    if (esp == null) return null;
    return this.total() - esp;
  });

  billetes = computed<FilaArqueo[]>(() =>
    this.filas()
      .map((l, idx) => ({ ...l, idx, subtotal: l.subtotal ?? 0 }))
      .filter((l) => l.tipo === 'billete'),
  );

  monedas = computed<FilaArqueo[]>(() =>
    this.filas()
      .map((l, idx) => ({ ...l, idx, subtotal: l.subtotal ?? 0 }))
      .filter((l) => l.tipo === 'moneda'),
  );

  piezasContadas = computed(() =>
    this.filas().reduce((s, l) => s + (Number(l.cantidad) || 0), 0),
  );

  hayConteo = computed(() => this.piezasContadas() > 0);

  estadoCuadre = computed<'sin_conteo' | 'cuadrado' | 'sobrante' | 'faltante' | 'sin_esperado'>(() => {
    if (!this.hayConteo()) return 'sin_conteo';
    const d = this.diferencia();
    if (d == null) return 'sin_esperado';
    if (d === 0) return 'cuadrado';
    return d > 0 ? 'sobrante' : 'faltante';
  });

  mensajeEstado = computed(() => {
    const est = this.estadoCuadre();
    const d = this.diferencia();
    if (est === 'sin_conteo') {
      return 'Empiece por los billetes de mayor valor. Escriba cuántos tiene de cada uno (deje en 0 los que no tenga).';
    }
    if (est === 'cuadrado') {
      return 'El efectivo contado coincide con el esperado. Puede cerrar la caja.';
    }
    if (est === 'sobrante' && d != null) {
      return `Hay más efectivo del esperado (sobrante). Revise el conteo o anote la diferencia al cerrar.`;
    }
    if (est === 'faltante' && d != null) {
      return `Falta efectivo respecto a lo esperado. Vuelva a contar o revise ingresos/egresos del turno.`;
    }
    return 'Total contado listo. Compárelo con el efectivo esperado del sistema.';
  });

  actualizarCantidad(idx: number, raw: string | number): void {
    const cantidad = Math.max(0, Math.round(Number(raw) || 0));
    const next = this.filas().map((l, i) =>
      i === idx ? { ...l, cantidad, subtotal: l.denominacion * cantidad } : l,
    );
    this.lineasChange.emit(next);
  }

  ajustar(idx: number, delta: number): void {
    const actual = Number(this.filas()[idx]?.cantidad) || 0;
    this.actualizarCantidad(idx, actual + delta);
  }

  limpiar(): void {
    this.lineasChange.emit(
      this.filas().map((l) => ({ ...l, cantidad: 0, subtotal: 0 })),
    );
  }

  onFocusCantidad(ev: FocusEvent): void {
    const el = ev.target as HTMLInputElement | null;
    el?.select();
  }
}
