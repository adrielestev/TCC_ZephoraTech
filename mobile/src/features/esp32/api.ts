// src/features/esp32/api.ts -- Define os dados e as chamadas da API para registrar e gerenciar módulos ESP32.
import { api } from '@/core/api/client';
import type { Esp32Detail, Esp32Module } from '@/core/types';

export interface DeviceRegistration {
  deviceId: number;
  roomId: number;
  name?: string;
}

export const esp32Api = {
  list: () => api.get<{ data: Esp32Module[] }>('/esp32').then((r) => r.data.data),
  get: (id: number) => api.get<Esp32Detail>(`/esp32/${id}`).then((r) => r.data),
  register: (body: { credential: string; name?: string }) =>
    api.post<Esp32Module>('/esp32', body).then((r) => r.data),
  registerDevices: (id: number, devices: DeviceRegistration[]) =>
    api.post<Esp32Detail>(`/esp32/${id}/devices`, { devices }).then((r) => r.data),
  remove: (id: number) => api.delete(`/esp32/${id}`),
};
