// src/core/navigation/routes.ts -- Centraliza os caminhos tipados usados para navegar entre as telas do app.
import type { Href } from 'expo-router';

/**
 * Único lugar que conhece os caminhos do app (espelham o fluxograma aprovado).
 * Telas e componentes usam `routes.*` em vez de strings soltas.
 */
const withEmail = (pathname: string, email?: string): Href =>
  (email ? { pathname, params: { email } } : pathname) as Href;

export const routes = {
  // 1. Acesso e conta
  login: '/login' as Href,
  loginWith: (params: { email: string; verified?: string; reset?: string }) =>
    ({ pathname: '/login', params }) as Href,
  register: '/register' as Href,
  verifyEmail: (email?: string) => withEmail('/verify-email', email),
  forgotPassword: (email?: string) => withEmail('/forgot-password', email),
  resetPassword: (email?: string) => withEmail('/reset-password', email),

  // 2. Navegação principal
  home: '/' as Href,
  profile: '/profile' as Href,
  admin: '/admin' as Href,

  // 3. Salas, aparelhos e automações
  newRoom: '/rooms/new' as Href,
  room: (roomId: number) => `/rooms/${roomId}` as Href,
  editRoom: (roomId: number) => `/rooms/${roomId}/edit` as Href,
  roomAccess: (roomId: number) => `/rooms/${roomId}/access` as Href,
  device: (roomId: number, deviceId: number) => `/rooms/${roomId}/devices/${deviceId}` as Href,
  newAutomation: (roomId: number) => `/rooms/${roomId}/automations/new` as Href,
  automation: (roomId: number, automationId: number) =>
    `/rooms/${roomId}/automations/${automationId}` as Href,

  // 4. ESP32
  esp32List: '/admin/esp32' as Href,
  newEsp32: '/admin/esp32/new' as Href,
  /** continua o cadastro de um módulo que já existe (aparelhos que faltam) */
  addEsp32Devices: (esp32Id: number) =>
    ({ pathname: '/admin/esp32/new', params: { id: String(esp32Id) } }) as Href,
  esp32: (esp32Id: number) => `/admin/esp32/${esp32Id}` as Href,

  // 5. Usuários
  users: '/admin/users' as Href,
  user: (userId: number) => `/admin/users/${userId}` as Href,
} as const;
