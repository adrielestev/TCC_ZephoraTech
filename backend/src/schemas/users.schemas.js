import { z } from "zod";

export const updateMeSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  user_photo: z.string().url().nullable().optional(),
});

export const updateUserLevelSchema = z.object({
  user_level: z.enum(["USER", "ADMIN"]),
});
