import * as collaboratorsRepository from "../repositories/collaborators.repository.js";
import * as usersRepository from "../repositories/users.repository.js";
import { ApiError, notFound } from "../utils/errors.js";
import { assertRoomExists } from "./rooms.service.js";

export async function listCollaborators(roomId) {
  await assertRoomExists(roomId);
  return collaboratorsRepository.listRoomCollaborators(roomId);
}

export async function createCollaborator(roomId, userId, addedBy) {
  await assertRoomExists(roomId);

  const user = await usersRepository.findActiveUserById(userId);
  if (!user) {
    throw notFound("Usuario");
  }

  if (!user.is_email_verified) {
    throw new ApiError(
      400,
      "Usuario precisa verificar o e-mail antes de colaborar.",
    );
  }

  return collaboratorsRepository.createRoomCollaborator({
    room_id: roomId,
    user_id: userId,
    added_by: addedBy,
  });
}

export async function deleteCollaborator(roomId, collaboratorId) {
  const deleted = await collaboratorsRepository.deleteRoomCollaborator(
    collaboratorId,
    roomId,
  );

  if (!deleted) {
    throw notFound("Colaborador");
  }
}
