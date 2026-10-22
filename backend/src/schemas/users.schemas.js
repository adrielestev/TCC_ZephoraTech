import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
}).strict().refine((body) => Object.keys(body).length > 0, "Informe ao menos um campo para atualizar");
export const updateRoleSchema = z.object({ user_level: z.enum(["user", "admin"]) }).strict();
