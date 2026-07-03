import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { fetchMe, login as apiLogin, setTokenGetter } from '../api/client';
import {
  DEFAULT_API_BASE,
  isLegacyDefaultServer,
  setRuntimeApiBase,
  normalizeApiBaseUrl,
  SERVIDOR_API_STORAGE_KEY,
} from '../config/apiBase';
import { storeDelete, storeGet, storeSet } from '../storage/safeStore';
import type { AuthUser } from '../api/types';
import { withTimeout } from '../utils/timeout';
import { puedeOperarJornadas } from '../utils/permisos';

const K_TOKEN = 'argo_jor_token';
const K_USER = 'argo_jor_user';

type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; token: string; user: AuthUser }
  | { status: 'denied'; user: AuthUser };

type AuthCtx = {
  state: AuthState;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setServidor: (apiBase: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const bootstrapped = useRef(false);

  useEffect(() => {
    setTokenGetter(() => (state.status === 'signedIn' ? state.token : null));
  }, [state]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    let cancelled = false;
    const safety = setTimeout(() => {
      if (!cancelled) setState((s) => (s.status === 'loading' ? { status: 'signedOut' } : s));
    }, 4000);

    void (async () => {
      try {
        const api = await storeGet(SERVIDOR_API_STORAGE_KEY);
        if (api && !isLegacyDefaultServer(api)) {
          setRuntimeApiBase(api);
        } else {
          setRuntimeApiBase(DEFAULT_API_BASE);
          if (api && isLegacyDefaultServer(api)) {
            void storeSet(SERVIDOR_API_STORAGE_KEY, DEFAULT_API_BASE);
          }
        }

        const token = await storeGet(K_TOKEN);
        const userRaw = await storeGet(K_USER);
        if (cancelled) return;

        if (!token || !userRaw) {
          setState({ status: 'signedOut' });
          return;
        }

        let user: AuthUser;
        try {
          user = JSON.parse(userRaw) as AuthUser;
        } catch {
          await storeDelete(K_TOKEN);
          await storeDelete(K_USER);
          setState({ status: 'signedOut' });
          return;
        }

        if (!puedeOperarJornadas(user.permisos)) {
          setState({ status: 'denied', user });
          return;
        }

        setState({ status: 'signedIn', token, user });

        try {
          const me = await withTimeout(fetchMe(), 8000, 'validar sesión');
          if (cancelled) return;
          if (!puedeOperarJornadas(me.permisos)) {
            await storeDelete(K_TOKEN);
            await storeDelete(K_USER);
            setState({ status: 'denied', user: me });
            return;
          }
          await storeSet(K_USER, JSON.stringify(me));
          setState({ status: 'signedIn', token, user: me });
        } catch {
          if (cancelled) return;
          await storeDelete(K_TOKEN);
          await storeDelete(K_USER);
          setState({ status: 'signedOut' });
        }
      } catch {
        if (!cancelled) setState({ status: 'signedOut' });
      } finally {
        clearTimeout(safety);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(safety);
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const res = await apiLogin(username, password);
    const user = res.user;
    if (!user) {
      throw new Error('El servidor no devolvió datos del usuario.');
    }
    if (!puedeOperarJornadas(user.permisos)) {
      setState({ status: 'denied', user });
      throw new Error(
        'Su usuario no tiene permiso para operar jornadas. Pida «jornadas.operar» a un administrador.',
      );
    }
    setState({ status: 'signedIn', token: res.token, user });
    void storeSet(K_TOKEN, res.token);
    void storeSet(K_USER, JSON.stringify(user));
  }, []);

  const signOut = useCallback(async () => {
    setState({ status: 'signedOut' });
    void storeDelete(K_TOKEN);
    void storeDelete(K_USER);
  }, []);

  const setServidor = useCallback(async (apiBase: string) => {
    const norm = normalizeApiBaseUrl(apiBase.trim());
    if (!norm) return;
    setRuntimeApiBase(norm);
    await storeSet(SERVIDOR_API_STORAGE_KEY, norm);
  }, []);

  const value = useMemo(
    () => ({ state, signIn, signOut, setServidor }),
    [state, signIn, signOut, setServidor],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fuera de provider');
  return c;
}
