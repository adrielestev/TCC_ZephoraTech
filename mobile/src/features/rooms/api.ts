// src/features/rooms/api.ts -- Define os dados e as chamadas da API para consultar e gerenciar salas.
import { api } from '@/core/api/client';
import { buildImageFormData } from '@/core/api/upload';
import type { Room, User } from '@/core/types';
import type { ImagePickerAsset } from 'expo-image-picker';

export interface RoomInput {
  name: string;
  description?: string | null;
}

export const roomsApi = {
  list: () => api.get<{ data: Room[] }>('/rooms').then((r) => r.data.data),
  get: (id: number) => api.get<Room>(`/rooms/${id}`).then((r) => r.data),
  create: (body: RoomInput) => api.post<Room>('/rooms', body).then((r) => r.data),
  update: (id: number, body: Partial<RoomInput>) =>
    api.patch<Room>(`/rooms/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/rooms/${id}`),
  setPhoto: async (id: number, slot: number, asset: ImagePickerAsset) =>
    api
      .put<Room>(`/rooms/${id}/photos/${slot}`, await buildImageFormData('photo', asset))
      .then((r) => r.data),
  removePhoto: (id: number, slot: number) =>
    api.delete<Room>(`/rooms/${id}/photos/${slot}`).then((r) => r.data),
  listAccess: (id: number) =>
    api.get<{ data: User[] }>(`/rooms/${id}/access`).then((r) => r.data.data),
};
