export type UserLevel = "admin" | "user";

export interface User {
  id: number;
  name: string;
  email: string;
  user_level: UserLevel;
  is_email_verified?: boolean | number;
  user_photo: string | null;
  created_at?: string;
}

export interface Room {
  id: number;
  name: string;
  mac_address?: string | null;
  has_device_credential?: boolean;
  last_seen_at?: string | null;
  room_photo_1: string | null;
  room_photo_2: string | null;
  room_photo_3: string | null;
}

export interface Collaborator {
  id: number;
  user_id: number;
  room_id: number;
  name: string;
  email: string;
  created_at?: string;
}

export type DeviceDirection = "input" | "output";
export type DeviceType = "relay" | "pwm" | "temperature" | "presence" | "contact";
export type DeviceConfig = Record<string, unknown>;
export type DeviceStateLabels = Record<string, string>;

export interface Device {
  id: number;
  room_id: number;
  name: string;
  direction: DeviceDirection;
  type: DeviceType;
  pin?: number | null;
  value_unit?: string | null;
  current_state: number | null;
  desired_state: number | null;
  config?: DeviceConfig;
  state_labels?: DeviceStateLabels;
  automation_lock?: { id: number; name: string } | null;
  updated_at?: string;
}

export type AutomationOperator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte";

export interface AutomationRule {
  id: number;
  name: string;
  source_sensor_id: number;
  operator: AutomationOperator;
  comparison_value: number;
  target_sensor_id: number;
  target_value: number;
  restore_previous: boolean | number;
  is_active: boolean | number;
  previous_target_value: number | null;
  is_enabled: boolean | number;
  cooldown_seconds: number;
}

export type RoomPhotoSlot = 1 | 2 | 3;
