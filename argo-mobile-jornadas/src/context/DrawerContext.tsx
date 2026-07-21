import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type DrawerCtx = {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

const Ctx = createContext<DrawerCtx | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openDrawer = useCallback(() => setOpen(true), []);
  const closeDrawer = useCallback(() => setOpen(false), []);
  const toggleDrawer = useCallback(() => setOpen((v) => !v), []);
  const value = useMemo(
    () => ({ open, openDrawer, closeDrawer, toggleDrawer }),
    [open, openDrawer, closeDrawer, toggleDrawer],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDrawer(): DrawerCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useDrawer debe usarse dentro de DrawerProvider');
  }
  return ctx;
}
