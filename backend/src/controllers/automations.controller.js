import * as automations from "../services/automations.service.js";
import * as rooms from "../services/rooms.service.js";

export async function listForRoom(req, res) {
  await rooms.requireRoomAccess(req.user, req.params.id);
  res.json({ automations: await automations.listForRoom(req.params.id) });
}
export async function create(req, res) {
  await rooms.requireRoomAccess(req.user, req.params.id);
  res
    .status(201)
    .json({ automation: await automations.create(req.params.id, req.body) });
}
export async function update(req, res) {
  res.json({ automation: await automations.update(req.params.id, req.body) });
}
export async function remove(req, res) {
  await automations.remove(req.params.id);
  res.status(204).end();
}
