import { api } from '@/core/api/client';
import type { Device, DeviceExecutionConfig, DeviceState } from '@/core/types';

export const devicesApi = {
  listByRoom: (roomId: number) =>
    api.get<{ data: Device[] }>('/devices', { params: { roomId } }).then((r) => r.data.data),
  setState: (id: number, state: DeviceState) =>
    api.put<Device>(`/devices/${id}/state`, { state }).then((r) => r.data),
  update: (
    id: number,
    body: { name?: string; roomId?: number; executionConfig?: DeviceExecutionConfig },
  ) => api.patch<Device>(`/devices/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/devices/${id}`),
};
