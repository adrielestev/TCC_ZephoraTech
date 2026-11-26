// src/core/config/env.ts -- Resolve a URL da API a partir das configurações e do endereço do ambiente Expo.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const port = 3333;

function getExpoHost(): string | undefined {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return undefined;
  return hostUri.split(':')[0];
}

function getDefaultApiUrl(): string {
  if (Platform.OS === 'web') {
    return `http://localhost:${port}`;
  }

  if (Platform.OS === 'android' && !Constants.isDevice) {
    return `http://10.0.2.2:${port}`;
  }

  if (Platform.OS === 'ios' && !Constants.isDevice) {
    return `http://localhost:${port}`;
  }

  const host = getExpoHost();
  return host ? `http://${host}:${port}` : `http://localhost:${port}`;
}

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const apiUrl = (configuredApiUrl || getDefaultApiUrl()).replace(/\/+$/, '');

export const env = {
  apiUrl,
  apiBaseUrl: `${apiUrl}/api`,
} as const;
