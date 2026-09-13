import crypto from "node:crypto";
import { env } from "../config/env.js";
import { addMinutes, nowIso, secondsSince } from "../utils/datetime.js";
import { ApiError } from "../utils/errors.js";

export function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function buildVerificationPatch(code) {
  const now = new Date();

  return {
    verification_code_hash: hashCode(code),
    verification_expires_at: addMinutes(now, env.VERIFICATION_CODE_TTL_MINUTES)
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z"),
    verification_attempts: 0,
    last_code_sent_at: nowIso()
  };
}

export function assertCanSendCode(user) {
  const elapsed = secondsSince(user.last_code_sent_at);

  if (elapsed < env.VERIFICATION_RESEND_COOLDOWN_SECONDS) {
    throw new ApiError(
      429,
      `Aguarde ${env.VERIFICATION_RESEND_COOLDOWN_SECONDS - elapsed}s antes de solicitar outro codigo.`
    );
  }
}

export function assertValidCodeState(user) {
  if (!user.verification_code_hash || !user.verification_expires_at) {
    throw new ApiError(400, "Nenhum codigo ativo para este usuario.");
  }

  if (new Date(user.verification_expires_at).getTime() < Date.now()) {
    throw new ApiError(400, "Codigo expirado. Solicite um novo codigo.");
  }

  if (user.verification_attempts >= env.MAX_VERIFICATION_ATTEMPTS) {
    throw new ApiError(429, "Limite de tentativas excedido. Solicite um novo codigo.");
  }
}

export function clearVerificationFields() {
  return {
    verification_code_hash: null,
    verification_expires_at: null,
    verification_attempts: 0
  };
}
