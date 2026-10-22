import { z } from "zod";

export const photoSlotParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  slot: z.coerce.number().int().min(1).max(3),
});
export const mediaParamsSchema = z.object({
  filename: z.string().regex(/^[a-f0-9-]{36}\.(jpg|png|webp)$/),
});
