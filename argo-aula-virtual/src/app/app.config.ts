import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideIcons } from '@ng-icons/core';

import { routes } from './app.routes';
import { PORTAL_ICON_SET } from './shared/portal-icon/portal-icon.registry';
import { PortalConfigService } from './core/portal-config.service';
import { portalAuthInterceptor } from './core/interceptors/portal-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(withInterceptors([portalAuthInterceptor])),
    provideIcons(PORTAL_ICON_SET),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (portalConfig: PortalConfigService) => () => portalConfig.init(),
      deps: [PortalConfigService],
    },
  ],
};
