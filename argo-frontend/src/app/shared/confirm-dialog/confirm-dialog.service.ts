import { Injectable, signal } from '@angular/core';

import {
  ConfirmDialogState,
  ConfirmIcon,
  ConfirmOptions,
  ConfirmVariant,
} from './confirm-dialog.types';

const DEFAULT_LABELS: Record<ConfirmVariant, { confirm: string; cancel: string }> = {
  danger: { confirm: 'Sí, eliminar', cancel: 'Cancelar' },
  primary: { confirm: 'Aceptar', cancel: 'Cancelar' },
  success: { confirm: 'Confirmar', cancel: 'Cancelar' },
  warn: { confirm: 'Continuar', cancel: 'Cancelar' },
};

const DEFAULT_ICONS: Record<ConfirmVariant, ConfirmIcon> = {
  danger: 'delete',
  primary: 'info',
  success: 'check',
  warn: 'warning',
};

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly state = signal<ConfirmDialogState | null>(null);

  private resolver: ((value: boolean) => void) | null = null;

  open(options: ConfirmOptions): Promise<boolean> {
    const variant = options.variant ?? 'primary';
    const defaults = DEFAULT_LABELS[variant];
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
      this.state.set({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? defaults.confirm,
        cancelLabel: options.cancelLabel ?? defaults.cancel,
        variant,
        icon: options.icon ?? DEFAULT_ICONS[variant],
      });
    });
  }

  confirm(): void {
    this.finish(true);
  }

  cancel(): void {
    this.finish(false);
  }

  private finish(value: boolean): void {
    this.state.set(null);
    const r = this.resolver;
    this.resolver = null;
    r?.(value);
  }
}
