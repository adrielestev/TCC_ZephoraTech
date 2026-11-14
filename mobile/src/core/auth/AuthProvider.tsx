import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setAccessToken, setSessionExpiredHandler } from '@/core/api/client';
import { queryClient } from '@/core/query/queryClient';
import { tokenStorage } from '@/core/storage/tokenStorage';
import type { User } from '@/core/types';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: Status;
  user: User | null;
  isAdmin: boolean;
  isOwner: boolean;
  /** true quando a sessão foi encerrada por expiração (para avisar o usuário) */
  sessionExpired: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User) => void;
  dismissSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const clearSession = useCallback(async () => {
    setAccessToken(null);
    await tokenStorage.clear();
    queryClient.clear();
    setUser(null);
    setStatus('signedOut');
  }, []);

  // Restaura a sessão ao abrir o app (Splash: GET /auth/me)
  useEffect(() => {
    let active = true;
    (async () => {
      const token = await tokenStorage.get();
      if (!token) return active && setStatus('signedOut');
      setAccessToken(token);
      try {
        const { data } = await api.get<User>('/auth/me');
        if (!active) return;
        setUser(data);
        setStatus('signedIn');
      } catch {
        if (active) await clearSession();
      }
    })();
    return () => {
      active = false;
    };
  }, [clearSession]);

  // Qualquer tela que receba 401 (token recusado) volta ao login
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setSessionExpired(true);
      void clearSession();
    });
    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  const signIn = useCallback(async (token: string, nextUser: User) => {
    setAccessToken(token);
    await tokenStorage.set(token);
    setSessionExpired(false);
    setUser(nextUser);
    setStatus('signedIn');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAdmin: user?.role === 'owner' || user?.role === 'admin',
      isOwner: user?.role === 'owner',
      sessionExpired,
      signIn,
      signOut: clearSession,
      setUser,
      dismissSessionExpired: () => setSessionExpired(false),
    }),
    [status, user, sessionExpired, signIn, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

/** Para telas que só existem para usuários logados. */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('Usuário não autenticado');
  return user;
}
