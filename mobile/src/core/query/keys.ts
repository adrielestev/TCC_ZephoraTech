// src/core/query/keys.ts -- Chaves das consultas (invalidar "rooms" também atualiza ["rooms", id]).
/** Chaves das consultas (invalidar "rooms" também atualiza ["rooms", id]). */
export const qk = {
  rooms: ['rooms'] as const,
  room: (id: number) => ['rooms', id] as const,
  roomAccess: (id: number) => ['roomAccess', id] as const,
  devices: (roomId: number) => ['devices', roomId] as const,
  automations: (roomId: number) => ['automations', roomId] as const,
  users: (search: string) => ['users', search] as const,
  user: (id: number) => ['user', id] as const,
  userRooms: (id: number) => ['userRooms', id] as const,
  esp32List: ['esp32'] as const,
  esp32: (id: number) => ['esp32', id] as const,
};
