import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";
import * as users from "../repositories/users.repository.js";
import * as passwordResets from "../repositories/password-reset.repository.js";
import { db } from "../db.js";
import { sendPasswordReset, sendVerification } from "./mail.service.js";

const hashCode = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");
const createCode = () =>
  String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
const expiresAt = () =>
  new Date(
    Date.now() + env.VERIFICATION_CODE_TTL_MINUTES * 60_000,
  ).toISOString();

export async function register({ name, email, password }) {
  email = email.trim().toLowerCase();
  const existing = await users.findByEmail(email);
  const now = new Date();
  if (
    existing &&
    (existing.is_email_verified ||
      existing.deleted_at ||
      (existing.last_code_sent_at &&
        now.getTime() - Date.parse(existing.last_code_sent_at) < 60_000))
  )
    return;
  const code = createCode();
  const credentials = {
    verification_code_hash: hashCode(code),
    verification_expires_at: expiresAt(),
    verification_attempts: 0,
    last_code_sent_at: now.toISOString(),
  };
  if (existing) {
    await users.updateUser(existing.id, credentials);
  } else {
    try {
      await users.createUser({
        name,
        email,
        password_hash: await bcrypt.hash(password, 12),
        user_photo: null,
        ...credentials,
      });
    } catch (error) {
      // Concurrent registrations of one address must keep the same public response.
      if (
        /unique constraint failed:\s*users\.email/i.test(error?.message || "")
      )
        return;
      throw error;
    }
  }
  await sendVerification(email, code);
}

export async function verifyEmail({ email, code }) {
  const user = await users.findByEmail(email.trim().toLowerCase());
  const attemptedHash = hashCode(code);
  const validHash =
    user?.verification_code_hash &&
    user.verification_code_hash.length === attemptedHash.length &&
    crypto.timingSafeEqual(
      Buffer.from(user.verification_code_hash),
      Buffer.from(attemptedHash),
    );
  if (
    !user ||
    user.deleted_at ||
    user.is_email_verified ||
    !validHash ||
    !user.verification_expires_at ||
    user.verification_expires_at < new Date().toISOString() ||
    user.verification_attempts >= 5
  ) {
    if (user && !user.is_email_verified && user.verification_attempts < 5)
      await users.incrementVerificationAttempts(user.id);
    throw new HttpError(400, "Código inválido ou expirado");
  }
  await users.updateUser(user.id, {
    is_email_verified: 1,
    verification_code_hash: null,
    verification_expires_at: null,
    verification_attempts: 0,
    updated_at: new Date().toISOString(),
  });
}

export async function resendCode(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await users.findByEmail(normalizedEmail);
  const canSend =
    user &&
    !user.is_email_verified &&
    !user.deleted_at &&
    (!user.last_code_sent_at ||
      Date.now() - Date.parse(user.last_code_sent_at) >= 60_000);
  if (canSend) {
    const code = createCode();
    await users.updateUser(user.id, {
      verification_code_hash: hashCode(code),
      verification_expires_at: expiresAt(),
      verification_attempts: 0,
      last_code_sent_at: new Date().toISOString(),
    });
    await sendVerification(user.email, code);
  }
}

export async function login({ email, password }) {
  const user = await users.findByEmail(email.trim().toLowerCase());
  if (
    !user ||
    user.deleted_at ||
    !(await bcrypt.compare(password, user.password_hash))
  )
    throw new HttpError(401, "E-mail ou senha inválidos");
  if (!user.is_email_verified)
    throw new HttpError(403, "Verifique seu e-mail antes de entrar");
  const token = jwt.sign({ id: user.id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  return { token, user };
}

export async function requestPasswordReset(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await users.findByEmail(normalizedEmail);
  if (!user || user.deleted_at || !user.is_email_verified) return;

  const code = createCode();
  const now = new Date();
  const expires = new Date(
    now.getTime() + env.PASSWORD_RESET_TTL_MINUTES * 60_000,
  );
  await db.transaction(async (transaction) => {
    await passwordResets.deleteForUser(user.id, transaction);
    await passwordResets.create(
      {
        user_id: user.id,
        token_hash: hashCode(code),
        expires_at: expires.toISOString(),
        attempts: 0,
      },
      transaction,
    );
  });

  try {
    await sendPasswordReset(user.email, code);
  } catch (error) {
    console.error("Falha ao enviar e-mail de recuperação de senha", error);
  }
}

export async function resetPassword({ email, code, password }) {
  const user = await users.findByEmail(email.trim().toLowerCase());
  const reset =
    user && !user.deleted_at && user.is_email_verified
      ? await passwordResets.findForUser(user.id)
      : null;
  const attemptedHash = hashCode(code);
  const validHash =
    reset?.token_hash &&
    reset.token_hash.length === attemptedHash.length &&
    crypto.timingSafeEqual(
      Buffer.from(reset.token_hash),
      Buffer.from(attemptedHash),
    );
  const now = new Date().toISOString();

  if (
    !user ||
    !reset ||
    !validHash ||
    reset.expires_at <= now ||
    reset.attempts >= 5
  ) {
    if (reset && reset.expires_at > now && reset.attempts < 5 && !validHash) {
      await passwordResets.incrementAttempts(user.id);
    }
    throw new HttpError(400, "Código inválido ou expirado");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.transaction(async (transaction) => {
    const consumed = await passwordResets.consume(
      user.id,
      attemptedHash,
      now,
      transaction,
    );
    if (!consumed) throw new HttpError(400, "Código inválido ou expirado");
    const updated = await users.updateUser(
      user.id,
      {
        password_hash: passwordHash,
        updated_at: now,
      },
      transaction,
    );
    if (!updated) throw new HttpError(400, "Código inválido ou expirado");
  });
}
