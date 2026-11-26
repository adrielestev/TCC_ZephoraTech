// src/app/(auth)/index.tsx -- Deslogado, a raiz do app (`/`) leva ao login. Logado, `/` é a aba Salas.
/**
 * Deslogado, a raiz do app (`/`) leva ao login. Logado, `/` é a aba Salas.
 * Enquanto a sessão é restaurada (splash) não navega, para não prender o app no login.
 */
import { Redirect } from 'expo-router';
import { useAuth } from '@/core/auth/AuthProvider';
import { routes } from '@/core/navigation/routes';


export default function AuthIndex() {
  const { status } = useAuth();
  if (status !== 'signedOut') return null;
  return <Redirect href={routes.login} />;
}
