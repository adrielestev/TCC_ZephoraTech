// src/core/types.ts -- Tipos das respostas da API do Zephora

export type Role = 'owner' | 'admin' | 'member';
export type DeviceType = 'light' | 'presence_sensor' | 'temperature_sensor';
export type DeviceState = Record<string, boolean | number>;
export type DeviceExecutionConfig = {
  holdMs?: number;
  warmupMs?: number;
};
export type Esp32Status = 'pending' | 'online' | 'offline';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface RoomPhoto {
  slot: number;
  url: string;
}

export interface Room {
  id: number;
  name: string;
  description: string | null;
  photos: RoomPhoto[];
  deviceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: number;
  esp32Id: number;
  roomId: number | null;
  name: string;
  type: DeviceType;
  channel: string;
  registrationStatus: 'discovered' | 'registered';
  controllable: boolean;
  desiredState: DeviceState | null;
  currentState: DeviceState | null;
  executionConfig: DeviceExecutionConfig | null;
  stateUpdatedAt: string | null;
  esp32Status: Esp32Status;
}

export interface Automation {
  id: number;
  roomId: number;
  name: string;
  isPaused: boolean;
  pausedBy: number | null;
  pausedAt: string | null;
  triggers: { deviceId: number; condition: DeviceState }[];
  actions: { deviceId: number; state: DeviceState }[];
  createdAt: string;
  updatedAt: string;
}

export interface Esp32Module {
  id: number;
  name: string | null;
  credentialHint: string | null;
  status: Esp32Status;
  firmwareVersion: string | null;
  lastSeenAt: string | null;
  registeredDevices: number;
  discoveredDevices: number;
  createdAt: string;
}

export interface Esp32Detail extends Esp32Module {
  devices: Device[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}
