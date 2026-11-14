import { api } from '@/core/api/client';
import { buildImageFormData } from '@/core/api/upload';
import type { Paginated, User } from '@/core/types';
import type { ImagePickerAsset } from 'expo-image-picker';

const PAGE_SIZE = 20;

export const usersApi = {
  PAGE_SIZE,
  list: (params: { q?: string; offset: number }) =>
    api
      .get<Paginated<User>>('/users', { params: { q: params.q || undefined, limit: PAGE_SIZE, offset: params.offset } })
      .then((r) => r.data),
  get: (id: number) => api.get<User>(`/users/${id}`).then((r) => r.data),
  changeRole: (id: number, role: 'admin' | 'member') =>
    api.patch<User>(`/users/${id}/role`, { role }).then((r) => r.data),
  changeStatus: (id: number, isActive: boolean) =>
    api.patch<User>(`/users/${id}/status`, { isActive }).then((r) => r.data),
  getRooms: (id: number) => api.get<{ roomIds: number[] }>(`/users/${id}/rooms`).then((r) => r.data.roomIds),
  setRooms: (id: number, roomIds: number[]) =>
    api.put<{ roomIds: number[] }>(`/users/${id}/rooms`, { roomIds }).then((r) => r.data.roomIds),

  // perfil do próprio usuário
  updateMe: (name: string) => api.patch<User>('/users/me', { name }).then((r) => r.data),
  setMyAvatar: async (asset: ImagePickerAsset) =>
    api.put<User>('/users/me/avatar', await buildImageFormData('avatar', asset)).then((r) => r.data),
  removeMyAvatar: () => api.delete<User>('/users/me/avatar').then((r) => r.data),
};
