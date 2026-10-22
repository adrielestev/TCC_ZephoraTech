import * as rooms from "../services/rooms.service.js";
import * as devices from "../services/devices.service.js";
import { roomView } from "../serializers/room.serializer.js";
import { deviceOperatorView, deviceView } from "../serializers/device.serializer.js";
import * as storage from "../services/file-storage.service.js";

async function removePreviousImage(filename) {
  if (!filename) return;
  try { await storage.deleteImage(filename); } catch (error) { console.error("Falha ao remover imagem substituída", error); }
}

export async function list(req, res) {
  res.json({ rooms: (await rooms.listRooms(req.user)).map((room) => roomView(room, req.user.user_level === "admin")) });
}
export async function create(req, res) {
  res.status(201).json({ room: roomView(await rooms.createRoom(req.body), true) });
}
export async function get(req, res) {
  const result = await rooms.getRoom(req.user, req.params.id);
  const admin = req.user.user_level === "admin";
  const roomDevices = await devices.listForRoom(req.params.id);
  res.json({ room: roomView(result.room, admin), devices: roomDevices.map(admin ? deviceView : deviceOperatorView) });
}
export async function update(req, res) {
  res.json({ room: roomView(await rooms.updateRoom(req.params.id, req.body), true) });
}
export async function remove(req, res) {
  const { room } = await rooms.getRoom(req.user, req.params.id);
  await rooms.deleteRoom(req.params.id);
  await Promise.all([room.room_photo_1, room.room_photo_2, room.room_photo_3].map(removePreviousImage));
  res.status(204).end();
}
export async function rotateCredential(req, res) {
  res.json({ ...await rooms.rotateDeviceCredential(req.params.id), message: "Guarde a credencial; ela será exibida somente nesta resposta." });
}

export async function uploadPhoto(req, res) {
  const room = await rooms.getRoom(req.user, req.params.id);
  const column = `room_photo_${req.params.slot}`;
  const filename = await storage.saveImage(req.validatedImage);
  let updated;
  try {
    updated = await rooms.updateRoom(room.room.id, { [column]: filename });
  } catch (error) {
    await storage.deleteImage(filename);
    throw error;
  }
  await removePreviousImage(room.room[column]);
  res.json({ room: roomView(updated, true) });
}

export async function deletePhoto(req, res) {
  const room = await rooms.getRoom(req.user, req.params.id);
  const column = `room_photo_${req.params.slot}`;
  const updated = await rooms.updateRoom(room.room.id, { [column]: null });
  await removePreviousImage(room.room[column]);
  res.json({ room: roomView(updated, true) });
}
