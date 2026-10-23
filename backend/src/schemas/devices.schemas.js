import { z } from "zod";
import { SUPPORTED_DEVICE_TYPES } from "../domain/device-drivers.js";

const legacyDeviceTypes = ["pwm", "temperature", "contact"];
const allDeviceTypes = [...new Set([...SUPPORTED_DEVICE_TYPES, ...legacyDeviceTypes])];
const deviceFields = {
  name: z.string().trim().min(1).max(100),
  direction: z.enum(["input", "output"]),
  pin: z.number().int().min(0).max(48),
  config_json: z.record(z.unknown()).optional(),
  state_labels_json: z.record(z.string()).optional(),
  value_unit: z.string().max(20).nullable().optional(),
  current_state: z.number().finite().optional(),
};

export const deviceSchema = z.object({
  ...deviceFields,
  type: z.enum(SUPPORTED_DEVICE_TYPES),
}).strict();

// Existing databases may contain devices from types not yet implemented by
// the ESP32. Keep those records editable without allowing new unsupported ones.
export const updateDeviceSchema = z.object({
  ...deviceFields,
  type: z.enum(allDeviceTypes),
}).omit({ current_state: true }).partial().strict()
  .refine((body) => Object.keys(body).length > 0, "Informe ao menos um campo para atualizar");
export const stateSchema = z.object({ value: z.number().finite() }).strict();
