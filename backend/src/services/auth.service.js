import * as usersRepository from "../repositories/users.repository.js";
import { ApiError } from "../utils/errors.js";
import { sendVerificationCode } from "./mail.service.js";
import { hashPassword, verifyPassword } from "./password.service.js";
import { signAccessToken } from "./token.service.js";
import { sanitizeUser } from "./users.service.js";
import {
  assertCanSendCode,
  assertValidCodeState,
  buildVerificationPatch,
  clearVerificationFields,
  generateCode,
  hashCode,
} from "./verification.service.js";

export async function register(payload) {
  const existing = await usersRepository.findUserByEmail(payload.email);

  if (existing) return;

  const code = generateCode();
  const user = await usersRepository.createUser({
    name: payload.name,
    email: payload.email,
    password_hash: await hashPassword(payload.password),
    user_photo: payload.user_photo ?? null,
    ...buildVerificationPatch(code),
  });

  await sendVerificationCode({
    to: user.email,
    name: user.name,
    code,
    purpose: "email-verification",
  });

}

export async function verifyEmail(email, code) {
  const user = await usersRepository.findActiveUserByEmail(email);
  if (!user) throw invalidVerificationCode();

  if (user.is_email_verified) {
    return "Se os dados forem validos, a verificacao sera concluida.";
  }

  await consumeCodeOrFail(user, code);
  await usersRepository.updateUser(user.id, {
    is_email_verified: 1,
    ...clearVerificationFields(),
  });

  return "Se os dados forem validos, a verificacao sera concluida.";
}

export async function resendCode(email) {
  const user = await usersRepository.findActiveUserByEmail(email);
  if (!user || user.is_email_verified || !canSendCode(user)) return;

  const code = generateCode();
  await usersRepository.updateUser(user.id, buildVerificationPatch(code));

  await sendVerificationCode({
    to: user.email,
    name: user.name,
    code,
    purpose: "email-verification",
  });
}

export async function login(email, password) {
  const user = await usersRepository.findActiveUserByEmail(email);
  let passwordMatches = false;
  if (user) {
    passwordMatches = await verifyPassword(password, user.password_hash);
  } else {
    await hashPassword(password);
  }

  if (!user || !user.is_email_verified || !passwordMatches) {
    throw new ApiError(401, "E-mail ou senha invalidos.");
  }

  return {
    token: signAccessToken(user),
    user: sanitizeUser(user),
  };
}

export async function forgotPassword(email) {
  const user = await usersRepository.findActiveUserByEmail(email);
  if (!user || !user.is_email_verified || !canSendCode(user)) return;

  const code = generateCode();
  await usersRepository.updateUser(user.id, buildVerificationPatch(code));

  await sendVerificationCode({
    to: user.email,
    name: user.name,
    code,
    purpose: "password-reset",
  });
}

export async function resetPassword(email, code, password) {
  const user = await usersRepository.findActiveUserByEmail(email);
  if (!user || !user.is_email_verified) throw invalidVerificationCode();

  await consumeCodeOrFail(user, code);
  await usersRepository.updateUser(user.id, {
    password_hash: await hashPassword(password),
    ...clearVerificationFields(),
  });
}

async function consumeCodeOrFail(user, code) {
  assertValidCodeState(user);

  if (user.verification_code_hash !== hashCode(code)) {
    await usersRepository.incrementVerificationAttempts(user.id);
    throw invalidVerificationCode();
  }
}

function canSendCode(user) {
  try {
    assertCanSendCode(user);
    return true;
  } catch (error) {
    if (error.statusCode === 429) return false;
    throw error;
  }
}

function invalidVerificationCode() {
  return new ApiError(400, "Codigo invalido ou expirado.");
}
