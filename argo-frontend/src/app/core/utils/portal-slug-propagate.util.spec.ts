import { mergePortalLanding, PORTAL_LANDING_DEFAULTS } from '../constants/portal-landing-defaults';
import { mergePortalSiteDefaults } from '../constants/portal-site-defaults';
import {
  detectPortalSlugChanges,
  normalizePortalPath,
  propagatePortalSlugChanges,
  rewritePortalInternalUrl,
} from './portal-slug-propagate.util';

describe('portal-slug-propagate.util', () => {
  it('normaliza rutas internas del portal', () => {
    expect(normalizePortalPath('/foo/')).toBe('/foo');
    expect(normalizePortalPath('foo')).toBe('/foo');
    expect(normalizePortalPath('/')).toBe('/');
  });

  it('detecta cambios de slug entre dos snapshots de site', () => {
    const before = mergePortalSiteDefaults();
    const after = mergePortalSiteDefaults();
    after.paginas.mercanciasPeligrosas.ruta = '/mp-segura';
    const changes = detectPortalSlugChanges(before, after);
    expect(changes).toEqual([
      {
        paginaKey: 'mercanciasPeligrosas',
        from: '/mercancias-peligrosas',
        to: '/mp-segura',
      },
    ]);
  });

  it('reescribe URLs internas sin tocar enlaces externos', () => {
    const rules = [{ from: '/mercancias-peligrosas', to: '/mp-segura' }];
    expect(rewritePortalInternalUrl('/mercancias-peligrosas', rules).value).toBe('/mp-segura');
    expect(rewritePortalInternalUrl('/mercancias-peligrosas#modulos', rules).value).toBe(
      '/mp-segura#modulos',
    );
    expect(rewritePortalInternalUrl('https://example.com/x', rules).changed).toBe(false);
    expect(rewritePortalInternalUrl('mailto:a@b.co', rules).changed).toBe(false);
  });

  it('propaga ctaUrl y rutas legacy en landing al cambiar slug', () => {
    const landing = mergePortalLanding(PORTAL_LANDING_DEFAULTS);
    landing.mercanciasPeligrosas = {
      ...landing.mercanciasPeligrosas,
      ctaUrl: '/mercancias-peligrosas',
    };

    const result = propagatePortalSlugChanges({
      landing,
      acercaDeHtml: '<a href="/mercancias-peligrosas">Ver curso</a>',
      changes: [
        {
          paginaKey: 'mercanciasPeligrosas',
          from: '/mercancias-peligrosas',
          to: '/mp-segura',
        },
      ],
    });

    expect(result.landing.mercanciasPeligrosas.ctaUrl).toBe('/mp-segura');
    expect(result.acercaDeHtml).toContain('href="/mp-segura"');
    expect(result.totalReplacements).toBeGreaterThan(0);
  });
});
