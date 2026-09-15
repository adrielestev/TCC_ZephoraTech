import { z } from "zod";

export const collaboratorSchema = z.object({
  user_id: z.coerce.number().int().positive(),
});
