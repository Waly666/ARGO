import React, { useMemo } from 'react';

import { themeFromPortal } from '../theme/colors';

const ThemeContext = React.createContext(themeFromPortal());

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colors = useMemo(() => themeFromPortal(), []);

  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
