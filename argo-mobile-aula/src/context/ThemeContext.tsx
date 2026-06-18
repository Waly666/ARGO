import React, { createContext, useContext } from 'react';

import { usePortalConfig } from './PortalConfigContext';
import { themeFromPortal } from '../theme/colors';

const ThemeContext = createContext(themeFromPortal({
  colorPrimario: '#1565c0',
  colorPrimarioOscuro: '#0d47a1',
  colorAcento: '#00acc1',
  colorFondo: '#f5f7fa',
  colorSuperficie: '#ffffff',
  colorTexto: '#1a237e',
  colorTextoSecundario: '#5c6bc0',
}));

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { tema } = usePortalConfig();
  const colors = themeFromPortal(tema);
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
