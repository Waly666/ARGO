import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';

import { routes } from './app.routes';
import { PORTAL_ICON_SET } from './shared/portal-icon/portal-icon.registry';
import { PortalConfigService } from './core/portal-config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideIcons(PORTAL_ICON_SET),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (portalConfig: PortalConfigService) => () => portalConfig.init(),
      deps: [PortalConfigService],
    },
  ],
};
