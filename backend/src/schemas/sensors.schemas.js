import { z } from "zod";
import { deviceKeySchema, macAddressSchema } from "./common.schemas.js";

export const sensorSchema = z.object({
  room_id: z.coerce.number().int().positive(),
  name: z.string().trim().min(2).max(120),
  device_key: deviceKeySchema,
  direction: z.enum(["INPUT", "OUTPUT"]),
  type: z.enum(["RELE", "SERVO", "PWM", "REED_SWITCH"]),
  type_of_control: z.enum(["DIGITAL", "ANALOGICO"]),
  pin: z.coerce.number().int().min(0).max(39),
  pin_pwm: z.coerce.number().int().min(0).max(39).nullable().optional(),
  current_state: z.coerce.number().min(0).max(100).optional(),
});

export const updateSensorSchema = sensorSchema
  .omit({ room_id: true })
  .partial();

export const commandSchema = z.object({
  current_state: z.coerce.number().min(0).max(100),
});

export const espStateSchema = z.object({
  mac_address: macAddressSchema,
  current_state: z.coerce.number().min(0).max(100),
});
