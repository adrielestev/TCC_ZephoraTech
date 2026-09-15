import * as usersRepository from "../repositories/users.repository.js";
import { nowIso } from "../utils/datetime.js";
import { notFound } from "../utils/errors.js";
import * as fileStorage from "./file-storage.service.js";

export function sanitizeUser(user) {
  const {
    password_hash: _passwordHash,
    verification_code_hash: _verificationCodeHash,
    verification_expires_at: _verificationExpiresAt,
    verification_attempts: _verificationAttempts,
    last_code_sent_at: _lastCodeSentAt,
    ...safeUser
  } = user;

  return safeUser;
}

export async function updateMe(userId, payload) {
  const user = await usersRepository.updateUser(userId, payload);
  return sanitizeUser(user);
}

export async function updateMyPhoto(userId, file) {
  const user = await usersRepository.findActiveUserById(userId);
  if (!user) throw notFound("Usuario");

  const photoUrl = await fileStorage.saveImage(file, "users");
  await usersRepository.updateUserPhoto(userId, photoUrl);
  await fileStorage.removeImage(user.user_photo);

  return sanitizeUser({ ...user, user_photo: photoUrl });
}

export async function removeMyPhoto(userId) {
  const user = await usersRepository.findActiveUserById(userId);
  if (!user) throw notFound("Usuario");

  await usersRepository.updateUserPhoto(userId, null);
  await fileStorage.removeImage(user.user_photo);
}

export function listUsers() {
  return usersRepository.listUsers();
}

export async function updateUserLevel(userId, userLevel) {
  const user = await usersRepository.updateActiveUser(userId, {
    user_level: userLevel,
  });

  if (!user) {
    throw notFound("Usuario");
  }

  return sanitizeUser(user);
}

export async function softDeleteUser(userId) {
  const updated = await usersRepository.softDeleteUser(userId, nowIso());

  if (!updated) {
    throw notFound("Usuario");
  }
}
