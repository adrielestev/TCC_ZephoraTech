import { z } from "zod";
import { idSchema } from "./common.schemas.js";

export const automationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  source_sensor_id: idSchema,
  operator: z.enum(["eq", "ne", "gt", "gte", "lt", "lte"]),
  comparison_value: z.number().finite(),
  target_sensor_id: idSchema,
  target_value: z.number().finite(),
  restore_previous: z.boolean().optional(),
  is_enabled: z.boolean().optional(),
  cooldown_seconds: z.number().int().min(0).max(86400).optional(),
}).strict();
export const updateAutomationSchema = automationSchema.partial().refine((body) => Object.keys(body).length > 0, "Informe ao menos um campo para atualizar");
