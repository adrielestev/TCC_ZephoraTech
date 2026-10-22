import { HttpError } from "../utils/http-error.js";
import * as rooms from "../repositories/rooms.repository.js";
import * as collaborators from "../repositories/collaborators.repository.js";
import * as users from "../repositories/users.repository.js";

export async function list(roomId) {
  if (!(await rooms.findRoomById(roomId))) throw new HttpError(404, "Sala não encontrada");
  return collaborators.listForRoom(roomId);
}

export async function add(roomId, userId, adminId) {
  const [room, user] = await Promise.all([rooms.findRoomById(roomId), users.findActiveById(userId)]);
  if (!room) throw new HttpError(404, "Sala não encontrada");
  if (!user) throw new HttpError(404, "Usuário não encontrado");
  if (user.user_level === "admin") throw new HttpError(400, "Administradores já acessam todas as salas");
  const [id] = await collaborators.add(roomId, userId, adminId);
  return collaborators.findById(id);
}

export async function remove(id, roomId) {
  if (!(await collaborators.remove(id, roomId))) throw new HttpError(404, "Colaborador não encontrado");
}
