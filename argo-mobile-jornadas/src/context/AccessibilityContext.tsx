import React, { createContext, useContext, useMemo } from 'react';

type Ctx = {
  textMultiplier: number;
  buttonMultiplier: number;
  highContrast: boolean;
  boldText: boolean;
};

const A11yCtx = createContext<Ctx>({
  textMultiplier: 1,
  buttonMultiplier: 1,
  highContrast: false,
  boldText: false,
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<Ctx>(
    () => ({
      textMultiplier: 1,
      buttonMultiplier: 1,
      highContrast: false,
      boldText: false,
    }),
    [],
  );
  return <A11yCtx.Provider value={value}>{children}</A11yCtx.Provider>;
}

export function useAccessibility(): Ctx {
  return useContext(A11yCtx);
}
