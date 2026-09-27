import { api } from "./client";
import { Sensor, SensorType } from "../types";

export const sensorsApi = {
  list: () => api.get<{ sensors: Sensor[] }>("/sensors"),

  get: (sensorId: number) => api.get<{ sensor: Sensor }>(`/sensors/${sensorId}`),

  create: (data: {
    room_id: number;
    name: string;
    device_key: string;
    direction: Sensor["direction"];
    type: SensorType;
    type_of_control: "DIGITAL" | "ANALOGICO";
    pin: number;
    pin_pwm?: number | null;
    current_state?: number;
  }) => api.post<{ sensor: Sensor }>("/sensors", data),

  update: (sensorId: number, data: Partial<Sensor>) =>
    api.patch<{ sensor: Sensor }>(`/sensors/${sensorId}`, data),

  command: (sensorId: number, current_state: number) =>
    api.post<{ sensor: Sensor }>(`/sensors/${sensorId}/command`, { current_state }),

  remove: (sensorId: number) => api.delete(`/sensors/${sensorId}`),
};
