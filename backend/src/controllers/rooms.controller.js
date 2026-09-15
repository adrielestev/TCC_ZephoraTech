import * as roomsService from "../services/rooms.service.js";

export async function listRooms(req, res) {
  const rooms = await roomsService.listRooms(req.user);
  res.json({ rooms });
}

export async function createRoom(req, res) {
  const room = await roomsService.createRoom(req.body);
  res.status(201).json({ room });
}

export async function getRoom(req, res) {
  const data = await roomsService.getRoom(req.user, req.params.id);
  res.json(data);
}

export async function updateRoom(req, res) {
  const room = await roomsService.updateRoom(req.params.id, req.body);
  res.json({ room });
}

export async function updateRoomPhoto(req, res) {
  const room = await roomsService.updateRoomPhoto(
    req.params.id,
    Number(req.params.slot),
    req.file,
  );
  res.json({ room });
}

export async function removeRoomPhoto(req, res) {
  await roomsService.removeRoomPhoto(
    req.params.id,
    Number(req.params.slot),
  );
  res.status(204).send();
}

export async function deleteRoom(req, res) {
  await roomsService.deleteRoom(req.params.id);
  res.status(204).send();
}

export async function handshake(req, res) {
  const data = await roomsService.handshake(req.params.id, req.body);
  res.json(data);
}

export async function listCommands(req, res) {
  const data = await roomsService.listCommands(
    req.params.roomId,
    req.query.mac_address,
  );
  res.json(data);
}
