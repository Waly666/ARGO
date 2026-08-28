import { useMemo } from 'react';

import { APP_BRANDING } from '../config/appBranding';
import { usePortalConfig } from '../context/PortalConfigContext';
import { resolvePortalLogoUrl } from '../utils/uploadUrl';

export function usePortalBranding() {
  const { config, loading: configLoading } = usePortalConfig();

  return useMemo(() => {
    const nombreEmpresa = config?.nombreCea?.trim() || APP_BRANDING.nombreEmpresaFallback;
    const tituloApp = APP_BRANDING.tituloApp;
    const logoUrl = resolvePortalLogoUrl(config?.urlLogoAbsoluta || config?.urlLogo);
    const logoSource = logoUrl ? null : APP_BRANDING.logo;
    const inicial = nombreEmpresa.charAt(0).toUpperCase() || 'S';

    return {
      config,
      loading: configLoading && !config,
      configLoading,
      tituloApp,
      nombreEmpresa,
      logoSource,
      logoUrl,
      inicial,
      telefonoWhatsapp: config?.telefonoWhatsapp?.trim() || config?.telefono?.trim() || null,
    };
  }, [config, configLoading]);
}
