import * as usersRepository from "../repositories/users.repository.js";
import { nowIso } from "../utils/datetime.js";
import { ApiError, notFound } from "../utils/errors.js";
import * as fileStorage from "./file-storage.service.js";

export function sanitizeUser(user) {
  const {
    password_hash: _passwordHash,
    verification_code_hash: _verificationCodeHash,
    verification_expires_at: _verificationExpiresAt,
    verification_attempts: _verificationAttempts,
    last_code_sent_at: _lastCodeSentAt,
    deleted_at: _deletedAt,
    ...safeUser
  } = user;

  return {
    ...safeUser,
    user_photo: fileStorage.createSignedMediaUrl(safeUser.user_photo),
  };
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

export async function listUsers(filters) {
  const users = await usersRepository.listUsers(filters);
  return users.map(sanitizeUser);
}

export async function updateUserLevel(actorId, userId, userLevel) {
  if (actorId === userId && userLevel !== "ADMIN") {
    throw new ApiError(
      403,
      "Você não pode remover seus próprios privilégios de administrador.",
    );
  }

  const currentUser = await usersRepository.findActiveUserById(userId);
  if (!currentUser) {
    throw notFound("Usuário");
  }

  if (currentUser.user_level === "ADMIN" && userLevel !== "ADMIN") {
    const adminCount = await usersRepository.countActiveAdmins();
    if (Number(adminCount?.count ?? 0) <= 1) {
      throw new ApiError(
        409,
        "O sistema precisa manter pelo menos um administrador ativo.",
      );
    }
  }

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
