// Aplica as regras de negócio para salas, acessos e fotos.
'use strict';

const AppError = require('../../shared/errors');
const { isUniqueViolation } = require('../../database/db');
const { saveImage, removeFile, fileUrl } = require('../../shared/files');
const { isAdmin } = require('../../shared/roles');
const usersService = require('../users/users.service');
const roomsRepository = require('./rooms.repository');

const toPublic = (room) => ({
  id: room.id,
  name: room.name,
  description: room.description,
  photos: [1, 2, 3]
    .map((slot) => ({ slot, url: fileUrl(room[`photo_${slot}_path`]) }))
    .filter((photo) => photo.url),
  deviceCount: room.device_count,
  createdAt: room.created_at,
  updatedAt: room.updated_at,
});

const roomNotFound = () => AppError.notFound('Sala não encontrada', 'ROOM_NOT_FOUND');

/**
 * Garante que a sala existe e que o usuário pode acessá-la.
 * Sem permissão devolve 404 (não revela quais salas existem).
 */
function getAccessible(user, roomId) {
  const room = roomsRepository.findById(roomId);
  if (!room || (!isAdmin(user) && !roomsRepository.hasAccess(user.id, roomId)))
    throw roomNotFound();
  return room;
}

function getOrFail(roomId) {
  const room = roomsRepository.findById(roomId);
  if (!room) throw roomNotFound();
  return room;
}

const list = (user) => ({
  data: (isAdmin(user) ? roomsRepository.listAll() : roomsRepository.listForUser(user.id)).map(
    toPublic,
  ),
});

const get = (user, roomId) => toPublic(getAccessible(user, roomId));

function create(user, { name, description }) {
  try {
    return toPublic(roomsRepository.insert({ name, description, createdBy: user.id }));
  } catch (err) {
    if (isUniqueViolation(err))
      throw AppError.conflict('Já existe uma sala com esse nome', 'ROOM_NAME_TAKEN');
    throw err;
  }
}

function update(roomId, patch) {
  getOrFail(roomId);
  try {
    roomsRepository.update(roomId, patch);
  } catch (err) {
    if (isUniqueViolation(err))
      throw AppError.conflict('Já existe uma sala com esse nome', 'ROOM_NAME_TAKEN');
    throw err;
  }
  return toPublic(getOrFail(roomId));
}

async function remove(roomId) {
  const room = getOrFail(roomId);
  if (room.device_count > 0) {
    throw AppError.conflict(
      'Remova ou mova os aparelhos da sala antes de excluí-la',
      'ROOM_HAS_DEVICES',
    );
  }
  roomsRepository.remove(roomId);
  await Promise.all([1, 2, 3].map((slot) => removeFile(room[`photo_${slot}_path`])));
}

async function setPhoto(roomId, slot, file) {
  const room = getOrFail(roomId);
  const newPath = await saveImage(file, 'rooms');
  roomsRepository.setPhoto(roomId, slot, newPath);
  await removeFile(room[`photo_${slot}_path`]);
  return toPublic(getOrFail(roomId));
}

async function removePhoto(roomId, slot) {
  const room = getOrFail(roomId);
  roomsRepository.setPhoto(roomId, slot, null);
  await removeFile(room[`photo_${slot}_path`]);
  return toPublic(getOrFail(roomId));
}

function listAccess(roomId) {
  getOrFail(roomId);
  return {
    data: roomsRepository.listUsersWithAccess(roomId).map(usersService.toPublic),
  };
}

module.exports = {
  getAccessible,
  getOrFail,
  list,
  get,
  create,
  update,
  remove,
  setPhoto,
  removePhoto,
  listAccess,
};
