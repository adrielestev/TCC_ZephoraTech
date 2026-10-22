import * as rooms from "../services/rooms.service.js";
import * as devices from "../services/devices.service.js";
import { deviceOperatorView, deviceView } from "../serializers/device.serializer.js";

export async function listForRoom(req, res) {
  await rooms.requireRoomAccess(req.user, req.params.id);
  const admin = req.user.user_level === "admin";
  res.json({ devices: (await devices.listForRoom(req.params.id)).map(admin ? deviceView : deviceOperatorView) });
}
export async function create(req, res) {
  res.status(201).json({ device: deviceView(await devices.create(req.params.id, req.body)) });
}
export async function update(req, res) {
  res.json({ device: deviceView(await devices.update(req.params.id, req.body)) });
}
export async function remove(req, res) {
  await devices.remove(req.params.id);
  res.status(204).end();
}
export async function command(req, res) {
  const result = await devices.command(req.user, req.params.id, req.body.value, rooms.requireRoomAccess);
  res.json({ device: req.user.user_level === "admin" ? deviceView(result) : deviceOperatorView(result) });
}
