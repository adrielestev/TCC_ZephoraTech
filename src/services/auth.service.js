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
  hashCode
} from "./verification.service.js";

export async function register(payload) {
  const existing = await usersRepository.findUserByEmail(payload.email);

  if (existing && !existing.deleted_at) {
    throw new ApiError(409, "E-mail ja cadastrado.");
  }

  const code = generateCode();
  const user = await usersRepository.createUser({
    name: payload.name,
    email: payload.email,
    password_hash: await hashPassword(payload.password),
    user_photo: payload.user_photo ?? null,
    ...buildVerificationPatch(code)
  });

  await sendVerificationCode({
    to: user.email,
    name: user.name,
    code,
    purpose: "email-verification"
  });

  return sanitizeUser(user);
}

export async function verifyEmail(email, code) {
  const user = await findActiveUserByEmailOrFail(email);

  if (user.is_email_verified) {
    return "E-mail ja verificado.";
  }

  await consumeCodeOrFail(user, code);
  await usersRepository.updateUser(user.id, {
    is_email_verified: 1,
    ...clearVerificationFields()
  });

  return "E-mail verificado com sucesso.";
}

export async function resendCode(email) {
  const user = await findActiveUserByEmailOrFail(email);

  if (user.is_email_verified) {
    throw new ApiError(400, "E-mail ja verificado.");
  }

  assertCanSendCode(user);
  const code = generateCode();
  await usersRepository.updateUser(user.id, buildVerificationPatch(code));

  await sendVerificationCode({
    to: user.email,
    name: user.name,
    code,
    purpose: "email-verification"
  });
}

export async function login(email, password) {
  const user = await findActiveUserByEmailOrFail(email);

  if (!user.is_email_verified) {
    throw new ApiError(403, "Verifique seu e-mail antes de entrar.");
  }

  const passwordMatches = await verifyPassword(password, user.password_hash);
  if (!passwordMatches) {
    throw new ApiError(401, "E-mail ou senha invalidos.");
  }

  return {
    token: signAccessToken(user),
    user: sanitizeUser(user)
  };
}

export async function forgotPassword(email) {
  const user = await findActiveUserByEmailOrFail(email);

  if (!user.is_email_verified) {
    throw new ApiError(403, "E-mail ainda nao verificado.");
  }

  assertCanSendCode(user);
  const code = generateCode();
  await usersRepository.updateUser(user.id, buildVerificationPatch(code));

  await sendVerificationCode({
    to: user.email,
    name: user.name,
    code,
    purpose: "password-reset"
  });
}

export async function resetPassword(email, code, password) {
  const user = await findActiveUserByEmailOrFail(email);

  if (!user.is_email_verified) {
    throw new ApiError(403, "E-mail ainda nao verificado.");
  }

  await consumeCodeOrFail(user, code);
  await usersRepository.updateUser(user.id, {
    password_hash: await hashPassword(password),
    ...clearVerificationFields()
  });
}

async function findActiveUserByEmailOrFail(email) {
  const user = await usersRepository.findActiveUserByEmail(email);

  if (!user) {
    throw new ApiError(404, "Usuario nao encontrado.");
  }

  return user;
}

async function consumeCodeOrFail(user, code) {
  assertValidCodeState(user);

  if (user.verification_code_hash !== hashCode(code)) {
    await usersRepository.incrementVerificationAttempts(user.id);
    throw new ApiError(400, "Codigo invalido.");
  }
}
