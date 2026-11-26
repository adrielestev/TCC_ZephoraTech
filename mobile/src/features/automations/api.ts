// src/features/automations/api.ts -- Define os dados e as chamadas da API para consultar e gerenciar automações.
import { api } from '@/core/api/client';
import type { Automation, DeviceState } from '@/core/types';

export interface NewAutomation {
  roomId: number;
  name: string;
  triggers: { deviceId: number; condition: DeviceState }[];
  actions: { deviceId: number; state: DeviceState }[];
}

export const automationsApi = {
  listByRoom: (roomId: number) =>
    api
      .get<{ data: Automation[] }>('/automations', { params: { roomId } })
      .then((r) => r.data.data),
  create: (body: NewAutomation) => api.post<Automation>('/automations', body).then((r) => r.data),
  rename: (id: number, name: string) =>
    api.patch<Automation>(`/automations/${id}`, { name }).then((r) => r.data),
  setPaused: (id: number, paused: boolean) =>
    api.put<Automation>(`/automations/${id}/pause`, { paused }).then((r) => r.data),
  remove: (id: number) => api.delete(`/automations/${id}`),
};
