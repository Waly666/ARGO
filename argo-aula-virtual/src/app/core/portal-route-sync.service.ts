import { inject, Injectable } from '@angular/core';
import { Route, Router } from '@angular/router';

import { PortalConfig } from './models';
import {
  finstruvialHubSegmentFromConfig,
  normalizePortalPageSlug,
  portalPageDefaultRoute,
  portalPageRoute,
} from './portal-page-route.util';
import type { PortalPaginaKey } from './portal-site';

const ALIAS_PAGE_KEYS: PortalPaginaKey[] = [
  'tienda',
  'cursos',
  'acerca',
  'fundacion',
  'consultaCertificados',
  'cursosConduccion',
  'examenTeorico',
  'mercanciasPeligrosas',
  'trabajoEnAlturas',
  'manejoDefensivo',
  'primerosAuxilios',
  'blog',
  'galeria',
  'pqr',
  'jornadasCapacitacion',
  'evaluacionJornadas',
];

@Injectable({ providedIn: 'root' })
export class PortalRouteSyncService {
  private router = inject(Router);

  sync(config: PortalConfig | null | undefined): void {
    const shell = this.router.config.find((r) => r.path === '');
    if (!shell?.children) return;

    const baseChildren = shell.children.filter((r) => !r.data?.['portalAlias']);
    const aliases = this.buildAliasRoutes(baseChildren, config);
    const nextShell: Route = {
      ...shell,
      children: [...baseChildren, ...aliases],
    };
    const nextConfig = this.router.config.map((r) => (r.path === '' ? nextShell : r));
    this.router.resetConfig(nextConfig);
  }

  private buildAliasRoutes(baseChildren: Route[], config: PortalConfig | null | undefined): Route[] {
    const out: Route[] = [];
    const seenPaths = new Set(baseChildren.map((r) => r.path).filter(Boolean) as string[]);

    const cloneRoute = (path: string, source: Route): Route => ({
      path,
      canActivate: source.canActivate,
      canMatch: source.canMatch,
      data: { ...(source.data || {}), portalAlias: true },
      loadComponent: source.loadComponent,
      loadChildren: source.loadChildren,
      component: source.component,
      children: source.children,
    });

    const addAlias = (path: string, source: Route, redirectFrom?: string) => {
      const seg = path.trim();
      if (!seg || seenPaths.has(seg)) return;
      seenPaths.add(seg);
      out.push(cloneRoute(seg, source));
      if (redirectFrom && redirectFrom !== seg && !seenPaths.has(redirectFrom)) {
        seenPaths.add(redirectFrom);
        out.push({
          path: redirectFrom,
          redirectTo: seg,
          pathMatch: 'full',
          data: { portalAlias: true },
        });
      }
    };

    for (const key of ALIAS_PAGE_KEYS) {
      const customSeg = normalizePortalPageSlug(portalPageRoute(config, key).replace(/^\//, ''));
      const defaultSeg = normalizePortalPageSlug(portalPageDefaultRoute(key).replace(/^\//, ''));
      if (!customSeg || customSeg === defaultSeg) continue;
      const source = baseChildren.find((r) => r.path === defaultSeg);
      if (!source) continue;
      addAlias(customSeg, source, defaultSeg);
    }

    const hubSeg = finstruvialHubSegmentFromConfig(config);
    const hubSource = baseChildren.find((r) => r.path === 'servicios');
    const lineSource = baseChildren.find((r) => r.path === 'servicios/:slug');
    if (hubSource && hubSeg !== 'servicios') {
      addAlias(hubSeg, hubSource, 'servicios');
      if (lineSource) {
        const linePath = `${hubSeg}/:slug`;
        if (!seenPaths.has(linePath)) {
          seenPaths.add(linePath);
          out.push(cloneRoute(linePath, lineSource));
        }
        if (!seenPaths.has('servicios/:slug')) {
          seenPaths.add('servicios/:slug');
          out.push({
            path: 'servicios/:slug',
            redirectTo: `${hubSeg}/:slug`,
            data: { portalAlias: true },
          });
        }
      }
    }

    return out;
  }
}
