import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().default("./zephora.sqlite"),
  JWT_SECRET: z.string().min(16).default("dev-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  APP_NAME: z.string().default("Zephora"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().min(1).default("uploads"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .transform((value) => value === "true")
    .default("false"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  MAIL_FROM: z.string().default("Zephora <no-reply@zephora.local>"),
  VERIFICATION_CODE_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  VERIFICATION_RESEND_COOLDOWN_SECONDS: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(60),
  MAX_VERIFICATION_ATTEMPTS: z.coerce.number().int().positive().default(5),
  INITIAL_ADMIN_NAME: z.string().default("Administrador"),
  INITIAL_ADMIN_EMAIL: z.string().email().default("admin@zephora.local"),
  INITIAL_ADMIN_PASSWORD: z.string().min(8).default("Admin@123456"),
});

export const env = envSchema.parse(process.env);
