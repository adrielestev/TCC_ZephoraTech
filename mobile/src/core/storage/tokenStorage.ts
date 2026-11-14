import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'zephora.access_token';

/**
 * Nativo: Keychain/Keystore via expo-secure-store.
 * Web: localStorage (não há armazenamento seguro no navegador).
 */
export const tokenStorage = {
  async get(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return window.localStorage.getItem(KEY);
      return await SecureStore.getItemAsync(KEY);
    } catch {
      return null;
    }
  },
  async set(token: string): Promise<void> {
    if (Platform.OS === 'web') window.localStorage.setItem(KEY, token);
    else await SecureStore.setItemAsync(KEY, token);
  },
  async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') window.localStorage.removeItem(KEY);
      else await SecureStore.deleteItemAsync(KEY);
    } catch {
      /* nada a limpar */
    }
  },
};
