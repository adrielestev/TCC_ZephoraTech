import { HttpError } from "../utils/http-error.js";
import * as users from "../repositories/users.repository.js";

export async function getActiveUser(id) {
  const user = await users.findActiveById(id);
  if (!user) throw new HttpError(404, "Usuário não encontrado");
  return user;
}

export async function listUsers() { return users.listActiveUsers(); }

export async function updateProfile(id, changes) {
  await getActiveUser(id);
  await users.updateUser(id, { ...changes, updated_at: new Date().toISOString() });
  return getActiveUser(id);
}

export async function changeRole(actorId, targetId, role) {
  const user = await getActiveUser(targetId);
  if (user.id === actorId && role !== "admin") throw new HttpError(400, "Não é possível remover o próprio papel de administrador");
  await users.updateUser(user.id, { user_level: role, updated_at: new Date().toISOString() });
  return getActiveUser(user.id);
}

