import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().default("./data/zephora.sqlite"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().default("12h"),
  DEVICE_JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  HTTPS_KEY_FILE: z.string().optional(),
  HTTPS_CERT_FILE: z.string().optional(),
  VERIFICATION_CODE_TTL_MINUTES: z.coerce
    .number()
    .int()
    .min(1)
    .max(1440)
    .default(15),
  PASSWORD_RESET_TTL_MINUTES: z.coerce
    .number()
    .int()
    .min(1)
    .max(60)
    .default(15),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: z.enum(["true", "false"]).default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("Zephora <no-reply@zephora.local>"),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  const details = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Configuração de ambiente inválida: ${details}`);
}
if (
  Boolean(result.data.HTTPS_KEY_FILE) !== Boolean(result.data.HTTPS_CERT_FILE)
) {
  throw new Error("Configure HTTPS_KEY_FILE e HTTPS_CERT_FILE juntos");
}

export const env = Object.freeze({
  ...result.data,
  corsOrigins: result.data.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
});
