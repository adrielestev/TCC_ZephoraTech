'use strict';

const path = require('node:path');
const { z } = require('zod');

const bool = (fallback) => z.enum(['true', 'false']).default(fallback).transform((v) => v === 'true');
const int = (fallback, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  z.coerce.number().int().min(min).max(max).default(fallback);

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: int(3333, 1, 65535),
    PUBLIC_URL: z.string().url().default('http://localhost:3333'),
    TRUST_PROXY: int(0, 0, 10),

    DB_PATH: z.string().default('./data/zephora.db'),
    UPLOAD_DIR: z.string().default('./uploads'),

    JWT_SECRET: z.string().min(32, 'deve ter ao menos 32 caracteres'),
    JWT_EXPIRES_IN: z.string().default('8h'),
    CODE_HMAC_SECRET: z.string().min(32, 'deve ter ao menos 32 caracteres'),
    BCRYPT_COST: int(12, 4, 15),

    CODE_TTL_MINUTES: int(10, 1, 60),
    CODE_MAX_ATTEMPTS: int(5, 1, 10),
    CODE_RESEND_COOLDOWN_SECONDS: int(60, 0, 3600),
    ALLOWED_EMAIL_DOMAINS: z.string().default(''),

    ESP32_OFFLINE_AFTER_SECONDS: int(60, 5),
    ESP32_POLL_INTERVAL_MS: int(3000, 500),

    RATE_LIMIT_ENABLED: bool('true'),
    RATE_LIMIT_MAX: int(600, 1),

    SMTP_HOST: z.string().optional(),
    SMTP_PORT: int(587, 1, 65535),
    SMTP_SECURE: bool('false'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().default('Zephora <no-reply@zephora.local>'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.SMTP_HOST) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['SMTP_HOST'], message: 'obrigatório em produção' });
    }
  });

// Variáveis vazias (ex.: "SMTP_HOST=") são tratadas como ausentes.
const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ''));
const result = schema.safeParse(raw);

if (!result.success) {
  const lines = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  throw new Error(`Configuração de ambiente inválida:\n${lines.join('\n')}`);
}

const list = (value) => value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

module.exports = Object.freeze({
  ...result.data,
  isProduction: result.data.NODE_ENV === 'production',
  DB_PATH: result.data.DB_PATH === ':memory:' ? ':memory:' : path.resolve(result.data.DB_PATH),
  UPLOAD_DIR: path.resolve(result.data.UPLOAD_DIR),
  PUBLIC_URL: result.data.PUBLIC_URL.replace(/\/+$/, ''),
  allowedEmailDomains: list(result.data.ALLOWED_EMAIL_DOMAINS),
});
