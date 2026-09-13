import * as collaboratorsRepository from "../repositories/collaborators.repository.js";
import * as roomsRepository from "../repositories/rooms.repository.js";
import * as sensorsRepository from "../repositories/sensors.repository.js";
import * as usersRepository from "../repositories/users.repository.js";
import { nowIso } from "../utils/datetime.js";
import { ApiError, notFound } from "../utils/errors.js";

export function listRooms(user) {
  return roomsRepository.listRoomsForUser(user);
}

export function createRoom(payload) {
  return roomsRepository.createRoom(payload);
}

export async function getRoom(user, roomId) {
  await assertCanReadRoom(user, roomId);

  const room = await roomsRepository.findRoomById(roomId);
  if (!room) {
    throw notFound("Sala");
  }

  const sensors = await sensorsRepository.listSensorsByRoom(room.id);
  return { room, sensors };
}

export async function updateRoom(roomId, payload) {
  const room = await roomsRepository.updateRoom(roomId, payload);

  if (!room) {
    throw notFound("Sala");
  }

  return room;
}

export async function deleteRoom(roomId) {
  const deleted = await roomsRepository.deleteRoom(roomId);

  if (!deleted) {
    throw notFound("Sala");
  }
}

export async function handshake(routeRoomId, payload) {
  if (routeRoomId !== payload.room_id) {
    throw new ApiError(400, "room_id do corpo deve ser igual ao id da rota.");
  }

  const room = await roomsRepository.findRoomByIdAndMac(routeRoomId, payload.mac_address);
  if (!room) {
    throw new ApiError(403, "Sala ou MAC address invalido.");
  }

  const user = await usersRepository.findActiveUserById(payload.user_id);
  if (!user) {
    throw new ApiError(403, "Usuario informado no handshake nao existe ou esta desativado.");
  }

  await roomsRepository.touchRoomLastSeen(room.id, nowIso());
  const sensors = await sensorsRepository.listSensorsByRoom(room.id);

  return {
    ok: true,
    room: {
      id: room.id,
      name: room.name,
      classroom_code: room.classroom_code
    },
    sensors
  };
}

export async function listCommands(roomId, macAddress) {
  const room = await roomsRepository.findRoomByIdAndMac(roomId, macAddress);

  if (!room) {
    throw new ApiError(403, "Sala ou MAC address invalido.");
  }

  await roomsRepository.touchRoomLastSeen(room.id, nowIso());
  const commands = await sensorsRepository.listRoomOutputCommands(room.id);

  return { room_id: room.id, commands };
}

export async function assertRoomExists(roomId) {
  const room = await roomsRepository.findRoomById(roomId);

  if (!room) {
    throw notFound("Sala");
  }

  return room;
}

export async function assertCanReadRoom(user, roomId) {
  if (user.user_level === "ADMIN") return;

  const collaborator = await collaboratorsRepository.findRoomCollaborator(roomId, user.id);

  if (!collaborator) {
    throw new ApiError(403, "Voce nao tem acesso a esta sala.");
  }
}
