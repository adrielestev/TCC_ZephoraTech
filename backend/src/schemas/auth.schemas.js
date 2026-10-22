import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(128),
  })
  .strict();
export const emailSchema = z
  .object({ email: z.string().trim().email() })
  .strict();
export const verifyEmailSchema = z
  .object({
    email: z.string().trim().email(),
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();
export const loginSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(1).max(128),
  })
  .strict();
export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email().max(254),
    code: z.string().regex(/^\d{6}$/),
    password: z.string().min(8).max(128),
  })
  .strict();
