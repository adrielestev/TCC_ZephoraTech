import { api } from "./client";
import { Device, DeviceConfig, DeviceDirection, DeviceStateLabels, DeviceType } from "../types";

export interface DeviceInput {
  name: string;
  direction: DeviceDirection;
  type: DeviceType;
  pin: number;
  config_json?: DeviceConfig;
  state_labels_json?: DeviceStateLabels;
  value_unit?: string | null;
  current_state?: number;
}

export type DeviceUpdate = Partial<Omit<DeviceInput, "current_state">>;

export const devicesApi = {
  listForRoom: (roomId: number) => api.get<{ devices: Device[] }>(`/rooms/${roomId}/devices`),

  create: (roomId: number, data: DeviceInput) =>
    api.post<{ device: Device }>(`/rooms/${roomId}/devices`, data),

  update: (deviceId: number, data: DeviceUpdate) =>
    api.patch<{ device: Device }>(`/devices/${deviceId}`, data),

  remove: (deviceId: number) => api.delete(`/devices/${deviceId}`),

  command: (deviceId: number, value: number) =>
    api.post<{ device: Device }>(`/devices/${deviceId}/command`, { value }),
};
