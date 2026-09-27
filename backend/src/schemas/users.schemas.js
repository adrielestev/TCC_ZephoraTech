import { z } from "zod";

export const updateMeSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  user_photo: z.string().url().nullable().optional(),
});

export const updateUserLevelSchema = z.object({
  user_level: z.enum(["USER", "ADMIN"]),
});

export const listUsersQuerySchema = z.object({
  q: z.string().trim().min(2).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
