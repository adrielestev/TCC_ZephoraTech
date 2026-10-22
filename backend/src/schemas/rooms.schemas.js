import { z } from "zod";

export const roomSchema = z.object({
  name: z.string().trim().min(1).max(100),
  mac_address: z.string().trim().regex(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/).transform((value) => value.toUpperCase()),
}).strict();
export const updateRoomSchema = roomSchema.partial().refine((body) => Object.keys(body).length > 0, "Informe ao menos um campo para atualizar");
