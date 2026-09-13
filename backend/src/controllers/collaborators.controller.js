import * as collaboratorsService from "../services/collaborators.service.js";

export async function listCollaborators(req, res) {
  const collaborators = await collaboratorsService.listCollaborators(req.params.roomId);
  res.json({ collaborators });
}

export async function createCollaborator(req, res) {
  const collaborator = await collaboratorsService.createCollaborator(
    req.params.roomId,
    req.body.user_id,
    req.user.id
  );

  res.status(201).json({ collaborator });
}

export async function deleteCollaborator(req, res) {
  await collaboratorsService.deleteCollaborator(req.params.roomId, req.params.id);
  res.status(204).send();
}
