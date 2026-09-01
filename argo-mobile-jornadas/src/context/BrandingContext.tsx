import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ImageSourcePropType } from 'react-native';

import { fetchConfigPublica } from '../api/brandingApi';
import { APP_BRANDING } from '../config/appBranding';
import { SERVIDOR_API_STORAGE_KEY, setRuntimeApiBase } from '../config/apiBase';
import { storeGet, storeSet } from '../storage/safeStore';
import { resolveUploadUrl } from '../utils/resolveUploadUrl';

const K_BRANDING = 'argo_jor_branding_v1';

type BrandingCache = {
  nombreEmpresa: string;
  urlLogo: string;
};

type BrandingCtx = {
  tituloApp: string;
  nombreEmpresa: string;
  logoSource: ImageSourcePropType;
  logoUri: string | null;
  loading: boolean;
  refreshBranding: () => Promise<void>;
};

const Ctx = createContext<BrandingCtx | null>(null);

function parseCache(raw: string | null): BrandingCache | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as BrandingCache;
    if (!o || typeof o !== 'object') return null;
    return {
      nombreEmpresa: String(o.nombreEmpresa ?? '').trim(),
      urlLogo: String(o.urlLogo ?? '').trim(),
    };
  } catch {
    return null;
  }
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [nombreEmpresa, setNombreEmpresa] = useState<string>(APP_BRANDING.nombreEmpresaFallback);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyBranding = useCallback((nombre: string, url: string) => {
    const nom = nombre.trim() || APP_BRANDING.nombreEmpresaFallback;
    const uri = url.trim();
    setNombreEmpresa(nom);
    setLogoUri(uri || null);
  }, []);

  const refreshBranding = useCallback(async () => {
    try {
      const cfg = await fetchConfigPublica();
      const nom = String(cfg.nombreEmpresa ?? '').trim();
      const uri = resolveUploadUrl(cfg.urlLogo);
      applyBranding(nom, uri);
      await storeSet(K_BRANDING, JSON.stringify({ nombreEmpresa: nom, urlLogo: uri }));
    } catch {
      /* mantener caché o valores por defecto */
    }
  }, [applyBranding]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const api = await storeGet(SERVIDOR_API_STORAGE_KEY);
        if (api) setRuntimeApiBase(api);

        const cached = parseCache(await storeGet(K_BRANDING));
        if (cached && !cancelled) {
          applyBranding(cached.nombreEmpresa, cached.urlLogo);
        }

        if (!cancelled) await refreshBranding();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyBranding, refreshBranding]);

  const logoSource = useMemo<ImageSourcePropType>(
    () => (logoUri ? { uri: logoUri } : APP_BRANDING.logo),
    [logoUri],
  );

  const value = useMemo(
    () => ({
      tituloApp: APP_BRANDING.tituloApp,
      nombreEmpresa,
      logoSource,
      logoUri,
      loading,
      refreshBranding,
    }),
    [nombreEmpresa, logoSource, logoUri, loading, refreshBranding],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBranding(): BrandingCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useBranding fuera de provider');
  return c;
}
