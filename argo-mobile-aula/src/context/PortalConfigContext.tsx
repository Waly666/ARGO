import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchPortalConfig } from '../api/aulaApi';
import type { PortalConfig, PortalTemaConfig } from '../api/types';

const DEFAULT_TEMA: PortalTemaConfig = {
  colorPrimario: '#1565c0',
  colorPrimarioOscuro: '#0d47a1',
  colorAcento: '#00acc1',
  colorFondo: '#f5f7fa',
  colorSuperficie: '#ffffff',
  colorTexto: '#1a237e',
  colorTextoSecundario: '#5c6bc0',
};

type PortalConfigContextValue = {
  config: PortalConfig | null;
  tema: PortalTemaConfig;
  loading: boolean;
  refresh: () => Promise<void>;
};

const PortalConfigContext = createContext<PortalConfigContextValue | null>(null);

export function PortalConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const c = await fetchPortalConfig();
      setConfig(c);
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const tema = config?.site?.tema ?? DEFAULT_TEMA;

  const value = useMemo(
    () => ({ config, tema, loading, refresh }),
    [config, tema, loading, refresh],
  );

  return <PortalConfigContext.Provider value={value}>{children}</PortalConfigContext.Provider>;
}

export function usePortalConfig(): PortalConfigContextValue {
  const ctx = useContext(PortalConfigContext);
  if (!ctx) throw new Error('usePortalConfig outside provider');
  return ctx;
}
