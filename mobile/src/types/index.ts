export type UserLevel = "ADMIN" | "USER";

export interface User {
  id: number;
  name: string;
  email: string;
  user_level: UserLevel;
  user_photo: string | null;
}

export interface Room {
  id: number;
  name: string;
  classroom_code: string;
  mac_address: string;
  /** Só vem preenchido para ADMIN. Indica se o ESP32 da sala já tem credencial gerada. */
  has_device_credential?: boolean;
  last_seen_at: string | null;
  room_photo_1: string | null;
  room_photo_2: string | null;
  room_photo_3: string | null;
}

export interface Collaborator {
  id: number;
  user_id: number;
  room_id: number;
  name?: string;
  email?: string;
}

export type SensorDirection = "INPUT" | "OUTPUT";
export type SensorControlType = "DIGITAL" | "ANALOGICO";
export type SensorType = "RELE" | "SERVO" | "PWM" | "REED_SWITCH";

export interface Sensor {
  id: number;
  room_id: number;
  name: string;
  device_key: string;
  direction: SensorDirection;
  type: SensorType;
  type_of_control: SensorControlType;
  pin: number;
  pin_pwm: number | null;
  current_state: number;
}

export type RoomPhotoSlot = 1 | 2 | 3;
