"use strict";

const crypto = require("node:crypto");
const env = require("../config/env");

// Credencial do ESP32: 32–128 caracteres URL-safe (ex.: 32 bytes aleatórios em hex).
const CREDENTIAL_REGEX = /^[A-Za-z0-9_-]{32,128}$/;

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

/** Código numérico de 6 dígitos gerado com CSPRNG. */
const generateCode = () =>
  String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

/** HMAC do código, vinculado à finalidade e ao usuário (não serve para outro fluxo/usuário). */
const hmacCode = (kind, userId, code) =>
  crypto
    .createHmac("sha256", env.CODE_HMAC_SECRET)
    .update(`${kind}:${userId}:${code}`)
    .digest("hex");

const safeEqualHex = (a, b) => {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

/** Impressão digital do hash de senha: troca de senha invalida os JWTs antigos. */
const passwordFingerprint = (passwordHash) => sha256(passwordHash).slice(0, 16);

module.exports = {
  CREDENTIAL_REGEX,
  sha256,
  generateCode,
  hmacCode,
  safeEqualHex,
  passwordFingerprint,
};
