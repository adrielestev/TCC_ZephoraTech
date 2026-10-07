import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import * as collaboratorsRepository from "../repositories/collaborators.repository.js";
import * as roomsRepository from "../repositories/rooms.repository.js";
import * as sensorsRepository from "../repositories/sensors.repository.js";
import { nowIso } from "../utils/datetime.js";
import { ApiError, notFound } from "../utils/errors.js";
import * as fileStorage from "./file-storage.service.js";

export function listRooms(user) {
  return roomsRepository
    .listRoomsForUser(user)
    .then((rooms) => rooms.map((room) => toPublicRoom(room, user)));
}

export async function createRoom(payload) {
  return toPublicRoom(await roomsRepository.createRoom(payload));
}

export async function getRoom(user, roomId) {
  await assertCanReadRoom(user, roomId);

  const room = await roomsRepository.findRoomById(roomId);
  if (!room) {
    throw notFound("Sala");
  }

  const sensors = await sensorsRepository.listSensorsByRoom(room.id);
  return {
    room: toPublicRoom(room, user),
    sensors: sensors.map((sensor) =>
      user.user_level === "ADMIN" ? sensor : sensorsRepository.toPublicSensor(sensor),
    ),
  };
}

export async function updateRoom(roomId, payload) {
  const room = await roomsRepository.updateRoom(roomId, payload);

  if (!room) {
    throw notFound("Sala");
  }

  return toPublicRoom(room);
}

export async function updateRoomPhoto(roomId, slot, file) {
  const room = await roomsRepository.findRoomById(roomId);
  if (!room) throw notFound("Sala");

  const photoUrl = await fileStorage.saveImage(file, "rooms");
  await roomsRepository.updateRoomPhoto(roomId, slot, photoUrl);
  await fileStorage.removeImage(room[`room_photo_${slot}`]);

  return toPublicRoom({ ...room, [`room_photo_${slot}`]: photoUrl });
}

export async function removeRoomPhoto(roomId, slot) {
  const room = await roomsRepository.findRoomById(roomId);
  if (!room) throw notFound("Sala");

  await roomsRepository.updateRoomPhoto(roomId, slot, null);
  await fileStorage.removeImage(room[`room_photo_${slot}`]);
}

export async function deleteRoom(roomId) {
  const deleted = await roomsRepository.deleteRoom(roomId);

  if (!deleted) {
    throw notFound("Sala");
  }
}

export async function authenticateDevice(roomId, macAddress, credential) {
  const room = await roomsRepository.findRoomById(roomId);
  const credentialHash = room?.device_credential_hash;
  const providedHash = createHash("sha256").update(credential).digest();
  const storedHash = credentialHash ? Buffer.from(credentialHash, "hex") : null;
  const credentialMatches =
    storedHash?.length === providedHash.length &&
    timingSafeEqual(storedHash, providedHash);

  if (!room || room.mac_address !== macAddress || !credentialMatches) {
    throw new ApiError(401, "Credenciais do dispositivo invalidas.");
  }

  return room;
}

export async function generateDeviceCredential(roomId) {
  const room = await roomsRepository.findRoomById(roomId);
  if (!room) throw notFound("Sala");

  const credential = randomBytes(32).toString("hex");
  const credentialHash = createHash("sha256").update(credential).digest("hex");
  await roomsRepository.updateRoom(roomId, {
    device_credential_hash: credentialHash,
  });

  return credential;
}

export async function handshake(room) {
  await roomsRepository.touchRoomLastSeen(room.id, nowIso());
  const sensors = await sensorsRepository.listSensorsByRoom(room.id);

  return {
    ok: true,
    room: {
      id: room.id,
      name: room.name,
      classroom_code: room.classroom_code,
    },
    sensors,
  };
}

export async function listCommands(room) {
  await roomsRepository.touchRoomLastSeen(room.id, nowIso());
  const commands = await sensorsRepository.listRoomOutputCommands(room.id);

  return { room_id: room.id, commands };
}

function toPublicRoom(room, user = { user_level: "ADMIN" }) {
  if (!room) return room;
  const publicRoom = {
    ...room,
    has_device_credential: Boolean(room.device_credential_hash),
  };
  delete publicRoom.device_credential_hash;
  if (user.user_level !== "ADMIN") {
    delete publicRoom.mac_address;
    delete publicRoom.has_device_credential;
  }
  for (const photoField of ["room_photo_1", "room_photo_2", "room_photo_3"]) {
    publicRoom[photoField] = fileStorage.createSignedMediaUrl(publicRoom[photoField]);
  }
  return publicRoom;
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

  const collaborator = await collaboratorsRepository.findRoomCollaborator(
    roomId,
    user.id,
  );

  if (!collaborator) {
    throw new ApiError(403, "Voce nao tem acesso a esta sala.");
  }
}
