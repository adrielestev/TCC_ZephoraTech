"use strict";

const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const env = require("../../config/env");
const AppError = require("../errors");

const make = (options) =>
  rateLimit({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => !env.RATE_LIMIT_ENABLED,
    handler: (_req, _res, next) =>
      next(
        new AppError(
          429,
          "TOO_MANY_REQUESTS",
          "Muitas requisições. Tente novamente em instantes.",
        ),
      ),
    ...options,
  });

const emailKey = (req) =>
  `${ipKeyGenerator(req.ip)}|${String(req.body?.email ?? "")
    .toLowerCase()
    .slice(0, 254)}`;

const limiters = {
  // Geral, por IP (o polling dos ESP32 é tratado à parte)
  global: make({ windowMs: 60_000, limit: env.RATE_LIMIT_MAX }),
  // Login e cadastro, por IP
  auth: make({ windowMs: 15 * 60_000, limit: 100 }),
  // Login, códigos e redefinição, por IP + e-mail (evita bloquear uma escola inteira atrás do mesmo IP)
  authByEmail: make({
    windowMs: 15 * 60_000,
    limit: 10,
    keyGenerator: emailKey,
  }),
  // ESP32 com credencial inválida: só falhas contam
  esp32Failures: make({
    windowMs: 15 * 60_000,
    limit: 60,
    skipSuccessfulRequests: true,
  }),
  // ESP32 autenticado: por módulo
  esp32: make({
    windowMs: 60_000,
    limit: 120,
    keyGenerator: (req) => `esp32:${req.esp32?.id}`,
  }),
};

// O limitador global não se aplica ao endpoint de sincronização dos ESP32
limiters.globalExceptSync = (req, res, next) =>
  req.path.startsWith("/device-sync")
    ? next()
    : limiters.global(req, res, next);

module.exports = limiters;
