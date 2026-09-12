import { Injectable, signal } from '@angular/core';

import {
  PortalIconografiaConfig,
  PORTAL_ICONOGRAFIA_DEFAULTS,
} from '../../core/constants/portal-icon-catalog.types';
import { mergePortalIconografia } from '../../core/utils/portal-icon-catalog.util';

@Injectable({ providedIn: 'root' })
export class PortalIconografiaService {
  readonly config = signal<PortalIconografiaConfig>({ ...PORTAL_ICONOGRAFIA_DEFAULTS });

  setConfig(raw?: Partial<PortalIconografiaConfig> | null): void {
    this.config.set(mergePortalIconografia(raw));
  }
}
