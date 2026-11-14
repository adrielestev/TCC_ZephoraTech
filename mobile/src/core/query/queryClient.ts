import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import { getErrorStatus } from '@/core/api/errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      // Erros 4xx não melhoram ao repetir
      retry: (failureCount, error) => {
        const status = getErrorStatus(error);
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnReconnect: true,
    },
  },
});

/** No app nativo, "foco" significa app em primeiro plano. */
export function setupFocusManager() {
  if (Platform.OS === 'web') return () => undefined;
  const subscription = AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });
  return () => subscription.remove();
}
