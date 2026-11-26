// src/core/api/client.ts -- Configura o cliente HTTP da API e anexa credenciais às requisições.
import axios from 'axios';
import { env } from '@/core/config/env';

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});

let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Só encerra a sessão quando o token foi recusado (login errado também retorna 401)
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      error.response.data?.error?.code === 'INVALID_TOKEN' &&
      accessToken
    ) {
      onSessionExpired?.();
    }
    return Promise.reject(error);
  },
);
