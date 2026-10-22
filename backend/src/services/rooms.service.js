import crypto from "node:crypto";
import { HttpError } from "../utils/http-error.js";
import * as rooms from "../repositories/rooms.repository.js";

export async function requireRoomAccess(user, roomId) {
  const room = await rooms.findRoomById(roomId);
  if (!room) throw new HttpError(404, "Sala não encontrada");
  if (user.user_level !== "admin" && !(await rooms.hasRoomCollaborator(room.id, user.id))) {
    throw new HttpError(403, "Sem acesso a esta sala");
  }
  return room;
}

export async function listRooms(user) {
  return user.user_level === "admin" ? rooms.listRoomsForAdmin() : rooms.listRoomsForCollaborator(user.id);
}

export async function createRoom(input) {
  const [id] = await rooms.createRoom(input);
  const room = await rooms.findRoomById(id);
  const { device_credential_hash, ...safe } = room;
  return safe;
}

export async function getRoom(user, id) {
  const room = await requireRoomAccess(user, id);
  return { room };
}

export async function updateRoom(id, changes) {
  const exists = await rooms.findRoomById(id);
  if (!exists) throw new HttpError(404, "Sala não encontrada");
  await rooms.updateRoom(id, { ...changes, updated_at: new Date().toISOString() });
  return rooms.findRoomById(id);
}

export async function deleteRoom(id) {
  if (!(await rooms.deleteRoom(id))) throw new HttpError(404, "Sala não encontrada");
}

export async function rotateDeviceCredential(id) {
  const room = await rooms.findRoomById(id);
  if (!room) throw new HttpError(404, "Sala não encontrada");
  const credential = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(credential).digest("hex");
  await rooms.updateDeviceCredential(id, hash);
  return { room_id: id, credential };
}
