import * as collaborators from "../services/collaborators.service.js";

export async function list(req, res) {
  res.json({ collaborators: await collaborators.list(req.params.id) });
}
export async function add(req, res) {
  res.status(201).json({ collaborator: await collaborators.add(req.params.id, req.body.user_id, req.user.id) });
}
export async function remove(req, res) {
  await collaborators.remove(req.params.collaboratorId, req.params.id);
  res.status(204).end();
}
