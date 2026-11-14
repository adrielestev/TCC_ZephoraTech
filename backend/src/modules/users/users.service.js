"use strict";

const AppError = require("../../shared/errors");
const { transaction } = require("../../database/db");
const { saveImage, removeFile, fileUrl } = require("../../shared/files");
const { ROLES } = require("../../shared/roles");
const usersRepository = require("./users.repository");
const roomsRepository = require("../rooms/rooms.repository");

const toPublic = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: fileUrl(user.avatar_path),
  emailVerified: Boolean(user.email_verified_at),
  isActive: Boolean(user.is_active),
  createdAt: user.created_at,
});

function getOrFail(id) {
  const user = usersRepository.findById(id);
  if (!user)
    throw AppError.notFound("Usuário não encontrado", "USER_NOT_FOUND");
  return user;
}

const get = (id) => toPublic(getOrFail(id));

function list(query) {
  const { rows, total } = usersRepository.list(query);
  return {
    data: rows.map(toPublic),
    total,
    limit: query.limit,
    offset: query.offset,
  };
}

function updateProfile(userId, { name }) {
  usersRepository.updateName(userId, name);
  return get(userId);
}

async function setAvatar(userId, file) {
  const user = getOrFail(userId);
  const newPath = await saveImage(file, "avatars");
  usersRepository.updateAvatar(userId, newPath);
  await removeFile(user.avatar_path);
  return get(userId);
}

async function removeAvatar(userId) {
  const user = getOrFail(userId);
  usersRepository.updateAvatar(userId, null);
  await removeFile(user.avatar_path);
  return get(userId);
}

/** Promove/rebaixa (rota restrita ao owner). O owner e o próprio ator não podem ser alterados. */
function changeRole(actor, targetId, role) {
  const target = getOrFail(targetId);
  if (target.id === actor.id || target.role === ROLES.OWNER) {
    throw AppError.forbidden(
      "O admin padrão da instituição não pode ser alterado",
      "OWNER_PROTECTED",
    );
  }
  usersRepository.setRole(target.id, role);
  return get(target.id);
}

function changeStatus(actor, targetId, isActive) {
  const target = getOrFail(targetId);
  if (target.id === actor.id || target.role === ROLES.OWNER) {
    throw AppError.forbidden(
      "Esta conta não pode ser desativada",
      "OWNER_PROTECTED",
    );
  }
  if (target.role === ROLES.ADMIN && actor.role !== ROLES.OWNER) {
    throw AppError.forbidden("Somente o admin padrão pode alterar outro admin");
  }
  usersRepository.setActive(target.id, isActive);
  return get(target.id);
}

function getRoomIds(targetId) {
  getOrFail(targetId);
  return { roomIds: roomsRepository.listAccessRoomIds(targetId) };
}

/** Substitui o conjunto de salas de um usuário comum (admins já acessam todas). */
function setRoomAccess(actor, targetId, roomIds) {
  const target = getOrFail(targetId);
  if (target.role !== ROLES.MEMBER) {
    throw AppError.badRequest(
      "Admins já têm acesso a todas as salas",
      "ADMIN_HAS_FULL_ACCESS",
    );
  }
  const unique = [...new Set(roomIds)];
  if (roomsRepository.countByIds(unique) !== unique.length) {
    throw AppError.notFound("Uma ou mais salas não existem", "ROOM_NOT_FOUND");
  }
  transaction(() =>
    roomsRepository.replaceUserAccess(target.id, unique, actor.id),
  );
  return { roomIds: roomsRepository.listAccessRoomIds(target.id) };
}

module.exports = {
  toPublic,
  getOrFail,
  get,
  list,
  updateProfile,
  setAvatar,
  removeAvatar,
  changeRole,
  changeStatus,
  getRoomIds,
  setRoomAccess,
};
