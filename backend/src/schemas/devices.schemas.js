import { z } from "zod";

export const deviceSchema = z.object({
  name: z.string().trim().min(1).max(100),
  direction: z.enum(["input", "output"]),
  type: z.enum(["relay", "pwm", "temperature", "presence", "contact"]),
  pin: z.number().int().min(0).max(48),
  config_json: z.record(z.unknown()).optional(),
  state_labels_json: z.record(z.string()).optional(),
  value_unit: z.string().max(20).nullable().optional(),
  current_state: z.number().finite().optional(),
}).strict();
export const updateDeviceSchema = deviceSchema.omit({ current_state: true }).partial()
  .refine((body) => Object.keys(body).length > 0, "Informe ao menos um campo para atualizar");
export const stateSchema = z.object({ value: z.number().finite() }).strict();
