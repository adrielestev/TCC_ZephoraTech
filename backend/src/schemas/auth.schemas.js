import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  user_photo: z.string().url().nullable().optional()
});

export const emailSchema = z.object({
  email: z.string().trim().email().toLowerCase()
});

export const codeSchema = emailSchema.extend({
  code: z.string().regex(/^\d{6}$/)
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

export const resetPasswordSchema = codeSchema.extend({
  password: z.string().min(8).max(128)
});
